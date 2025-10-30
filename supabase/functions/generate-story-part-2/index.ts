import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GENRE_PROMPTS: Record<string, string> = {
  action: `Continue the action adventure based on the hero's choice.
Part 1: {part1Content}
Choice Made: {selectedChoice}

Requirements:
- 150-200 words
- Escalate the action and stakes
- Introduce a plot twist or obstacle
- End with another critical decision

Return JSON in this exact format:
{
  "content": "story text here",
  "choices": ["Choice 1 text", "Choice 2 text"]
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

    const { storyId, selectedChoiceId } = await req.json();

    // Fetch story metadata
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();

    if (storyError) throw storyError;

    // Fetch Part 1
    const { data: part1, error: part1Error } = await supabase
      .from("story_parts")
      .select("*")
      .eq("story_id", storyId)
      .eq("part_number", 1)
      .single();

    if (part1Error) throw part1Error;

    // Fetch selected choice
    const { data: choice, error: choiceError } = await supabase
      .from("story_choices")
      .select("*")
      .eq("id", selectedChoiceId)
      .single();

    if (choiceError) throw choiceError;

    // Mark choice as selected
    await supabase
      .from("story_choices")
      .update({ was_selected: true })
      .eq("id", selectedChoiceId);

    // Get genre-specific prompt
    const promptTemplate = GENRE_PROMPTS[story.genre] || GENRE_PROMPTS.action;
    const prompt = promptTemplate
      .replace("{part1Content}", part1.content)
      .replace("{selectedChoice}", choice.choice_text);

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

    // Save Part 2
    const { error: partError } = await supabase.from("story_parts").insert({
      story_id: storyId,
      part_number: 2,
      content: parsed.content,
    });

    if (partError) throw partError;

    // Save new choices
    const choiceInserts = parsed.choices.map((text: string, idx: number) => ({
      story_id: storyId,
      after_part: 2,
      choice_number: idx + 1,
      choice_text: text,
    }));

    const { error: choicesError } = await supabase
      .from("story_choices")
      .insert(choiceInserts);

    if (choicesError) throw choicesError;

    // Update story
    await supabase
      .from("stories")
      .update({ current_part: 2 })
      .eq("id", storyId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-story-part-2:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
