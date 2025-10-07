import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const audioRequestSchema = z.object({
  storyId: z.string().uuid("Invalid story ID format"),
  voiceType: z.enum(["whimsical", "adventure", "ranch"]).default("whimsical")
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validation = audioRequestSchema.safeParse(requestBody);
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

    const { storyId, voiceType } = validation.data;

    // Map voice types to ElevenLabs voice IDs
    const voiceConfig = {
      whimsical: {
        voiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily - sweet, gentle voice
      },
      adventure: {
        voiceId: "CwhRBWXzGAHq8TQ4Fs17", // Roger - warm, confident narrator
      },
      ranch: {
        voiceId: "pqHfZKP75CvOlQylNhV4", // Bill - friendly storytelling voice
      },
    };

    const config = voiceConfig[voiceType as keyof typeof voiceConfig] || voiceConfig.whimsical;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!elevenLabsApiKey) {
      throw new Error("ElevenLabs API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user from the JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch the story with excerpt and creator info
    const { data: story, error: fetchError } = await supabase
      .from('stories')
      .select('content, title, excerpt, created_by, is_public, is_featured')
      .eq('id', storyId)
      .single();

    if (fetchError || !story) {
      throw new Error("Story not found");
    }

    // Security: Verify user has access to this story
    const isOwner = story.created_by === user.id;
    const isPublicOrFeatured = story.is_public || story.is_featured;
    
    if (!isOwner && !isPublicOrFeatured) {
      throw new Error('Not authorized to generate audio for this story');
    }

    // Fetch creator profile info
    let creatorName = "";
    if (story.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('author_name, display_name')
        .eq('id', story.created_by)
        .single();
      
      if (profile) {
        creatorName = profile.author_name || profile.display_name;
      }
    }

    console.log(`Generating audio for story: ${story.title}`);

    // Build the audio content with title, excerpt, and creator
    let audioIntro = story.title;
    if (story.excerpt) {
      audioIntro += `. ${story.excerpt}`;
    }
    if (creatorName) {
      audioIntro += ` Story created by ${creatorName}.`;
    }
    audioIntro += " ";
    
    const audioContent = audioIntro + story.content;
    console.log(`Generating audio for ${audioContent.length} characters`);

    // Generate audio using ElevenLabs TTS
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: audioContent,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
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
