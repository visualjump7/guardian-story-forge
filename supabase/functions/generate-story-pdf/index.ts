import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
      .select("*")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      throw new Error("Story not found");
    }

    // Check if user owns the story or if it's public
    if (story.created_by !== user.id && !story.is_public && !story.is_featured) {
      throw new Error("Not authorized to access this story");
    }

    // Get story images
    const { data: images } = await supabase
      .from("story_images")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true });

    // Generate HTML for PDF
    const paragraphs = story.content.split('\n\n').filter((p: string) => p.trim());
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { 
      size: A4; 
      margin: 2cm; 
    }
    body {
      font-family: 'Georgia', serif;
      line-height: 1.8;
      color: #333;
    }
    .cover {
      text-align: center;
      page-break-after: always;
      padding: 2cm 0;
    }
    .cover h1 {
      font-size: 32pt;
      color: #2c3e50;
      margin-bottom: 0.5cm;
    }
    .cover .subtitle {
      font-size: 16pt;
      color: #7f8c8d;
      margin-bottom: 1cm;
    }
    .cover img {
      max-width: 100%;
      max-height: 15cm;
      border-radius: 8px;
    }
    .story-page {
      page-break-after: always;
      padding: 1cm 0;
    }
    .story-page img {
      max-width: 100%;
      max-height: 12cm;
      display: block;
      margin: 1cm auto;
      border-radius: 8px;
    }
    .story-text {
      font-size: 14pt;
      text-align: justify;
      margin: 1cm 0;
    }
    .hero-badge {
      display: inline-block;
      background: #3498db;
      color: white;
      padding: 0.2cm 0.5cm;
      border-radius: 4px;
      font-size: 12pt;
      margin: 0.5cm 0;
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${story.title}</h1>
    ${story.hero_name ? `<div class="hero-badge">Starring: ${story.hero_name}</div>` : ''}
    ${story.story_type ? `<div class="subtitle">${story.story_type}</div>` : ''}
    ${images && images[0] ? `<img src="${images[0].image_url}" alt="Cover">` : ''}
  </div>
  
  ${paragraphs.map((paragraph: string, index: number) => {
    const imageIndex = Math.min(index + 1, images?.length || 0);
    const image = images && images[imageIndex] ? images[imageIndex] : null;
    
    return `
      <div class="story-page">
        <div class="story-text">${paragraph}</div>
        ${image ? `<img src="${image.image_url}" alt="Story illustration ${index + 1}">` : ''}
      </div>
    `;
  }).join('\n')}
</body>
</html>`;

    // Use a PDF generation service (this is a placeholder - you would typically use a service like Puppeteer or similar)
    // For now, we'll return the HTML which can be converted to PDF on the client side
    
    return new Response(
      JSON.stringify({ 
        html,
        title: story.title 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error("Error in generate-story-pdf function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});