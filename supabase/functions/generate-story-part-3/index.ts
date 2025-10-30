import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GENRE_CONFIGS = {
  'Action': {
    systemPrompt: `You write action-packed story endings for children ages 6-9. 

Writing rules:
- Reference BOTH previous choices in the ending
- Resolve the main conflict with exciting action
- Include climactic sound effects: BOOM! CRASH! POW!
- Hero succeeds/triumphs
- Include brief lesson learned (one sentence)
- End with "THE END!"
- Exactly 150-250 words
- NO MORE CHOICES
- Captain Underpants style victory

Safety: Age-appropriate heroic success only.`,
  },
  'Agent': {
    systemPrompt: `You write secret agent mystery story endings for children ages 7-10.

Writing rules:
- Reference both previous choices and clues
- Solve the mystery with clever deduction
- Reveal the answer clearly
- Hero succeeds in mission
- Include lesson about perseverance (one sentence)
- End with "THE END!"
- Exactly 150-250 words
- NO MORE CHOICES

Safety: Age-appropriate mystery solving.`,
  },
  'Fantasy': {
    systemPrompt: `You write magical fantasy story endings for children ages 5-9.

Writing rules:
- Reference both magical choices made
- Resolve with wonderful magic
- Can use rhyming for ending if genre style
- Magic saves the day beautifully
- Include lesson about kindness/believing (one sentence)
- End with "THE END!"
- Exactly 150-250 words
- NO MORE CHOICES

Safety: Joyful magical resolution.`,
  },
  'Fairy Tale': {
    systemPrompt: `You write classic fairy tale endings for children ages 4-9.

Writing rules:
- Reference hero's journey choices
- Classic "happily ever after" structure
- Good triumphs over evil (gently)
- Include traditional moral lesson (one sentence)
- End with "THE END!" or "And they lived happily ever after!"
- Exactly 150-250 words
- NO MORE CHOICES

Safety: Traditional happy endings.`,
  },
  'Explorer': {
    systemPrompt: `You write explorer adventure story endings for children ages 4-8.

Writing rules:
- Reference exploration choices and discoveries
- Show the final amazing discovery
- Include animal friend celebrations
- Hero learns/discovers something wonderful
- Include lesson about curiosity (one sentence)
- End with "THE END!"
- Exactly 150-250 words
- NO MORE CHOICES

Safety: Joyful discovery ending.`,
  },
  'Superhero': {
    systemPrompt: `You write superhero story endings for children ages 5-9.

Writing rules:
- Reference both power choices used
- Epic final showdown with silly villain defeated
- Big comic book victory: "HERO LANDING!"
- Citizens cheer and celebrate
- Include lesson about helping others/responsibility (one sentence)
- End with "THE END!"
- Exactly 150-250 words
- NO MORE CHOICES
- Comic book triumphant finale

Safety: Cartoon superhero victory.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      storyId, 
      parentNodeId, 
      selectedChoice, 
      choiceText,
      genre, 
      heroName, 
      part1Context,
      part2Context,
      part1ChoiceMade,
      part2ChoiceMade,
    } = await req.json();

    console.log('Generating Part 3 (Ending):', { storyId, genre });

    // Validate inputs
    if (!storyId || !parentNodeId || !selectedChoice || !genre || !heroName) {
      throw new Error('Missing required parameters');
    }

    const genreConfig = GENRE_CONFIGS[genre as keyof typeof GENRE_CONFIGS];
    if (!genreConfig) {
      throw new Error(`Invalid genre: ${genre}`);
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Build Part 3 prompt
    const userPrompt = `Write the ending of the ${genre} story about ${heroName}.

Story so far:
Part 1: ${part1Context}
Part 2: ${part2Context}

Choices made:
- Part 1: "${part1ChoiceMade}"
- Part 2: "${choiceText}"

Requirements:
- Reference both previous choices
- Resolve the main conflict
- Hero succeeds/triumphs
- Include a brief lesson learned (one sentence)
- End with "THE END!"
- 150-250 words
- NO MORE CHOICES

Output format:
[Story ending with "THE END!"]`;

    // Call Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: genreConfig.systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    // Parse response (no choices for Part 3)
    const parsed = parseStoryResponse(generatedText, 3);

    // Validate ending
    if (!parsed.storyText.includes('THE END')) {
      // Add it if missing
      parsed.storyText += '\n\nTHE END!';
    }

    // Create Part 3 ending node
    const nodeKey = `part3_choice${part1ChoiceMade}_${selectedChoice}`;
    const { data: nodeData, error: nodeError } = await supabase
      .from('story_nodes')
      .insert({
        story_id: storyId,
        node_key: nodeKey,
        content: parsed.storyText,
        is_ending_node: true,
        title: 'Part 3: The Ending',
      })
      .select()
      .single();

    if (nodeError) throw nodeError;

    // Update the parent's placeholder choice to point to this ending node
    await supabase
      .from('story_choices')
      .update({ to_node_id: nodeData.id })
      .eq('from_node_id', parentNodeId)
      .eq('choice_order', selectedChoice === 'A' ? 1 : 2);

    // Generate image (placeholder for now)
    const imageUrl = `https://placehold.co/800x800/3a3a3a/white?text=${genre}+Ending`;

    // Update node with image
    await supabase
      .from('story_nodes')
      .update({ image_url: imageUrl })
      .eq('id', nodeData.id);

    // Update user progress - mark as complete
    const now = new Date().toISOString();
    await supabase
      .from('user_story_progress')
      .update({ 
        current_node_id: nodeData.id,
        completed_at: now,
        path_history: supabase.rpc('array_append', { 
          array: 'path_history', 
          element: nodeData.id 
        })
      })
      .eq('story_id', storyId)
      .eq('user_id', user.id);

    // Update story to mark as complete
    await supabase
      .from('stories')
      .update({ 
        content: `${part1Context}\n\n${part2Context}\n\n${parsed.storyText}`,
      })
      .eq('id', storyId);

    return new Response(
      JSON.stringify({
        nodeId: nodeData.id,
        storyText: parsed.storyText,
        imageUrl,
        isComplete: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('Error in generate-story-part-3:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function parseStoryResponse(text: string, part: number): { storyText: string; choiceA?: string; choiceB?: string } {
  const fullText = text.trim();
  
  if (part === 3) {
    if (!fullText.includes('THE END')) {
      console.warn('Part 3 missing "THE END"');
    }
    return { storyText: fullText };
  }
  
  const choiceAMatch = fullText.match(/CHOICE A:\s*(.+?)(?=CHOICE B:|$)/s);
  const choiceBMatch = fullText.match(/CHOICE B:\s*(.+?)$/s);
  
  if (!choiceAMatch || !choiceBMatch) {
    throw new Error('Could not parse choices from response');
  }
  
  const storyText = fullText.split(/CHOICE A:/)[0].trim();
  const choiceA = choiceAMatch[1].trim();
  const choiceB = choiceBMatch[1].trim();
  
  return { storyText, choiceA, choiceB };
}
