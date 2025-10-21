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

    const { storyId, customizations } = validation.data;
    console.log("Story ID received:", storyId);

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

    if (existingImages && existingImages.length >= 3) {
      throw new Error("Maximum 3 images per story reached");
    }

    // Determine image type and content
    const imageCount = existingImages?.length || 0;
    const paragraphs = story.content.split('\n\n').filter((p: string) => p.trim());
    
    let imageType: 'cover' | 'early-scene' | 'mid-scene' | 'climax' | 'ending' = 'cover';
    let contentForImage = paragraphs[0] || story.content.substring(0, 200);

    if (imageCount === 0) {
      imageType = 'cover';
      contentForImage = paragraphs[0];
    } else if (imageCount === 1) {
      imageType = 'early-scene';
      const targetIndex = Math.floor(paragraphs.length * 0.25);
      contentForImage = paragraphs[targetIndex] || paragraphs[0];
    } else if (imageCount === 2) {
      imageType = 'mid-scene';
      const targetIndex = Math.floor(paragraphs.length * 0.50);
      contentForImage = paragraphs[targetIndex] || paragraphs[0];
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

    // Generate core prompt
    let corePrompt = '';
    const noTextDirective = 'CRITICAL: This illustration must contain ZERO text, letters, words, numbers, or written language of any kind.';
    
    if (imageType === 'cover') {
      corePrompt = `${noTextDirective} Create a child-friendly cover illustration in ${styleDescription}. Feature ${story.hero_name} as the main character. Scene: ${contentForImage}. Colorful, family-friendly, high-quality with expressive characters and magical atmosphere.`;
    } else if (imageType === 'early-scene') {
      corePrompt = `${noTextDirective} Create an early adventure scene in ${styleDescription}. Feature ${story.hero_name} in this moment: ${contentForImage}. Show the beginning of the journey. Child-friendly, colorful illustration.`;
    } else {
      corePrompt = `${noTextDirective} Create a mid-story scene in ${styleDescription}. Feature ${story.hero_name} in this key moment: ${contentForImage}. Show action and emotion. Child-friendly, colorful illustration.`;
    }

    // Append customizations if provided
    let imagePrompt = corePrompt;
    if (customizations && customizations.trim()) {
      imagePrompt = `${corePrompt}\n\nAdditional details (remember: NO TEXT): ${customizations.trim()}`;
    }

    const negativePrompt = "text, letters, words, numbers, labels, titles, captions, signs, logos, speech bubbles, dialogue, written language, typography";

    console.log("Calling Leonardo AI API...");

    // Determine image dimensions based on type
    let width = 1024;
    let height = 1024;
    let aspectRatio = '1:1';

    if (imageType === 'cover') {
      // Cover images should be 16:9 (landscape)
      width = 1024;
      height = 576;
      aspectRatio = '16:9';
    } else {
      // Scene images are square 1:1
      width = 1024;
      height = 1024;
      aspectRatio = '1:1';
    }

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