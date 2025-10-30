import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GENRE_CONFIGS = {
  'Action': {
    systemPrompt: `You write action-packed stories for children ages 6-9. Your stories are fast-paced, exciting, and full of SOUND EFFECTS like POW! CRASH! ZOOM! 

Writing rules:
- Use simple, short sentences
- Include lots of sound effects in ALL CAPS with exclamation marks
- Keep vocabulary at 2nd-3rd grade level
- Make it funny and exciting, never scary
- FIRST SENTENCE must reference the previous choice
- Show consequences and escalate the action
- Always end with TWO choice questions for how to resolve the conflict
- Exactly 150-250 words per story part
- Captain Underpants style humor

Safety: No violence, scary content, or inappropriate themes. Age-appropriate action only.`,
  },
  'Agent': {
    systemPrompt: `You write secret agent mystery stories for children ages 7-10.

Writing rules:
- FIRST SENTENCE must reference the previous choice
- Show new clues or complications
- Escalate the mystery
- Always end with TWO choice questions about next investigation step
- Exactly 150-250 words
- Spy Kids style

Safety: Age-appropriate spy adventure only.`,
  },
  'Fantasy': {
    systemPrompt: `You write magical fantasy stories for children ages 5-9.

Writing rules:
- FIRST SENTENCE must reference the previous choice
- Show magical consequences
- Escalate the wonder or challenge
- Can use rhyming or fairy tale prose
- Always end with TWO choice questions about magical solutions
- Exactly 150-250 words
- Dr. Seuss or fairy tale style

Safety: Only friendly magic, age-appropriate wonder.`,
  },
  'Fairy Tale': {
    systemPrompt: `You write classic fairy tales for children ages 4-9.

Writing rules:
- FIRST SENTENCE must reference the previous choice
- Show consequences of hero's decision
- Escalate the quest or challenge
- Use traditional fairy tale language
- Always end with TWO choice questions about hero's path
- Exactly 150-250 words
- Classic fairy tale style

Safety: Traditional goodness, age-appropriate.`,
  },
  'Explorer': {
    systemPrompt: `You write explorer adventure stories for children ages 4-8.

Writing rules:
- FIRST SENTENCE must reference the previous choice
- Show what hero discovers
- Include animal friend reactions
- Use descriptive sensory language
- Always end with TWO choice questions about where to explore
- Exactly 150-250 words
- Dora the Explorer style

Safety: Friendly animals and safe exploration only.`,
  },
  'Superhero': {
    systemPrompt: `You write superhero stories for children ages 5-9.

Writing rules:
- FIRST SENTENCE must reference the previous choice (power used or action taken)
- Show results of power use with comic effects
- Escalate the villain's silly plan
- Include sound effects: POW! ZAP! WHOOSH!
- Always end with TWO choice questions about final confrontation approach
- Exactly 150-250 words
- Dog Man/comic book style

Safety: Cartoon superhero action only, age-appropriate.`,
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
      part1Context 
    } = await req.json();

    console.log('Generating Part 2:', { storyId, selectedChoice, genre });

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

    // Build Part 2 prompt
    const userPrompt = `Continue the ${genre} story about ${heroName}.

Previous story:
${part1Context}

The hero chose: "${choiceText}"

Requirements:
- FIRST SENTENCE must reference the choice made
- Show consequences of that choice
- Escalate the conflict/adventure
- End with TWO NEW choice questions for different approaches to resolve
- 150-250 words

Output format:
[Story text referencing the choice]

CHOICE A: [Question for first resolution path]
CHOICE B: [Question for second resolution path]`;

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

    // Parse response
    const parsed = parseStoryResponse(generatedText, 2);

    // Create Part 2 node
    const nodeKey = `part2_choice${selectedChoice}`;
    const { data: nodeData, error: nodeError } = await supabase
      .from('story_nodes')
      .insert({
        story_id: storyId,
        node_key: nodeKey,
        content: parsed.storyText,
        title: `Part 2: The Challenge`,
      })
      .select()
      .single();

    if (nodeError) throw nodeError;

    // Create placeholder nodes for Part 3
    const { data: placeholderA } = await supabase
      .from('story_nodes')
      .insert({
        story_id: storyId,
        node_key: `part3_choice${selectedChoice}_A_placeholder`,
        content: 'Placeholder',
        title: 'Part 3 - Choice A',
      })
      .select()
      .single();

    const { data: placeholderB } = await supabase
      .from('story_nodes')
      .insert({
        story_id: storyId,
        node_key: `part3_choice${selectedChoice}_B_placeholder`,
        content: 'Placeholder',
        title: 'Part 3 - Choice B',
      })
      .select()
      .single();

    // Create choice records
    await supabase.from('story_choices').insert([
      {
        from_node_id: nodeData.id,
        to_node_id: placeholderA.id,
        choice_text: parsed.choiceA,
        choice_order: 1,
      },
      {
        from_node_id: nodeData.id,
        to_node_id: placeholderB.id,
        choice_text: parsed.choiceB,
        choice_order: 2,
      },
    ]);

    // Update the parent's placeholder choice to point to this new node
    await supabase
      .from('story_choices')
      .update({ to_node_id: nodeData.id })
      .eq('from_node_id', parentNodeId)
      .eq('choice_order', selectedChoice === 'A' ? 1 : 2);

    // Generate image (placeholder for now)
    const imageUrl = `https://placehold.co/800x800/2a2a2a/white?text=${genre}+Part+2`;

    // Update node with image
    await supabase
      .from('story_nodes')
      .update({ image_url: imageUrl })
      .eq('id', nodeData.id);

    // Update user progress
    await supabase
      .from('user_story_progress')
      .update({ 
        current_node_id: nodeData.id,
        path_history: supabase.rpc('array_append', { 
          array: 'path_history', 
          element: nodeData.id 
        })
      })
      .eq('story_id', storyId)
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({
        nodeId: nodeData.id,
        storyText: parsed.storyText,
        imageUrl,
        choiceA: parsed.choiceA,
        choiceB: parsed.choiceB,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('Error in generate-story-part-2:', error);
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
