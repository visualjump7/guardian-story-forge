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
      heroName, 
      storyType, 
      themeId, 
      narrativeStructure,
      storyLength = "medium",
      ageRange = "8-10",
      setting,
      secondaryThemeId,
      artStyle = "pixar-3d"
    } = await req.json();

    if (!heroName || !storyType || !themeId || !narrativeStructure) {
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

    // Get secondary theme if provided
    let secondaryTheme = null;
    if (secondaryThemeId) {
      const { data } = await supabase
        .from("story_themes")
        .select("*")
        .eq("id", secondaryThemeId)
        .single();
      secondaryTheme = data;
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

    // Word count based on length
    const wordCounts = {
      short: "300-400 words",
      medium: "500-700 words", 
      long: "800-1000 words"
    };

    // Vocabulary and complexity based on age
    const ageGuidelines = {
      "5-7": "Use simple vocabulary, short sentences (5-10 words), and clear language. Focus on concrete concepts and familiar situations.",
      "8-10": "Use moderate vocabulary with some challenging words, varied sentence structures, and introduce abstract concepts gradually.",
      "11-12": "Use sophisticated vocabulary, complex sentences, and explore nuanced themes with deeper emotional complexity."
    };

    // Narrative structure descriptions
    const narrativeDescriptions = {
      "heros-journey": "Follow the classic Hero's Journey: ordinary world, call to adventure, crossing threshold, tests and challenges, transformation, return with wisdom",
      "problem-solution": "Present a clear problem early, show the character's attempts to solve it, and conclude with a creative solution",
      "rags-to-riches": "Begin with the character in a humble or difficult situation, show their growth through challenges, end with success and transformation",
      "voyage-return": "Send the character on a journey to an unfamiliar place, show their discoveries and challenges, bring them home changed",
      "quest": "Give the character a specific goal or item to find, create obstacles along the way, conclude when the quest is fulfilled",
      "overcoming-monster": "Introduce a challenge or 'monster' (literal or metaphorical), build tension, show the character's courage in overcoming it"
    };

    const systemPrompt = `You are a creative children's story writer. Create engaging, age-appropriate stories that teach important life lessons. 

The story should:
- Be ${wordCounts[storyLength as keyof typeof wordCounts]} long
- ${ageGuidelines[ageRange as keyof typeof ageGuidelines]}
- Follow the ${narrativeStructure} narrative structure: ${narrativeDescriptions[narrativeStructure as keyof typeof narrativeDescriptions]}
- Include vivid descriptions and engaging dialogue
- Have a clear beginning, middle, and end
- Teach the moral lesson naturally through the story events
- Be appropriate for children ages ${ageRange}
- Include moments of excitement and wonder
- End with a positive resolution that reinforces the lesson

Write in a warm, friendly tone that captivates young readers.`;

    const settingDescription = setting ? `\nSetting: ${setting.replace(/-/g, ' ')} - Make this setting come alive with rich sensory details.` : '';
    const secondaryThemeText = secondaryTheme ? `\n\nSecondary Theme: Also weave in the lesson of "${secondaryTheme.name}" (${secondaryTheme.description}) as a supporting element in the story.` : '';

    const userPrompt = `Create a ${storyType} story with these details:

Hero's Name: ${heroName}
Story Type: ${storyType}
Narrative Structure: ${narrativeStructure}
Primary Moral Theme: ${theme.name} - ${theme.description}${secondaryThemeText}${settingDescription}
Age Range: ${ageRange}
Length: ${wordCounts[storyLength as keyof typeof wordCounts]}

The story should naturally incorporate the theme of "${theme.name}" (${theme.description}) through the hero's adventure and choices. Use the ${narrativeStructure} structure to create a compelling narrative arc. Make it exciting, magical, and memorable!`;

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
        narrative_structure: narrativeStructure,
        story_length: storyLength,
        age_range: ageRange,
        setting: setting || null,
        secondary_theme_id: secondaryThemeId || null,
        art_style: artStyle,
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

    const styleDescription = artStylePrompts[artStyle] || artStylePrompts['pixar-3d'];

    // Generate cover image automatically
    console.log("Generating cover image...");
    try {
      const imagePrompt = `Create a child-friendly cover illustration in ${styleDescription}. Feature ${heroName} as the main character in a ${storyType} setting. Scene: ${cleanContent.substring(0, 200)}. Art style: colorful, family-friendly, high-quality with expressive characters and magical atmosphere.`;

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
