import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Genre-specific system prompts and writing styles
const GENRE_CONFIGS = {
  'Action': {
    style: 'Simple sentences, fast-paced narrative, Captain Underpants humor',
    systemPrompt: `You write action-packed stories for children ages 6-9. Your stories are fast-paced, exciting, and full of SOUND EFFECTS like POW! CRASH! ZOOM! 

Writing rules:
- Use simple, short sentences
- Include lots of sound effects in ALL CAPS with exclamation marks
- Keep vocabulary at 2nd-3rd grade level
- Make it funny and exciting, never scary
- Always end with TWO choice questions starting with "Do you want" or "Should"
- Exactly 150-250 words per story part
- Captain Underpants style humor

Safety: No violence, scary content, or inappropriate themes. Age-appropriate action only.`,
  },
  'Agent': {
    style: 'Mystery with clues and twists, simple dialogue, Spy Kids style',
    systemPrompt: `You write secret agent mystery stories for children ages 7-10. Your stories have clues, gadgets, and exciting twists like Spy Kids.

Writing rules:
- Include spy gadgets and secret missions
- Plant clues that kids can follow
- Use simple dialogue and clear descriptions
- Keep it mysterious but not scary
- Always end with TWO choice questions about what gadget to use or where to investigate
- Exactly 150-250 words per story part
- Spy Kids style adventure

Safety: No scary villains, just fun mysteries. Age-appropriate spy adventure only.`,
  },
  'Fantasy': {
    style: 'Rhyming prose or fairy tale structure, whimsical like Dr. Seuss',
    systemPrompt: `You write magical fantasy stories for children ages 5-9. Your stories can rhyme or use classic fairy tale structure like Dr. Seuss or fairy tales.

Writing rules:
- Use rhyming couplets OR "Once upon a time" fairy tale structure
- Include magical creatures, spells, enchanted objects
- Keep language whimsical and playful
- Make it wonder-filled, never scary
- Always end with TWO choice questions about magical choices
- Exactly 150-250 words per story part
- Dr. Seuss or fairy tale style

Safety: Only friendly magic, no dark themes. Age-appropriate wonder and joy.`,
  },
  'Fairy Tale': {
    style: 'Classic fairy tale structure (Once upon a time), Grimm adaptations',
    systemPrompt: `You write classic fairy tales for children ages 4-9. Your stories follow traditional fairy tale structure with "Once upon a time" beginnings.

Writing rules:
- Start with "Once upon a time" structure
- Include classic fairy tale elements: kind heroes, magic, quests
- Use traditional fairy tale language but keep it simple
- Include moral lessons naturally
- Always end with TWO choice questions about hero's journey decisions
- Exactly 150-250 words per story part
- Classic Grimm fairy tale style (child-friendly version)

Safety: Traditional fairy tale goodness, no scary elements. Age-appropriate classic tales.`,
  },
  'Explorer': {
    style: 'Descriptive adventure with repetition and questions, Dora-style',
    systemPrompt: `You write explorer adventure stories for children ages 4-8. Your stories are like Dora the Explorer books with questions, animal friends, and discoveries.

Writing rules:
- Use descriptive, sensory language about nature
- Include friendly animal companions
- Ask questions throughout the story
- Use repetition for emphasis ("Map, map, map!")
- Always end with TWO choice questions about where to explore next
- Exactly 150-250 words per story part
- Dora the Explorer style adventure

Safety: Only friendly animals and safe exploration. Age-appropriate outdoor adventure.`,
  },
  'Superhero': {
    style: 'Comic-book style with onomatopoeia, bold actions, Dog Man humor',
    systemPrompt: `You write superhero stories for children ages 5-9. Your stories are comic book style with sound effects, powers, and Dog Man humor.

Writing rules:
- Include lots of comic book sound effects: POW! ZAP! WHOOSH!
- Describe superhero powers clearly
- Make it action-packed but funny
- Include a silly villain
- Always end with TWO choice questions about which power to use or how to save the day
- Exactly 150-250 words per story part
- Dog Man/comic book style

Safety: Cartoon-style superhero action only, no real danger. Age-appropriate heroics.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { heroName, genre, artStyle, userId } = await req.json();

    console.log('Generating Part 1:', { heroName, genre, artStyle, userId });

    // Validate inputs
    if (!heroName || !genre || !artStyle || !userId) {
      throw new Error('Missing required parameters');
    }

    const genreConfig = GENRE_CONFIGS[genre as keyof typeof GENRE_CONFIGS];
    if (!genreConfig) {
      throw new Error(`Invalid genre: ${genre}`);
    }

    // Initialize Supabase client
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

    // Build Part 1 prompt
    const userPrompt = `Write the beginning of a ${genre} story for a child hero named ${heroName}.

Requirements:
- Introduce ${heroName} and the main conflict/adventure
- Set up the world and atmosphere
- End with TWO choice questions that branch the story in different directions
- 150-250 words
- Follow the ${genre} writing style

Output format:
[Story text]

CHOICE A: [Question for first path]
CHOICE B: [Question for second path]`;

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

    console.log('Generated text:', generatedText);

    // Parse response
    const parsed = parseStoryResponse(generatedText, 1);

    // Validate
    const errors = validateStoryPart(parsed, 1, genre);
    if (errors.length > 0) {
      console.warn('Validation errors:', errors);
    }

    // Create story record
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .insert({
        title: `${heroName}'s ${genre} Adventure`,
        hero_name: heroName,
        story_type: genre,
        art_style: artStyle,
        content: parsed.storyText,
        created_by: user.id,
        is_public: false,
      })
      .select()
      .single();

    if (storyError) throw storyError;

    // Create Part 1 node
    const { data: nodeData, error: nodeError } = await supabase
      .from('story_nodes')
      .insert({
        story_id: storyData.id,
        node_key: 'part1_start',
        content: parsed.storyText,
        is_start_node: true,
        title: 'Part 1: The Beginning',
      })
      .select()
      .single();

    if (nodeError) throw nodeError;

    // Create placeholder nodes for Part 2 (will be generated when user chooses)
    const { data: placeholderA } = await supabase
      .from('story_nodes')
      .insert({
        story_id: storyData.id,
        node_key: 'part2_choiceA_placeholder',
        content: 'Placeholder',
        title: 'Part 2 - Choice A',
      })
      .select()
      .single();

    const { data: placeholderB } = await supabase
      .from('story_nodes')
      .insert({
        story_id: storyData.id,
        node_key: 'part2_choiceB_placeholder',
        content: 'Placeholder',
        title: 'Part 2 - Choice B',
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

    // Generate image (placeholder URL for now - we'll integrate image generation later)
    const imageUrl = `https://placehold.co/800x800/1a1a1a/white?text=${genre}+Story`;

    // Update node with image
    await supabase
      .from('story_nodes')
      .update({ image_url: imageUrl })
      .eq('id', nodeData.id);

    // Initialize user progress
    await supabase.from('user_story_progress').insert({
      user_id: user.id,
      story_id: storyData.id,
      current_node_id: nodeData.id,
      path_history: [nodeData.id],
    });

    // Save to user library
    await supabase.from('user_libraries').insert({
      user_id: user.id,
      story_id: storyData.id,
    });

    return new Response(
      JSON.stringify({
        storyId: storyData.id,
        nodeId: nodeData.id,
        storyText: parsed.storyText,
        imageUrl,
        choiceA: parsed.choiceA,
        choiceB: parsed.choiceB,
        genre,
        heroName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('Error in generate-story-part-1:', error);
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

function validateStoryPart(parsed: any, part: number, genre: string): string[] {
  const errors: string[] = [];
  
  const wordCount = parsed.storyText.split(/\s+/).length;
  if (wordCount < 150) errors.push(`Too short: ${wordCount} words`);
  if (wordCount > 250) errors.push(`Too long: ${wordCount} words`);
  
  if (part !== 3) {
    if (!parsed.choiceA) errors.push('Missing Choice A');
    if (!parsed.choiceB) errors.push('Missing Choice B');
  }
  
  if (genre === 'Action' || genre === 'Superhero') {
    if (!/[A-Z]{3,}!/.test(parsed.storyText)) {
      errors.push('Missing sound effects');
    }
  }
  
  return errors;
}
