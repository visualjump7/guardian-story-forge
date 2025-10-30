import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GENRE_PROMPTS: Record<string, string> = {
  action: `Create the beginning of an action-packed adventure story for an 8-10 year old.
Hero: {heroName}

Requirements:
- 150-200 words
- High-energy opening with immediate conflict
- Introduce hero in a dangerous situation
- End with a critical decision point

Return JSON in this exact format:
{
  "content": "story text here",
  "choices": ["Choice 1 text (action-oriented)", "Choice 2 text (action-oriented)"]
}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { storyId } = await req.json();

    // Fetch story metadata
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();

    if (storyError) throw storyError;

    // Get genre-specific prompt
    const promptTemplate = GENRE_PROMPTS[story.genre] || GENRE_PROMPTS.action;
    const prompt = promptTemplate.replace("{heroName}", story.hero_name);

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices[0].message.content;

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);

    // Save Part 1 to database
    const { error: partError } = await supabase.from("story_parts").insert({
      story_id: storyId,
      part_number: 1,
      content: parsed.content,
    });

    if (partError) throw partError;

    // Save choices
    const choiceInserts = parsed.choices.map((text: string, idx: number) => ({
      story_id: storyId,
      after_part: 1,
      choice_number: idx + 1,
      choice_text: text,
    }));

    const { error: choicesError } = await supabase
      .from("story_choices")
      .insert(choiceInserts);

    if (choicesError) throw choicesError;

    // Update story current_part
    await supabase
      .from("stories")
      .update({ current_part: 1 })
      .eq("id", storyId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-story-part-1:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
