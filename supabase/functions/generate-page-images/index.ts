import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      storyId, 
      pageNumbers, // Array of page indices to generate
      trigger // 'on_page_visible' | 'on_user_tap'
    } = await req.json();
    
    const authHeader = req.headers.get("Authorization")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();

    if (storyError || !story) throw new Error("Story not found");
    if (story.created_by !== user.id) throw new Error("Forbidden");

    // Load config (Band A or B based on age)
    const ageBand = story.age_range === '5-7' ? 'A' : 'B';
    const configPath = `./configs/age-band-${ageBand.toLowerCase()}.json`;
    const configText = await Deno.readTextFile(configPath);
    const config = JSON.parse(configText);

    const artPolicy = config.art_policy;
    const maxImages = artPolicy.band_defaults[ageBand].max_images_per_story;

    // Check story image count
    const { count: currentCount } = await supabase
      .from("story_images")
      .select("*", { count: 'exact', head: true })
      .eq("story_id", storyId);

    if ((currentCount || 0) + pageNumbers.length > maxImages) {
      return new Response(
        JSON.stringify({
          error: 'STORY_LIMIT_EXCEEDED',
          message: `Story limit: ${maxImages}. Current: ${currentCount}, Requested: ${pageNumbers.length}`,
          max: maxImages,
          current: currentCount
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check monthly limit
    const { data: usageData } = await supabase.rpc('get_user_image_usage', { p_user_id: user.id });
    
    if (!usageData || usageData.length === 0 || usageData[0].remaining < pageNumbers.length) {
      return new Response(
        JSON.stringify({
          error: 'MONTHLY_LIMIT_EXCEEDED',
          message: `Monthly limit reached. Remaining: ${usageData?.[0]?.remaining || 0}`,
          limit: usageData?.[0]?.images_limit || 150,
          used: usageData?.[0]?.images_generated || 0,
          remaining: usageData?.[0]?.remaining || 0
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get style lock from first image
    const { data: firstImage } = await supabase
      .from("story_images")
      .select("style_lock_data")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    const styleLock = firstImage?.style_lock_data || {
      style: story.art_style,
      palette: "vibrant, kid-friendly colors",
      camera: "medium shot"
    };

    const characterSheet = story.character_sheet?.ai_augmented?.appearance || 
      `${story.hero_name}, ${story.character_archetype}`;

    const storyPages = story.story_json?.pages || [];
    const results = [];

    // Process with concurrency limit
    const concurrencyLimit = artPolicy.performance.concurrency_limit || 2;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    for (let i = 0; i < pageNumbers.length; i += concurrencyLimit) {
      const batch = pageNumbers.slice(i, i + concurrencyLimit);
      const promises = batch.map(async (pageIdx: number) => {
        try {
          const page = storyPages[pageIdx];
          const artPrompt = page?.art_prompt;
          if (!artPrompt) return { success: false, pageNumber: pageIdx, error: "No art prompt" };

          let imagePrompt = `${artPolicy.safety.kid_safe ? 'Kid-safe, friendly, ' : ''}`;
          imagePrompt += `Style: ${styleLock.style}, Palette: ${styleLock.palette}, Camera: ${styleLock.camera}. `;
          imagePrompt += `Character: ${characterSheet}. `;
          imagePrompt += `${artPrompt.content}`;

          const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: artPolicy.image_model,
              messages: [{ role: "user", content: imagePrompt }],
              modalities: ["image", "text"]
            }),
          });

          if (!imgResponse.ok) throw new Error("Image generation failed");

          const imgData = await imgResponse.json();
          const base64Image = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!base64Image) throw new Error("No image URL");

          // For now, use data URL directly (storage upload to be added later)
          const fullResUrl = base64Image;
          const thumbnailUrl = base64Image;
          const storagePath = `${user.id}/${storyId}/page-${pageIdx + 1}-v1.png`;

          // Save to database
          const { error: insertError } = await supabase.from("story_images").insert({
            story_id: storyId,
            image_url: fullResUrl,
            thumbnail_url: thumbnailUrl,
            full_res_url: fullResUrl,
            storage_path: storagePath,
            page_number: pageIdx + 1,
            page_beat: page.beat,
            image_type: page.beat || 'scene',
            is_upfront: false,
            is_suggested: true,
            generated_by_trigger: trigger,
            generation_prompt: imagePrompt,
            style_lock_data: styleLock,
            image_size_px: 896,
            version: 1
          });

          if (insertError) throw insertError;

          return {
            success: true,
            pageNumber: pageIdx,
            beat: page.beat,
            prompt: imagePrompt,
            fullResUrl,
            thumbnailUrl,
            storagePath
          };

        } catch (error: any) {
          return { success: false, pageNumber: pageIdx, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    // Increment usage
    const successCount = results.filter(r => r.success).length;
    await supabase.rpc('increment_user_image_usage', { 
      p_user_id: user.id, 
      p_count: successCount 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: successCount,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});