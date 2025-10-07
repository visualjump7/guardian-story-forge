import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const pdfRequestSchema = z.object({
  storyId: z.string().uuid("Invalid story ID format")
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validation = pdfRequestSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { storyId } = validation.data;

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

    // Get creator profile information
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", story.created_by)
      .single();

    const creatorName = creatorProfile?.display_name || "Anonymous";

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
      margin: 1cm; 
    }
    body {
      font-family: 'Georgia', serif;
      line-height: 1.8;
      color: #333;
      margin: 0;
      padding: 0;
    }
    
    /* Responsive text margins */
    .story-text {
      font-size: 14pt;
      text-align: justify;
      margin: 0.5cm 0;
      padding: 0 25%;
    }
    
    @media screen and (max-width: 768px) {
      .story-text {
        padding: 0 15%;
      }
    }
    
    .story-text.first-paragraph::first-letter {
      float: left;
      font-size: 4em;
      line-height: 0.8;
      margin: 0.1em 0.1em 0 0;
      color: #2c3e50;
      font-weight: bold;
    }
    
    .cover {
      text-align: center;
      page-break-after: always;
      padding: 1cm 0;
    }
    .cover h1 {
      font-size: 32pt;
      color: #2c3e50;
      margin-bottom: 0.3cm;
      padding: 0 15%;
    }
    .cover .subtitle {
      font-size: 16pt;
      color: #7f8c8d;
      margin-bottom: 0.5cm;
      padding: 0 15%;
    }
    .cover img {
      width: 100%;
      max-height: 15cm;
      border-radius: 0;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      margin: 0.5cm 0 0 0;
    }
    
    .story-page {
      page-break-after: always;
      padding: 0;
    }
    
    /* Full-width images */
    .story-page img {
      width: 100%;
      max-height: 12cm;
      display: block;
      margin: 0.5cm 0;
      border-radius: 0;
      aspect-ratio: 16 / 9;
      object-fit: cover;
    }
    
    .hero-badge {
      display: inline-block;
      background: #3498db;
      color: white;
      padding: 0.2cm 0.5cm;
      border-radius: 4px;
      font-size: 12pt;
      margin: 0.3cm 0;
    }
    
    .creator-signature {
      font-size: 11pt;
      color: #7f8c8d;
      font-style: italic;
      margin-top: 0.5cm;
      padding: 0 15%;
    }
    
    .the-end-page {
      page-break-before: always;
      text-align: center;
      padding: 4cm 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 20cm;
    }
    
    .the-end-text {
      font-size: 48pt;
      color: #2c3e50;
      font-weight: bold;
      margin: 1cm 0;
      letter-spacing: 0.2em;
      position: relative;
    }
    
    .the-end-text::before,
    .the-end-text::after {
      content: "✦";
      font-size: 24pt;
      color: #3498db;
      margin: 0 0.5cm;
      vertical-align: middle;
    }
    
    .end-signature {
      font-size: 14pt;
      color: #7f8c8d;
      font-style: italic;
      margin-top: 1cm;
    }
    
    .decorative-line {
      width: 8cm;
      height: 2px;
      background: linear-gradient(to right, transparent, #3498db, transparent);
      margin: 0.5cm auto;
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${story.title}</h1>
    ${story.hero_name ? `<div class="hero-badge">Starring: ${story.hero_name}</div>` : ''}
    ${story.story_type ? `<div class="subtitle">${story.story_type}</div>` : ''}
    ${images && images[0] ? `<img src="${images[0].image_url}" alt="Cover">` : ''}
    <div class="creator-signature">Story Created by ${creatorName}</div>
  </div>
  
  ${paragraphs.map((paragraph: string, index: number) => {
    const imageIndex = Math.min(index + 1, images?.length || 0);
    const image = images && images[imageIndex] ? images[imageIndex] : null;
    // Only add first-paragraph class to the very first paragraph
    const paragraphClass = index === 0 ? 'story-text first-paragraph' : 'story-text';
    
    return `
      <div class="story-page">
        <div class="${paragraphClass}">${paragraph}</div>
        ${image ? `<img src="${image.image_url}" alt="Story illustration ${index + 1}">` : ''}
      </div>
    `;
  }).join('\n')}
  
  <div class="the-end-page">
    <div class="decorative-line"></div>
    <div class="the-end-text">The End</div>
    <div class="decorative-line"></div>
    <div class="end-signature">Story Created by ${creatorName}</div>
  </div>
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