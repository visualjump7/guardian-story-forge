import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const storyRequestSchema = z.object({
  heroName: z.string().trim().min(1, "Hero name is required").max(50, "Hero name must be less than 50 characters"),
  excerpt: z.string().trim().max(500, "Excerpt must be less than 500 characters").optional(),
  characterType: z.enum(['Explorer', 'Super Hero', 'Creature', 'Robot', 'Warrior', 'Surprise']).optional(),
  storyType: z.enum(['Adventure', 'Mystery', 'Magical', 'Epic', 'Space', 'Surprise']),
  themeId: z.string().uuid("Invalid theme ID"),
  secondaryThemeId: z.string().uuid("Invalid secondary theme ID").optional(),
  narrativeStructure: z.enum(["heros-journey", "problem-solution", "rags-to-riches", "voyage-return", "quest", "overcoming-monster"], {
    errorMap: () => ({ message: "Invalid narrative structure" })
  }),
  writingStyle: z.enum([
    "interactive-playful",
    "rhyming-rhythmic", 
    "conversational-casual",
    "descriptive-immersive",
    "action-packed",
    "gentle-reassuring",
    "Surprise"
  ]).default("conversational-casual"),
  storyLength: z.enum(["short", "medium", "long"]).default("medium"),
  ageRange: z.enum(["5-7", "8-10", "11-12"]).default("8-10"),
  setting: z.string().max(100, "Setting must be less than 100 characters").optional(),
  artStyle: z.enum(["pixar-3d", "ghibli-2d", "watercolor", "classic-disney", "modern-cartoon", "anime", "comic-book"]).default("pixar-3d"),
  storyUniverse: z.string().max(50, "Story universe must be less than 50 characters").optional(),
  customCharacterDescription: z.string().trim().max(80, "Custom character description must be less than 80 characters").optional(),
  customStoryTypeDescription: z.string().trim().max(80, "Custom story type description must be less than 80 characters").optional(),
  customMissionDescription: z.string().trim().max(80, "Custom mission description must be less than 80 characters").optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validation = storyRequestSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    let { 
      heroName, 
      excerpt,
      characterType,
      storyType, 
      themeId, 
      narrativeStructure,
      writingStyle,
      storyLength,
      ageRange,
      setting,
      secondaryThemeId,
      artStyle,
      storyUniverse,
      customCharacterDescription,
      customStoryTypeDescription,
      customMissionDescription
    } = validation.data;

    // Server-side content validation for custom descriptions
    const INAPPROPRIATE_WORDS = [
      'damn', 'hell', 'crap', 'suck', 'stupid', 'idiot', 'dumb', 'hate',
      'kill', 'murder', 'death', 'dead', 'die', 'blood', 'knife', 'gun', 'weapon',
      'terror', 'horror', 'nightmare', 'demon', 'devil', 'evil',
      'sexy', 'drugs', 'alcohol', 'drunk', 'beer', 'wine'
    ];

    const validateCustomContent = (content: string | undefined, fieldName: string) => {
      if (!content) return;
      
      const lowerContent = content.toLowerCase();
      for (const word of INAPPROPRIATE_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(lowerContent)) {
          throw new Error(`${fieldName} contains inappropriate content for children. Please use kid-friendly language.`);
        }
      }
    };

    // Validate all custom descriptions
    validateCustomContent(customCharacterDescription, "Custom character description");
    validateCustomContent(customStoryTypeDescription, "Custom story type description");
    validateCustomContent(customMissionDescription, "Custom mission description");

    // Log custom inputs for debugging
    console.log('Custom inputs received:', {
      hasCustomCharacter: !!customCharacterDescription,
      hasCustomStoryType: !!customStoryTypeDescription,
      hasCustomMission: !!customMissionDescription,
      characterValue: customCharacterDescription || `Standard: ${characterType}`,
      storyTypeValue: customStoryTypeDescription || `Standard: ${storyType}`,
      missionValue: customMissionDescription || `Derived from: ${narrativeStructure}`
    });

    // Handle "Surprise Me" for character type - randomize at generation time
    if (characterType === 'Surprise' && !customCharacterDescription) {
      const characterOptions = ['Explorer', 'Super Hero', 'Creature', 'Robot', 'Warrior'];
      characterType = characterOptions[Math.floor(Math.random() * characterOptions.length)] as typeof characterType;
      console.log(`Surprise character type selected: ${characterType}`);
    }

    // Handle "Surprise Me" for story type - randomize at generation time
    if (storyType === 'Surprise') {
      const storyOptions = ['Adventure', 'Mystery', 'Magical', 'Epic', 'Space'];
      storyType = storyOptions[Math.floor(Math.random() * storyOptions.length)] as typeof storyType;
      console.log(`Surprise story type selected: ${storyType}`);
    }

    // Always auto-select writing style based on age range
    const styleRecommendations: Record<string, string[]> = {
      "5-7": ["interactive-playful", "rhyming-rhythmic", "gentle-reassuring"],
      "8-10": ["conversational-casual", "action-packed", "descriptive-immersive"],
      "11-12": ["descriptive-immersive", "action-packed", "conversational-casual"]
    };
    const recommendedStyles = styleRecommendations[ageRange] || ["conversational-casual"];
    writingStyle = recommendedStyles[Math.floor(Math.random() * recommendedStyles.length)] as typeof writingStyle;
    console.log(`Auto-selected writing style: ${writingStyle}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get theme details
    const { data: theme, error: themeError } = await supabase
      .from("story_themes")
      .select("*")
      .eq("id", themeId)
      .single();

    if (themeError || !theme) {
      throw new Error("Theme not found");
    }

    // Get secondary theme if provided
    let secondaryTheme = null;
    if (secondaryThemeId) {
      const { data } = await supabase
        .from("story_themes")
        .select("*")
        .eq("id", secondaryThemeId)
        .single();
      secondaryTheme = data;
    }

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

    // Check if user's library is full (max 10 stories)
    const { count: libraryCount, error: countError } = await supabase
      .from("user_libraries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("Failed to check library count:", countError);
      // Continue anyway - don't block story creation
    } else if (libraryCount !== null && libraryCount >= 10) {
      return new Response(
        JSON.stringify({ 
          error: "LIBRARY_FULL",
          message: "Your library is full (10/10 stories). Please delete a story before creating a new one.",
          currentCount: libraryCount 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Generate story using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Word count per node based on length
    const wordCountsPerNode = {
      short: "40-60 words per node, 6 nodes total",
      medium: "60-90 words per node, 7 nodes total", 
      long: "90-130 words per node, 8 nodes total"
    };

    // Vocabulary and complexity based on age
    const ageGuidelines = {
      "5-7": "Use simple vocabulary, short sentences (5-10 words), and clear language. Focus on concrete concepts and familiar situations.",
      "8-10": "Use moderate vocabulary with some challenging words, varied sentence structures, and introduce abstract concepts gradually.",
      "11-12": "Use sophisticated vocabulary, complex sentences, and explore nuanced themes with deeper emotional complexity."
    };

    // Narrative structure descriptions
    const narrativeDescriptions = {
      "heros-journey": "Follow the classic Hero's Journey: ordinary world, call to adventure, crossing threshold, tests and challenges, transformation, return with wisdom",
      "problem-solution": "Present a clear problem early, show the character's attempts to solve it, and conclude with a creative solution",
      "rags-to-riches": "Begin with the character in a humble or difficult situation, show their growth through challenges, end with success and transformation",
      "voyage-return": "Send the character on a journey to an unfamiliar place, show their discoveries and challenges, bring them home changed",
      "quest": "Give the character a specific goal or item to find, create obstacles along the way, conclude when the quest is fulfilled",
      "overcoming-monster": "Introduce a challenge or 'monster' (literal or metaphorical), build tension, show the character's courage in overcoming it"
    };

    // Writing style guidelines
    const writingStyleGuidelines: Record<string, { name: string; prompt: string }> = {
      "interactive-playful": {
        name: "Interactive & Playful",
        prompt: `Use an INTERACTIVE AND PLAYFUL writing style:
- Address the reader directly with "you" and rhetorical questions
- Include sound effects (WHOOSH! SPLASH! BOOM!)
- Use exclamation points for excitement
- Add playful asides like "Can you believe it?"
- Break the fourth wall occasionally
- Include moments that encourage imagination: "Imagine if YOU could..."
- Use onomatopoeia and expressive language
Example tone: "Guess what happened next? CRASH! The door flew open and there stood... can you guess? A GIANT talking bear wearing a top hat!"`
      },
      "rhyming-rhythmic": {
        name: "Rhyming & Rhythmic",
        prompt: `Use a RHYMING AND RHYTHMIC writing style:
- Create rhyming couplets or verses throughout the story
- Maintain consistent rhythm and meter
- Use repetitive phrases for memorability
- Include alliteration and consonance
- Make it flow like a song when read aloud
- Use simple, clear rhyme schemes (AABB, ABAB)
- Include a catchy repeated refrain
Example: "Through the forest dark and deep, where the shadows creep and creep, ${heroName} walked with courage bright, turning darkness into light."`
      },
      "conversational-casual": {
        name: "Conversational & Casual",
        prompt: `Use a CONVERSATIONAL AND CASUAL writing style:
- Write like you're telling the story to a friend
- Use contractions (didn't, won't, it's)
- Include casual phrases: "you know," "anyway," "so"
- Make it feel spontaneous and natural
- Use simple, everyday language
- Add relatable observations and humor
- Keep sentences varied but not overly formal
Example tone: "So there was ${heroName}, right? Just minding their own business when suddenly—and I mean SUDDENLY—everything changed."`
      },
      "descriptive-immersive": {
        name: "Descriptive & Immersive",
        prompt: `Use a DESCRIPTIVE AND IMMERSIVE writing style:
- Use all five senses in descriptions (sight, sound, smell, touch, taste)
- "Show don't tell" - describe actions and reactions
- Paint vivid word pictures with specific details
- Use strong, precise verbs and adjectives
- Create atmosphere through environmental details
- Help readers visualize every scene clearly
- Use metaphors and similes age-appropriately
Example: "The golden sunlight filtered through emerald leaves, dappling the forest floor with dancing shadows. ${heroName} could smell the sweet pine needles and hear the gentle whisper of wind through branches."`
      },
      "action-packed": {
        name: "Action-Packed & Fast-Paced",
        prompt: `Use an ACTION-PACKED AND FAST-PACED writing style:
- Use short, punchy sentences during action scenes
- Create urgency with active verbs
- Include cliffhangers and dramatic moments
- Maintain quick pacing with rapid scene changes
- Use sentence fragments for effect: "No time. Had to move. NOW."
- Build tension and release it strategically
- Include exciting action verbs: raced, soared, crashed, leaped
Example: "${heroName} ran. Faster. Faster! The ground shook. Something was coming. Something BIG. There was no time to think. Only time to act."`
      },
      "gentle-reassuring": {
        name: "Gentle & Reassuring",
        prompt: `Use a GENTLE AND REASSURING writing style:
- Use soft, calming language
- Maintain steady, peaceful pacing
- Include comforting phrases and positive affirmations
- Show emotions being processed healthily
- Create emotional safety while still having conflict
- Use warm, nurturing tone throughout
- Emphasize kindness, understanding, and hope
- Avoid harsh or scary language
Example: "${heroName} took a deep breath and felt a little better. It was okay to feel worried sometimes. That's what made the next step—taking one small, brave step forward—even more special."`
      }
    };

    const selectedStyle = writingStyleGuidelines[writingStyle as keyof typeof writingStyleGuidelines];

    let systemPrompt = `You are a creative children's story writer who creates INTERACTIVE BRANCHING NARRATIVES with multiple paths and choices.

🎯 CORE PRINCIPLE: USER INPUT IS SACRED
When a user provides custom descriptions (character details, story type, or mission), these are NOT suggestions - they are EXACT specifications that must be woven into every aspect of the narrative. You must analyze each word and ensure it appears in your story.

Your stories are evaluated on:
1. ACCURACY: Does it match what the user asked for? (Most Important)
2. ENGAGEMENT: Is it exciting and age-appropriate?
3. STRUCTURE: Does it follow the branching narrative format?
4. QUALITY: Is it well-written with good structure?

📖 BRANCHING NARRATIVE FORMAT (CRITICAL):
You MUST create an interactive story with the following structure:
- 1 START node (beginning of the story)
- 4-6 MIDDLE nodes (story progression with choices)
- 2-3 ENDING nodes (different possible conclusions)

Each node must be formatted EXACTLY as follows:

NODE: node_key
TITLE: Optional title for this scene
CONTENT:
The story content for this node goes here. ${wordCountsPerNode[storyLength as keyof typeof wordCountsPerNode]}. Make it engaging and descriptive.
CHOICES:
- CHOICE: Choice text here -> target_node_key
- CHOICE: Another choice text -> another_target_node_key
END_NODE

CRITICAL RULES:
- Use simple, memorable node_key names: start, forest_path, cave_entrance, victory_ending, etc.
- START node must have is_start_node=true
- ENDING nodes must have is_ending_node=true and NO choices
- All other nodes must have 2-3 CHOICES
- Each CHOICE must link to a valid node_key
- Ensure all nodes are reachable from START
- Create meaningful choices that reflect character decisions

EXAMPLE STRUCTURE:
NODE: start
CONTENT:
${heroName} stood at the edge of an ancient forest. Two paths lay ahead - one shimmering with golden light, the other mysterious and shadowed.
CHOICES:
- CHOICE: Take the golden path -> golden_path
- CHOICE: Follow the shadowed trail -> shadow_trail
END_NODE

NODE: golden_path
CONTENT:
The golden path led to a sparkling meadow...
CHOICES:
- CHOICE: Investigate the meadow -> meadow_discovery
- CHOICE: Continue to the mountain -> mountain_climb
END_NODE

NODE: shadow_trail
CONTENT:
The shadowed trail wound through dense trees...
CHOICES:
- CHOICE: Enter the cave -> cave_entrance
- CHOICE: Climb a tree to see ahead -> tree_view
END_NODE

NODE: victory_ending
CONTENT:
${heroName} succeeded in their quest and returned home triumphant!
END_NODE

WRITING STYLE REQUIREMENT:
${selectedStyle.prompt}

🛡️ MANDATORY CHILD SAFETY MESSAGING (CRITICAL FOR CHILDREN UNDER 12):
Every story MUST naturally incorporate age-appropriate personal safety lessons. Include at least 2-3 of these safety themes woven into the narrative:
- Stranger Danger: Don't go with strangers, even if they seem nice or offer treats
- Trusted Adults: Know who your trusted adults are and go to them when you need help
- Body Safety: Your body is yours - it's okay to say "no" to unwanted touch
- Speaking Up: Tell a trusted adult if something makes you uncomfortable
- Safe vs Unsafe Secrets: Safe secrets are fun (like surprise parties), unsafe secrets make you feel bad and should be told
- Internet Safety: Never share personal information online or meet internet friends in person without a parent
- Emergency Awareness: Know how to call for help and what to do in emergencies
- Buddy System: Stay with friends or family in public places
- Listen to Your Feelings: If something feels wrong, it probably is - trust your instincts
- Home Alone Safety: Never tell strangers you're home alone; keep doors locked

IMPORTANT: Weave these lessons naturally into the story through the character's choices and experiences. Don't preach - show the character making safe choices and explaining why. Make safety empowering, not scary.

CRITICAL REQUIREMENT FOR TITLE:
- Generate a unique, creative, and captivating title that reflects the specific story and theme
- The title MUST be original and avoid generic patterns like "The Adventures of [name]"
- Use imaginative language that captures the essence of the story's unique elements
- Start your story with: TITLE: Your Creative Title Here
- Make the title memorable and age-appropriate`;

    const settingDescription = setting ? `\nSetting: ${setting.replace(/-/g, ' ')} - Make this setting come alive with rich sensory details.` : '';
    const secondaryThemeText = secondaryTheme ? `\n\nSecondary Theme: Also weave in the lesson of "${secondaryTheme.name}" (${secondaryTheme.description}) as a supporting element in the story.` : '';

    // Build character description with critical emphasis
    let characterDescription = '';
    if (customCharacterDescription) {
      characterDescription = `
🎯 CUSTOM CHARACTER REQUIREMENT (USER'S EXACT WORDS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${customCharacterDescription}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTERPRETATION REQUIREMENTS:
✓ Analyze every word in the description above
✓ ${heroName} must embody ALL traits mentioned
✓ Show these traits through actions, not just descriptions
✓ Reference this description in at least 3 different scenes
✓ Make these character traits ESSENTIAL to how the plot unfolds
✓ Other characters should notice and comment on these traits${storyUniverse === 'guardian-ranch' ? '\n✓ Remember: In Guardian Ranch, this is an animal with special abilities' : ''}

EXAMPLE: If the user wrote "a brave young wizard with a fear of heights", your story must:
- Show the character being brave in multiple situations
- Establish they are young (mention age/appearance)
- Have them use magic/wizardry as their primary ability
- Create a scene where their fear of heights is a challenge they must overcome

THIS IS NOT OPTIONAL. The user specifically chose these words for a reason.`;
    } else if (characterType && characterType !== 'Surprise') {
      characterDescription = `\n\n🎯 CRITICAL CHARACTER REQUIREMENT:
${heroName} MUST BE a ${characterType}${storyUniverse === 'guardian-ranch' ? ' (an animal with special abilities)' : ''}.
- Make the character's ${characterType} nature central to the plot
- Use ${characterType}-specific abilities, traits, and behaviors throughout the story
- Reference the ${characterType} characteristics multiple times`;
    }

    // Build story type requirement with critical emphasis
    let storyTypeRequirement = '';
    if (customStoryTypeDescription) {
      storyTypeRequirement = `
🎯 CUSTOM STORY TYPE REQUIREMENT (USER'S EXACT WORDS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${customStoryTypeDescription}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTERPRETATION REQUIREMENTS:
✓ This defines the GENRE, TONE, and ATMOSPHERE of the entire story
✓ Every scene must feel like it belongs in this type of story
✓ Use vocabulary and pacing appropriate to this description
✓ The plot structure should match what this description implies

EXAMPLE: If the user wrote "a mysterious adventure in an underwater kingdom":
- Mystery elements: Include secrets, clues, discovery moments
- Adventure elements: Include exploration, challenges, excitement
- Underwater kingdom: All scenes take place underwater, show unique sea creatures, bioluminescence, underwater physics

Each word in the user's description is intentional and must be reflected.`;
    } else {
      storyTypeRequirement = `\n\n🎯 CRITICAL STORY TYPE REQUIREMENT:
This MUST BE a ${storyType} story.
${storyType === 'Adventure' ? '- Include exciting journeys, exploration, and discovering new places' : ''}${storyType === 'Mystery' ? '- Include clues, puzzles, secrets to uncover, and a mystery to solve' : ''}${storyType === 'Magical' ? '- Include magic, enchantment, fantastical elements, and wonder' : ''}${storyType === 'Epic' ? '- Include grand scale, high stakes, heroic deeds, and momentous challenges' : ''}${storyType === 'Space' ? '- Include space travel, alien worlds, futuristic technology, and cosmic exploration' : ''}
- Every scene must reinforce the ${storyType} genre`;
    }

    // Build mission requirement with critical emphasis
    let missionRequirement = '';
    if (customMissionDescription) {
      missionRequirement = `
🎯 CUSTOM MISSION REQUIREMENT (USER'S EXACT WORDS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${customMissionDescription}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTERPRETATION REQUIREMENTS:
✓ This is the CENTRAL PLOT - everything revolves around this
✓ The beginning must establish WHY this mission matters
✓ The middle must show CHALLENGES in achieving this mission
✓ The ending must COMPLETE this mission (success or meaningful resolution)
✓ Every major scene should advance progress toward this goal

EXAMPLE: If the user wrote "find the lost crystal in the underwater kingdom":
- Opening: Establish the crystal is lost and why it's important
- Middle: Show the hero searching underwater locations, facing obstacles
- Climax: The discovery/recovery of the crystal
- End: What happens now that the crystal is found

The mission is the spine of your story. Every scene should connect to it.`;
    } else {
      // Mission descriptions based on narrative structure
      const missionDescriptions: Record<string, string> = {
        'quest': 'The hero must find or protect a valuable TREASURE. The quest for this treasure drives every plot point.',
        'overcoming-monster': 'The hero must PROTECT someone or something from harm. Defense and guardianship are central themes.',
        'voyage-return': 'The hero must ESCAPE from danger or return from an unfamiliar place. The tension of the journey drives the narrative.',
        'guardian-ranch': 'Set in Guardian Ranch where the hero must help animals and protect the sanctuary. The mission involves caring for and defending the ranch.',
        'heros-journey': 'The hero must complete an epic RESCUE mission. Saving someone or something in danger is the central quest.',
        'problem-solution': 'The hero must solve a critical problem through clever thinking and bravery.',
        'rags-to-riches': 'The hero must overcome their circumstances and achieve something greater through determination.'
      };
      
      const missionDesc = missionDescriptions[narrativeStructure] || 'The hero must complete an important mission that drives the entire story.';
      
      missionRequirement = `\n\n🎯 CRITICAL MISSION/PLOT REQUIREMENT:
${missionDesc}`;
    }

    // Force AI to analyze custom inputs BEFORE generating story
    let analysisPhase = '';
    if (customCharacterDescription || customStoryTypeDescription || customMissionDescription) {
      analysisPhase = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 MANDATORY PRE-WRITING ANALYSIS PHASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEFORE writing the story, you MUST internally analyze these user requirements:

${customCharacterDescription ? `CHARACTER INPUT TO ANALYZE: "${customCharacterDescription}"
What this tells us:
- Physical traits to incorporate:
- Personality traits to show:
- Abilities/powers to demonstrate:
- Role in the story:
` : ''}${customStoryTypeDescription ? `STORY TYPE INPUT TO ANALYZE: "${customStoryTypeDescription}"
What this tells us:
- Genre elements required:
- Tone and atmosphere needed:
- Setting implications:
- Plot structure suggested:
` : ''}${customMissionDescription ? `MISSION INPUT TO ANALYZE: "${customMissionDescription}"
What this tells us:
- Central conflict:
- Stakes involved:
- Key plot beats required:
- Resolution needed:
` : ''}
⚠️ YOUR STORY WILL BE INVALID IF IT DOESN'T MATCH THESE INPUTS EXACTLY.
Do not proceed until you understand how to weave ALL of these elements throughout the entire narrative.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    let userPrompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ABSOLUTE REQUIREMENTS (HIGHEST PRIORITY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are the user's EXACT specifications. Your story will be REJECTED if it doesn't follow these precisely:

Hero's Name: ${heroName} (use this name throughout)
${analysisPhase}
${characterDescription}
${storyTypeRequirement}
${missionRequirement}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 STORY FRAMEWORK (SECONDARY REQUIREMENTS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ONLY after incorporating the above requirements, apply these guidelines:

Narrative Structure: ${narrativeStructure}
${narrativeDescriptions[narrativeStructure as keyof typeof narrativeDescriptions]}

Moral Theme: ${theme.name} - ${theme.description}${secondaryThemeText}

Technical Specs:
- Age Range: ${ageRange}
- Length: ${wordCountsPerNode[storyLength as keyof typeof wordCountsPerNode]}
- Setting: ${setting ? setting.replace(/-/g, ' ') : 'appropriate to the story type'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VERIFICATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before submitting your story, verify:
${customCharacterDescription ? `☑ Does the character match: "${customCharacterDescription}"?` : `☑ Is ${heroName} clearly a ${characterType}?`}
${customStoryTypeDescription ? `☑ Does the story type match: "${customStoryTypeDescription}"?` : `☑ Is this clearly a ${storyType} story?`}
${customMissionDescription ? `☑ Does the mission match: "${customMissionDescription}"?` : `☑ Does the plot follow the specified narrative structure?`}
☑ Are these elements present in EVERY major scene?
☑ Does the ending directly relate to these core elements?

If ANY checkbox is unchecked, REWRITE THE STORY.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    if (storyUniverse === 'guardian-ranch') {
      userPrompt += `\n\nGUARDIAN RANCH STORY REQUIREMENTS:
- ${heroName} must be an animal hero with special abilities
- Include Doctor Shadow as the villain who has captured an innocent animal friend
- Show the animal heroes at Guardian Ranch working together to plan the rescue
- Include exciting action scenes during the rescue mission
- End with the rescued friend safely at Guardian Ranch and the heroes celebrating their teamwork`;
    }

    userPrompt += `\n\nThe story should naturally incorporate the theme of "${theme.name}" (${theme.description}) through the hero's adventure and choices. Use the ${narrativeStructure} structure to create a compelling branching narrative. Make it exciting, magical, and memorable!

REMEMBER: Format your response with the exact NODE structure specified above. Start with TITLE: then list all nodes with NODE:, CONTENT:, CHOICES:, and END_NODE markers.`;

    console.log("Generating interactive story with AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate story with AI");
    }

    const aiData = await aiResponse.json();
    const storyContent = aiData.choices?.[0]?.message?.content;

    if (!storyContent) {
      throw new Error("No story content generated");
    }

    console.log("Parsing interactive story structure...");

    // Extract title
    const titleMatch = storyContent.match(/TITLE:\s*(.+)/);
    if (!titleMatch) {
      throw new Error("AI did not generate a story title. Please try again.");
    }
    const title = titleMatch[1].trim();

    // Parse nodes from the structured format
    interface ParsedNode {
      node_key: string;
      title: string | null;
      content: string;
      is_start_node: boolean;
      is_ending_node: boolean;
      choices: Array<{ choice_text: string; to_node_key: string; choice_order: number }>;
    }

    const parseNodes = (content: string): ParsedNode[] => {
      const nodes: ParsedNode[] = [];
      const nodeMatches = content.matchAll(/NODE:\s*(\w+)([\s\S]*?)END_NODE/g);
      
      for (const match of nodeMatches) {
        const node_key = match[1].trim();
        const nodeContent = match[2];
        
        // Extract title (optional)
        const titleMatch = nodeContent.match(/TITLE:\s*(.+)/);
        const nodeTitle = titleMatch ? titleMatch[1].trim() : null;
        
        // Extract content
        const contentMatch = nodeContent.match(/CONTENT:\s*([\s\S]*?)(?:CHOICES:|$)/);
        if (!contentMatch) continue;
        const content = contentMatch[1].trim().replace(/\*\*(.*?)\*\*/g, '$1');
        
        // Extract choices
        const choices: Array<{ choice_text: string; to_node_key: string; choice_order: number }> = [];
        const choiceMatches = nodeContent.matchAll(/CHOICE:\s*(.+?)\s*->\s*(\w+)/g);
        let choiceOrder = 0;
        for (const choiceMatch of choiceMatches) {
          choices.push({
            choice_text: choiceMatch[1].trim(),
            to_node_key: choiceMatch[2].trim(),
            choice_order: choiceOrder++
          });
        }
        
        nodes.push({
          node_key,
          title: nodeTitle,
          content,
          is_start_node: node_key === 'start',
          is_ending_node: choices.length === 0,
          choices
        });
      }
      
      return nodes;
    };

    const parsedNodes = parseNodes(storyContent);
    
    if (parsedNodes.length === 0) {
      throw new Error("Failed to parse story nodes. AI response format invalid.");
    }

    const startNode = parsedNodes.find(n => n.is_start_node);
    if (!startNode) {
      throw new Error("No start node found in story.");
    }

    console.log(`Parsed ${parsedNodes.length} nodes from story`);
    console.log("Saving story to database...");

    // Save story to database with narrative_type set to interactive
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert({
        title,
        content: startNode.content, // Store start node content for backward compatibility
        excerpt: excerpt || null,
        hero_name: heroName,
        story_type: storyType,
        theme_id: themeId,
        narrative_structure: narrativeStructure,
        narrative_type: 'interactive', // Set to interactive
        story_length: storyLength,
        age_range: ageRange,
        setting: setting || null,
        secondary_theme_id: secondaryThemeId || null,
        art_style: artStyle,
        is_public: false,
        created_by: user.id,
        story_universe: storyUniverse || null,
      })
      .select()
      .single();

    if (storyError) {
      console.error("Database error:", storyError);
      throw new Error("Failed to save story");
    }

    console.log("Story created successfully:", story.id);

    // Insert story nodes
    console.log("Creating story nodes...");
    const nodeInserts = parsedNodes.map(node => ({
      story_id: story.id,
      node_key: node.node_key,
      title: node.title,
      content: node.content,
      is_start_node: node.is_start_node,
      is_ending_node: node.is_ending_node,
    }));

    const { data: insertedNodes, error: nodesError } = await supabase
      .from("story_nodes")
      .insert(nodeInserts)
      .select();

    if (nodesError || !insertedNodes) {
      console.error("Failed to insert story nodes:", nodesError);
      throw new Error("Failed to create story nodes");
    }

    console.log(`Created ${insertedNodes.length} story nodes`);

    // Create mapping of node_key to node_id
    const nodeKeyToId = new Map<string, string>();
    insertedNodes.forEach(node => {
      nodeKeyToId.set(node.node_key, node.id);
    });

    // Insert story choices
    console.log("Creating story choices...");
    const choiceInserts: Array<{
      from_node_id: string;
      to_node_id: string;
      choice_text: string;
      choice_order: number;
    }> = [];

    parsedNodes.forEach(node => {
      const fromNodeId = nodeKeyToId.get(node.node_key);
      if (!fromNodeId) return;

      node.choices.forEach(choice => {
        const toNodeId = nodeKeyToId.get(choice.to_node_key);
        if (!toNodeId) {
          console.warn(`Warning: Choice points to non-existent node: ${choice.to_node_key}`);
          return;
        }

        choiceInserts.push({
          from_node_id: fromNodeId,
          to_node_id: toNodeId,
          choice_text: choice.choice_text,
          choice_order: choice.choice_order,
        });
      });
    });

    if (choiceInserts.length > 0) {
      const { error: choicesError } = await supabase
        .from("story_choices")
        .insert(choiceInserts);

      if (choicesError) {
        console.error("Failed to insert story choices:", choicesError);
        throw new Error("Failed to create story choices");
      }

      console.log(`Created ${choiceInserts.length} story choices`);
    }

    console.log("Story created successfully:", story.id);

    // Auto-save the story to user's library
    try {
      const { error: libraryError } = await supabase
        .from("user_libraries")
        .insert({
          user_id: user.id,
          story_id: story.id,
        });

      if (libraryError) {
        console.error("Failed to auto-save story to library:", libraryError);
        // Don't throw - story creation succeeded, library save is secondary
      } else {
        console.log("Story auto-saved to user's library");
      }
    } catch (libError) {
      console.error("Error auto-saving to library:", libError);
    }

    // Map art style to prompt description
// Helper functions for intelligent image placement
    const getVisualInterestScore = (text: string): number => {
      const actionWords = (text.match(/\b(ran|jumped|flew|fought|discovered|found|shouted|laughed|cried|grabbed|chased|explored|soared|climbed|danced|swam|raced)\b/gi) || []).length;
      const descriptiveWords = (text.match(/\b(bright|dark|magical|enormous|tiny|beautiful|scary|mysterious|shining|glowing|sparkling|dazzling|magnificent|wondrous)\b/gi) || []).length;
      const hasDialogue = text.includes('"') || text.includes("'");
      const wordCount = text.split(/\s+/).length;
      return (actionWords * 3) + (descriptiveWords * 2) + (hasDialogue ? 5 : 0) + Math.min(wordCount / 20, 5);
    };

    const findBestParagraphNear = (paragraphs: string[], targetPercent: number): { index: number; content: string } => {
      const totalParagraphs = paragraphs.length;
      const targetIndex = Math.floor(totalParagraphs * targetPercent);
      const searchRange = 3;
      const startIndex = Math.max(0, targetIndex - searchRange);
      const endIndex = Math.min(totalParagraphs - 1, targetIndex + searchRange);
      
      let bestIndex = targetIndex;
      let bestScore = 0;
      
      for (let i = startIndex; i <= endIndex; i++) {
        const score = getVisualInterestScore(paragraphs[i]);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      
      return { index: bestIndex, content: paragraphs[bestIndex] };
    };

    // Map art style to prompt description
    const artStylePrompts: Record<string, string> = {
      'pixar-3d': 'vibrant 3D animated illustration in Pixar/DreamWorks style with rich colors and cinematic lighting',
      'ghibli-2d': 'soft watercolor 2D illustration in Studio Ghibli style with gentle brushstrokes and dreamy atmosphere',
      'watercolor': 'gentle watercolor children\'s book illustration with soft edges and delicate color blending',
      'classic-disney': 'traditional hand-drawn 2D animation in classic Disney style with expressive characters and detailed backgrounds',
      'modern-cartoon': 'bold modern 2D cartoon style with clean lines, vibrant colors, and dynamic composition',
      'anime': 'Japanese anime style illustration with detailed character designs and atmospheric lighting',
      'comic-book': 'dynamic comic book style illustration with bold outlines and dramatic composition'
    };

    const styleDescription = artStylePrompts[artStyle] || artStylePrompts['pixar-3d'];

    // Generate ONLY 1 hero image automatically using start node content
    const imagesToGenerate = [
      {
        type: 'cover',
        content: startNode.content,
        description: 'opening scene with hero introduction'
      }
    ];

    console.log("Generating 1 hero image...");

    for (let i = 0; i < imagesToGenerate.length; i++) {
      const imageConfig = imagesToGenerate[i];
      
      try {
        console.log(`Generating ${imageConfig.type} image...`);
        
        const imagePrompt = `Create a child-friendly illustration in ${styleDescription}. Feature ${heroName} in this ${imageConfig.description}: ${imageConfig.content}. Art style: colorful, family-friendly, high-quality with expressive characters and magical atmosphere.`;

        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              { role: "user", content: imagePrompt }
            ],
            modalities: ["image", "text"]
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (imageUrl) {
            await supabase
              .from("story_images")
              .insert({
                story_id: story.id,
                image_url: imageUrl,
                image_type: imageConfig.type,
                is_selected: i === 0 // First image is selected as cover
              });
            
            if (i === 0) {
              // Update story cover_image_url for backward compatibility
              await supabase
                .from("stories")
                .update({ cover_image_url: imageUrl })
                .eq("id", story.id);
            }
            
            console.log(`${imageConfig.type} image generated successfully`);
          }
        } else {
          console.error(`Failed to generate ${imageConfig.type} image:`, await imageResponse.text());
        }
        
        // Small delay between generations to avoid rate limits
        if (i < imagesToGenerate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (imageError) {
        console.error(`Failed to generate ${imageConfig.type} image:`, imageError);
        // Continue with next image even if one fails
      }
    }

    console.log("Initial image generation complete");

    return new Response(
      JSON.stringify({ 
        storyId: story.id, 
        title, 
        nodeCount: parsedNodes.length,
        choiceCount: choiceInserts.length 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-story function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
