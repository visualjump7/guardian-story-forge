import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const mergeRequestSchema = z.object({
  presetSlug: z.string().min(1, "Preset slug is required"),
  userPrompt: z.string().min(1, "User prompt cannot be empty"),
  extraModifiers: z.string().optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validation = mergeRequestSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { presetSlug, userPrompt, extraModifiers } = validation.data;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the preset
    const { data: preset, error: presetError } = await supabase
      .from("style_presets")
      .select("*")
      .eq("slug", presetSlug)
      .eq("enabled", true)
      .single();

    if (presetError || !preset) {
      console.error("Preset fetch error:", presetError);
      return new Response(
        JSON.stringify({ 
          error: "Preset not found or disabled",
          presetSlug 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Verify template contains token
    if (!preset.prompt_template.includes('${user_prompt}')) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid preset template: missing ${user_prompt} token" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Merge the prompts
    let finalPrompt = preset.prompt_template.replace(/\$\{user_prompt\}/g, userPrompt.trim());
    
    // Append extra modifiers if provided
    if (extraModifiers && extraModifiers.trim()) {
      finalPrompt = `${finalPrompt} — ${extraModifiers.trim()}`;
    }

    // Clean up whitespace
    finalPrompt = finalPrompt.replace(/\s+/g, ' ').trim();

    const previewText = finalPrompt.substring(0, 100);
    console.log("Merged prompt for style:", presetSlug, "Preview:", previewText + "...");

    return new Response(
      JSON.stringify({ 
        finalPrompt,
        preset: {
          id: preset.id,
          name: preset.name,
          slug: preset.slug,
          tags: preset.tags
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Merge prompt error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
