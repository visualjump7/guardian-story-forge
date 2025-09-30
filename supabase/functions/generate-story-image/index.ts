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
    const { storyId } = await req.json();

    if (!storyId) {
      throw new Error("Missing storyId");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get story details
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*, story_themes(name, emoji)")
      .eq("id", storyId)
      .eq("created_by", user.id)
      .single();

    if (storyError || !story) {
      throw new Error("Story not found");
    }

    // Check if there are already 3 images
    const { count } = await supabase
      .from("story_images")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId);

    if (count && count >= 3) {
      throw new Error("Maximum 3 images per story reached");
    }

    // Generate image using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Map art style to prompt description
    const artStylePrompts: Record<string, string> = {
      'pixar-3d': 'vibrant 3D animated illustration in Pixar/DreamWorks style with rich colors and cinematic lighting',
      'ghibli-2d': 'soft watercolor 2D illustration in Studio Ghibli style with gentle brushstrokes and dreamy atmosphere',
      'watercolor': 'gentle watercolor children\'s book illustration with soft edges and delicate color blending',
      'classic-disney': 'traditional hand-drawn 2D animation in classic Disney style with expressive characters and detailed backgrounds',
      'modern-cartoon': 'bold modern 2D cartoon style with clean lines, vibrant colors, and dynamic composition',
      'anime': 'Japanese anime style illustration with detailed character designs and atmospheric lighting',
      'comic-book': 'dynamic comic book style illustration with bold outlines and dramatic composition'
    };

    const styleDescription = artStylePrompts[story.art_style || 'pixar-3d'] || artStylePrompts['pixar-3d'];

    // Extract first paragraph as scene description
    const firstParagraph = story.content.split("\n\n")[0];
    const sceneDescription = firstParagraph.substring(0, 200);

    const imagePrompt = `Create a child-friendly cover illustration in ${styleDescription}. Feature ${story.hero_name} as the main character in a ${story.story_type} setting. Scene: ${sceneDescription}. Art style: colorful, family-friendly, high-quality with expressive characters and magical atmosphere.`;

    console.log("Generating image with AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "user", content: imagePrompt }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate image with AI");
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    console.log("Saving image to story_images table...");

    // Check if this is the first image - if so, mark it as selected
    const isFirstImage = (count || 0) === 0;

    // Save image to story_images table
    const { error: insertError } = await supabase
      .from("story_images")
      .insert({
        story_id: storyId,
        image_url: imageUrl,
        is_selected: isFirstImage
      });

    if (insertError) {
      console.error("Database error:", insertError);
      throw new Error("Failed to save image");
    }

    console.log("Image generated and saved successfully");

    return new Response(
      JSON.stringify({ imageUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-story-image function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
