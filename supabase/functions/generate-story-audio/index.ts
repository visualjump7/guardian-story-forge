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
    const { storyId, voiceType = "whimsical" } = await req.json();

    if (!storyId) {
      throw new Error("Story ID is required");
    }

    // Map voice types to OpenAI voices and narrative styles
    const voiceConfig = {
      whimsical: {
        voice: "shimmer",
        style: "Read this story with a magical, light-hearted tone. Use varied pacing with gentle emphasis on wonder and imagination. ",
      },
      adventure: {
        voice: "onyx",
        style: "Read this story with an energetic, dynamic tone. Build excitement with dramatic emphasis and confident delivery. ",
      },
      ranch: {
        voice: "echo",
        style: "Read this story with a slow, southern drawl. Take your time with each word, using a warm Texas ranch accent with cinematic pauses and a relaxed, storytelling cadence. ",
      },
    };

    const config = voiceConfig[voiceType as keyof typeof voiceConfig] || voiceConfig.whimsical;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
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

    // OpenAI TTS has a 4096 character limit, so truncate if needed
    const MAX_TTS_LENGTH = 4000; // Leave some buffer
    
    // Build the audio content without style prompts
    let audioIntro = story.title;
    if (story.excerpt) {
      audioIntro += `. ${story.excerpt}`;
    }
    if (creatorName) {
      audioIntro += ` Story created by ${creatorName}.`;
    }
    audioIntro += " ";
    
    let audioContent = audioIntro + story.content;
    
    if (audioContent.length > MAX_TTS_LENGTH) {
      // Truncate at the last complete sentence before the limit
      const truncated = audioContent.substring(0, MAX_TTS_LENGTH);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastExclamation = truncated.lastIndexOf('!');
      const lastQuestion = truncated.lastIndexOf('?');
      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastSentenceEnd > 0) {
        audioContent = truncated.substring(0, lastSentenceEnd + 1);
      } else {
        audioContent = truncated;
      }
      console.log(`Story truncated from ${story.content.length} to ${audioContent.length} characters for audio generation`);
    }

    // Generate audio using OpenAI TTS
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: audioContent,
        voice: config.voice,
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
