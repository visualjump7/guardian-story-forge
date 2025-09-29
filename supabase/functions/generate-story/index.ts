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
    const { heroName, storyType, themeId } = await req.json();

    if (!heroName || !storyType || !themeId) {
      throw new Error("Missing required fields");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get theme details
    const { data: theme, error: themeError } = await supabase
      .from("story_themes")
      .select("*")
      .eq("id", themeId)
      .single();

    if (themeError || !theme) {
      throw new Error("Theme not found");
    }

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

    // Generate story using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a creative children's story writer. Create engaging, age-appropriate stories (ages 5-12) that teach important life lessons. 

The story should:
- Be 400-600 words long
- Include vivid descriptions and engaging dialogue
- Have a clear beginning, middle, and end
- Teach the moral lesson naturally through the story events
- Be appropriate for children
- Include moments of excitement and wonder
- End with a positive resolution that reinforces the lesson

Write in a warm, friendly tone that captivates young readers.`;

    const userPrompt = `Create a ${storyType} story with these details:

Hero's Name: ${heroName}
Story Type: ${storyType}
Moral Theme: ${theme.name} - ${theme.description}

The story should naturally incorporate the theme of "${theme.name}" (${theme.description}) through the hero's adventure and choices. Make it exciting, magical, and memorable!`;

    console.log("Generating story with AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate story with AI");
    }

    const aiData = await aiResponse.json();
    const storyContent = aiData.choices?.[0]?.message?.content;

    if (!storyContent) {
      throw new Error("No story content generated");
    }

    // Create a title from the first line or generate one
    const titleMatch = storyContent.match(/^#\s*(.+)/m);
    const title = titleMatch 
      ? titleMatch[1].trim()
      : `The Adventures of ${heroName}`;

    // Remove title from content if it exists
    const cleanContent = storyContent.replace(/^#\s*.+\n\n/, "");

    console.log("Saving story to database...");

    // Save story to database
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert({
        title,
        content: cleanContent,
        hero_name: heroName,
        story_type: storyType,
        theme_id: themeId,
        is_public: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (storyError) {
      console.error("Database error:", storyError);
      throw new Error("Failed to save story");
    }

    console.log("Story created successfully:", story.id);

    // Generate cover image automatically
    console.log("Generating cover image...");
    try {
      const imagePrompt = `Create a vibrant 3D animated illustration in Pixar/DreamWorks style. Feature ${heroName} as the main character in a ${storyType} setting. Scene: ${cleanContent.substring(0, 200)}. Art style: colorful, family-friendly, high-quality 3D CGI animation with soft lighting, expressive characters, and magical atmosphere. Disney/Pixar quality rendering with rich details and warm colors.`;

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          await supabase
            .from("stories")
            .update({ cover_image_url: imageUrl })
            .eq("id", story.id);
          console.log("Cover image generated and saved");
        }
      }
    } catch (imageError) {
      console.error("Failed to generate image, but story was created:", imageError);
      // Continue anyway - story is still valid without image
    }

    return new Response(
      JSON.stringify({ storyId: story.id, title, content: cleanContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-story function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
