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
    console.log("Image generation started");
    const { storyId, customizations } = await req.json();
    console.log("Story ID received:", storyId);
    console.log("Customizations provided:", !!customizations);

    if (!storyId) {
      throw new Error("Missing storyId");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    console.log("Supabase client initialized");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    console.log("User authenticated:", !!user, "Error:", userError?.message);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get story details (without theme join to avoid ambiguity)
    console.log("Fetching story details for ID:", storyId, "User:", user.id);
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, title, content, hero_name, story_type, art_style, created_by")
      .eq("id", storyId)
      .eq("created_by", user.id)
      .single();

    console.log("Story fetched:", !!story, "Error:", storyError?.message);
    if (storyError || !story) {
      throw new Error("Story not found or you don't own this story");
    }

    // Check existing images and determine type for new image
    console.log("Checking existing images count...");
    const { data: existingImages, error: countError } = await supabase
      .from("story_images")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true });

    console.log("Current image count:", existingImages?.length, "Count error:", countError?.message);
    if (existingImages && existingImages.length >= 5) {
      throw new Error("Maximum 5 images per story reached");
    }

    // Determine image type and content to use based on count with intelligent placement
    const imageCount = existingImages?.length || 0;
    const paragraphs = story.content.split('\n\n').filter((p: string) => p.trim());
    const totalParagraphs = paragraphs.length;
    
    let imageType: 'cover' | 'early-scene' | 'mid-scene' | 'climax' | 'ending' = 'cover';
    let contentForImage = story.content;
    let targetPosition = 0;

    // Analyze paragraph for visual interest (action words, descriptive language, etc.)
    const getVisualInterestScore = (text: string): number => {
      const actionWords = (text.match(/\b(ran|jumped|flew|fought|discovered|found|shouted|laughed|cried|grabbed|chased|explored)\b/gi) || []).length;
      const descriptiveWords = (text.match(/\b(bright|dark|magical|enormous|tiny|beautiful|scary|mysterious|shining|glowing)\b/gi) || []).length;
      const hasDialogue = text.includes('"') || text.includes("'");
      const wordCount = text.split(/\s+/).length;
      
      return (actionWords * 3) + (descriptiveWords * 2) + (hasDialogue ? 5 : 0) + Math.min(wordCount / 20, 5);
    };

    // Find best paragraph near target position
    const findBestParagraphNear = (targetPercent: number): { index: number; content: string } => {
      const targetIndex = Math.floor(totalParagraphs * targetPercent);
      const searchRange = 3;
      const startIndex = Math.max(0, targetIndex - searchRange);
      const endIndex = Math.min(totalParagraphs - 1, targetIndex + searchRange);
      
      let bestIndex = targetIndex;
      let bestScore = 0;
      
      for (let i = startIndex; i <= endIndex; i++) {
        const score = getVisualInterestScore(paragraphs[i]);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      
      return { index: bestIndex, content: paragraphs[bestIndex] };
    };

    if (imageCount === 0) {
      // First image - cover (opening scene)
      imageType = 'cover';
      contentForImage = paragraphs[0];
    } else if (imageCount === 1) {
      // Second image - early scene (25% through story)
      imageType = 'early-scene';
      const best = findBestParagraphNear(0.25);
      contentForImage = best.content;
      targetPosition = best.index;
    } else if (imageCount === 2) {
      // Third image - mid scene (50% through story)
      imageType = 'mid-scene';
      const best = findBestParagraphNear(0.50);
      contentForImage = best.content;
      targetPosition = best.index;
    } else if (imageCount === 3) {
      // Fourth image - climax (75% through story)
      imageType = 'climax';
      const best = findBestParagraphNear(0.75);
      contentForImage = best.content;
      targetPosition = best.index;
    } else if (imageCount === 4) {
      // Fifth image - ending (95% through story)
      imageType = 'ending';
      const best = findBestParagraphNear(0.95);
      contentForImage = best.content;
      targetPosition = best.index;
    }
    
    console.log("Generating image type:", imageType);

    // Generate image using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    console.log("Lovable API key present:", !!LOVABLE_API_KEY);
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

    // Always generate the core prompt based on image type
    console.log("Generating core prompt for type:", imageType);
    let corePrompt = '';
    
    if (imageType === 'cover') {
      corePrompt = `Create a child-friendly cover illustration in ${styleDescription}. Feature ${story.hero_name} as the main character in a ${story.story_type} setting. Scene: ${contentForImage.substring(0, 200)}. Art style: colorful, family-friendly, high-quality with expressive characters and magical atmosphere.`;
    } else if (imageType === 'early-scene') {
      corePrompt = `Create an early adventure scene illustration in ${styleDescription} for the children's story. Feature ${story.hero_name} in this moment: ${contentForImage}. Show the beginning of the journey with excitement and anticipation. Child-friendly, colorful, high-quality illustration suitable for ages 8-10.`;
    } else if (imageType === 'mid-scene') {
      corePrompt = `Create a mid-story scene illustration in ${styleDescription} for the children's story. Feature ${story.hero_name} in this key moment: ${contentForImage}. Show the action and emotion of this pivotal scene. Child-friendly, colorful, high-quality illustration suitable for ages 8-10.`;
    } else if (imageType === 'climax') {
      corePrompt = `Create a climactic scene illustration in ${styleDescription} for the children's story. Feature ${story.hero_name} at the story's peak moment: ${contentForImage}. Show the tension, excitement, or emotional high point with dramatic visuals. Child-friendly, colorful, high-quality illustration suitable for ages 8-10.`;
    } else {
      corePrompt = `Create a resolution ending illustration in ${styleDescription} for the children's story. Feature ${story.hero_name} in the conclusion: ${contentForImage}. Capture the emotional resolution and sense of completion with warmth and satisfaction. Child-friendly, colorful, high-quality illustration suitable for ages 8-10.`;
    }

    // Append customizations if provided
    let imagePrompt = corePrompt;
    if (customizations && customizations.trim()) {
      console.log("Appending user customizations to core prompt");
      imagePrompt = `${corePrompt} ${customizations.trim()}`;
    }

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
        modalities: ["image", "text"],
        size: "1792x1024"
      }),
    });

    console.log("AI Response status:", aiResponse.status);
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error response:", errorText);
      throw new Error(`Failed to generate image with AI: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    console.log("Image URL generated:", !!imageUrl);

    if (!imageUrl) {
      throw new Error("No image generated from AI response");
    }

    console.log("Saving image to story_images table with type:", imageType);

    // Check if this is the first image - if so, mark it as selected
    const isFirstImage = imageCount === 0;

    // Save image to story_images table
    const { error: insertError } = await supabase
      .from("story_images")
      .insert({
        story_id: storyId,
        image_url: imageUrl,
        is_selected: isFirstImage,
        image_type: imageType
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
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
