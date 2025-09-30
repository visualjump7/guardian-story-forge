import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { storyId, voice = "alloy" } = await req.json();

    if (!storyId) {
      throw new Error("Story ID is required");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the story
    const { data: story, error: fetchError } = await supabase
      .from('stories')
      .select('content, title')
      .eq('id', storyId)
      .single();

    if (fetchError || !story) {
      throw new Error("Story not found");
    }

    console.log(`Generating audio for story: ${story.title}`);

    // Generate audio using OpenAI TTS
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: story.content,
        voice: voice,
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      const error = await ttsResponse.json();
      throw new Error(error.error?.message || 'Failed to generate audio');
    }

    // Convert audio to base64 in chunks to avoid stack overflow
    const arrayBuffer = await ttsResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64Audio = btoa(binary);
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    // Update story with audio URL
    const { error: updateError } = await supabase
      .from('stories')
      .update({ audio_url: audioUrl })
      .eq('id', storyId);

    if (updateError) {
      throw new Error("Failed to save audio URL");
    }

    console.log("Audio generated and saved successfully");

    return new Response(
      JSON.stringify({ success: true, audioUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in generate-story-audio:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
