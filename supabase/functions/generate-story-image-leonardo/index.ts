import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const imageRequestSchema = z.object({
  storyId: z.string().uuid("Invalid story ID format"),
  imageType: z.enum([
    'cover', 'hook', 'inciting', 'try1', 'try2', 
    'midpoint', 'setback', 'plan', 'climax', 'resolution'
  ]).optional(),
  customizations: z.string().max(500, "Customizations must be less than 500 characters").optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Leonardo AI image generation started");
    const requestBody = await req.json();
    
    // Validate input
    const validation = imageRequestSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { storyId, customizations, imageType: requestedImageType } = validation.data;
    console.log("Story ID received:", storyId);
    if (requestedImageType) {
      console.log("Requested image type:", requestedImageType);
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

    // Get story details with access validation
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, title, content, hero_name, story_type, art_style, created_by, is_public, is_featured")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      throw new Error("Story not found");
    }

    // Verify user has access
    const isOwner = story.created_by === user.id;
    const isPublicOrFeatured = story.is_public || story.is_featured;
    
    if (!isOwner && !isPublicOrFeatured) {
      throw new Error("Not authorized to generate images for this story");
    }

    // Check existing images
    const { data: existingImages } = await supabase
      .from("story_images")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true });

    if (existingImages && existingImages.length >= 12) {
      throw new Error("Maximum 12 images per story reached");
    }

    // Determine image type and content
    const imageCount = existingImages?.length || 0;
    const paragraphs = story.content.split('\n\n').filter((p: string) => p.trim());
    
    type ImageType = 'cover' | 'hook' | 'inciting' | 'try1' | 'try2' | 'midpoint' | 'setback' | 'plan' | 'climax' | 'resolution';
    let imageType: ImageType = requestedImageType as ImageType || 'cover';
    let contentForImage = paragraphs[0] || story.content.substring(0, 200);

    // If no imageType was explicitly requested, use auto-detection
    if (!requestedImageType) {
      if (imageCount === 0) {
        imageType = 'cover';
        contentForImage = paragraphs[0];
      } else if (imageCount === 1) {
        imageType = 'hook';
        const targetIndex = Math.floor(paragraphs.length * 0.10);
        contentForImage = paragraphs[targetIndex] || paragraphs[0];
      } else if (imageCount === 2) {
        imageType = 'midpoint';
        const targetIndex = Math.floor(paragraphs.length * 0.50);
        contentForImage = paragraphs[targetIndex] || paragraphs[0];
      } else if (imageCount === 3) {
        imageType = 'climax';
        const targetIndex = Math.floor(paragraphs.length * 0.80);
        contentForImage = paragraphs[targetIndex] || paragraphs[0];
      } else if (imageCount === 4) {
        imageType = 'resolution';
        contentForImage = paragraphs[paragraphs.length - 1] || paragraphs[0];
      }
    }

    console.log("Generating image type:", imageType);

    // Get Leonardo API key
    const LEONARDO_API_KEY = Deno.env.get("LEONARDO_API_KEY");
    if (!LEONARDO_API_KEY) {
      throw new Error("LEONARDO_API_KEY not configured");
    }

    // Map art style to prompt description
    const artStylePrompts: Record<string, string> = {
      'pixar-3d': 'vibrant 3D animated illustration in Pixar/DreamWorks style with rich colors and cinematic lighting',
      'ghibli-2d': 'soft watercolor 2D illustration in Studio Ghibli style',
      'watercolor': 'gentle watercolor children\'s book illustration',
      'classic-disney': 'traditional hand-drawn 2D animation in classic Disney style',
      'modern-cartoon': 'bold modern 2D cartoon style with clean lines',
      'anime': 'Japanese anime style illustration',
      'comic-book': 'dynamic comic book style illustration'
    };

    const styleDescription = artStylePrompts[story.art_style || 'pixar-3d'] || artStylePrompts['pixar-3d'];

    // Generate core prompt based on beat type
    let corePrompt = '';
    const noTextDirective = 'CRITICAL: This illustration must contain ZERO text, letters, words, numbers, or written language of any kind.';
    
    const beatPrompts: Record<string, string> = {
      'cover': `${noTextDirective} Create a captivating cover illustration in ${styleDescription}. Feature ${story.hero_name} as the main character. Scene: ${contentForImage}. Colorful, family-friendly, high-quality with expressive characters and magical atmosphere.`,
      'hook': `${noTextDirective} Create an opening scene in ${styleDescription}. Show ${story.hero_name} at the beginning of the story. Scene: ${contentForImage}. Child-friendly, inviting, sets the stage for adventure.`,
      'inciting': `${noTextDirective} Create the moment when the adventure begins in ${styleDescription}. Show ${story.hero_name} discovering the problem or call to adventure. Scene: ${contentForImage}. Exciting, curiosity-sparking, child-friendly.`,
      'try1': `${noTextDirective} Create a scene showing the first attempt in ${styleDescription}. Feature ${story.hero_name} trying to solve the problem. Scene: ${contentForImage}. Active, determined, child-friendly.`,
      'try2': `${noTextDirective} Create a scene showing the second attempt with more effort in ${styleDescription}. Feature ${story.hero_name} trying harder. Scene: ${contentForImage}. Energetic, persistent, child-friendly.`,
      'midpoint': `${noTextDirective} Create a major turning point scene in ${styleDescription}. Show ${story.hero_name} at a pivotal moment. Scene: ${contentForImage}. Dramatic, transformative, child-friendly.`,
      'setback': `${noTextDirective} Create a challenge or setback moment in ${styleDescription}. Show ${story.hero_name} facing difficulty. Scene: ${contentForImage}. Tense but hopeful, child-friendly.`,
      'plan': `${noTextDirective} Create a scene showing new strategy or help arriving in ${styleDescription}. Feature ${story.hero_name} with renewed hope. Scene: ${contentForImage}. Optimistic, clever, child-friendly.`,
      'climax': `${noTextDirective} Create the final confrontation or big moment in ${styleDescription}. Show ${story.hero_name} at the peak of the story. Scene: ${contentForImage}. Exciting, triumphant, child-friendly.`,
      'resolution': `${noTextDirective} Create a happy ending scene in ${styleDescription}. Show ${story.hero_name} celebrating or at peace. Scene: ${contentForImage}. Joyful, satisfying, child-friendly.`
    };

    corePrompt = beatPrompts[imageType] || beatPrompts['hook'];

    // Append customizations if provided
    let imagePrompt = corePrompt;
    if (customizations && customizations.trim()) {
      imagePrompt = `${corePrompt}\n\nAdditional details (remember: NO TEXT): ${customizations.trim()}`;
    }

    const negativePrompt = "text, letters, words, numbers, labels, titles, captions, signs, logos, speech bubbles, dialogue, written language, typography";

    console.log("Calling Leonardo AI API...");

    // Map all beat types to aspect ratios and dimensions
    const aspectRatioMap: Record<string, { width: number; height: number; aspectRatio: string }> = {
      'cover': { width: 1024, height: 576, aspectRatio: '16:9' },
      'hook': { width: 1024, height: 1024, aspectRatio: '1:1' },
      'inciting': { width: 1024, height: 1024, aspectRatio: '1:1' },
      'try1': { width: 1024, height: 1024, aspectRatio: '1:1' },
      'try2': { width: 1024, height: 1024, aspectRatio: '1:1' },
      'midpoint': { width: 1024, height: 1024, aspectRatio: '1:1' },
      'setback': { width: 1024, height: 1024, aspectRatio: '1:1' },
      'plan': { width: 1024, height: 1024, aspectRatio: '1:1' },
      'climax': { width: 1024, height: 1024, aspectRatio: '1:1' },
      'resolution': { width: 1024, height: 1024, aspectRatio: '1:1' }
    };

    const dimensions = aspectRatioMap[imageType] || aspectRatioMap['hook'];
    const { width, height, aspectRatio } = dimensions;

    console.log(`Generating ${imageType} image at ${width}x${height} (${aspectRatio})`);

    // Initiate Leonardo AI generation
    const leonardoResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LEONARDO_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        negative_prompt: negativePrompt,
        modelId: "aa77f04e-3eec-4034-9c07-d0f619684628", // Leonardo Kino XL model
        width: width,
        height: height,
        num_images: 1,
        public: false
      })
    });

    if (!leonardoResponse.ok) {
      const errorText = await leonardoResponse.text();
      console.error("Leonardo API error:", errorText);
      throw new Error(`Leonardo AI API error: ${leonardoResponse.status}`);
    }

    const leonardoData = await leonardoResponse.json();
    const generationId = leonardoData.sdGenerationJob?.generationId;

    if (!generationId) {
      throw new Error("No generation ID returned from Leonardo AI");
    }

    console.log("Generation started, ID:", generationId);
    console.log("Polling for completion...");

    // Poll for completion (max 2 minutes = 24 attempts * 5 seconds)
    let imageUrl = null;
    const maxAttempts = 24;
    let attempts = 0;

    while (!imageUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      console.log(`Polling attempt ${attempts}/${maxAttempts}...`);
      
      const statusResponse = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: { "Authorization": `Bearer ${LEONARDO_API_KEY}` }
        }
      );

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.generations_by_pk?.status;
      
      console.log("Generation status:", status);
      
      if (status === 'COMPLETE') {
        const images = statusData.generations_by_pk?.generated_images;
        if (images && images.length > 0) {
          imageUrl = images[0].url;
          console.log("Image URL retrieved:", !!imageUrl);
        }
      } else if (status === 'FAILED') {
        throw new Error('Leonardo AI generation failed');
      }
    }

    if (!imageUrl) {
      throw new Error('Generation timeout - image took too long to generate (>2 minutes)');
    }

    console.log("Saving image to database...");

    // Check if this is the first image
    const isFirstImage = imageCount === 0;

    // Save image to story_images table
    const { error: insertError } = await supabase
      .from("story_images")
      .insert({
        story_id: storyId,
        image_url: imageUrl,
        is_selected: isFirstImage,
        image_type: imageType,
        image_size_px: width,
        width_px: width,
        height_px: height,
        aspect_ratio: aspectRatio
      });

    if (insertError) {
      console.error("Database error:", insertError);
      throw new Error("Failed to save image");
    }

    console.log("Leonardo AI image generated and saved successfully");

    return new Response(
      JSON.stringify({ imageUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-story-image-leonardo function:", error);
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