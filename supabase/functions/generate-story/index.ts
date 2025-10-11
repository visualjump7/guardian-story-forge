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

    // Word count based on length
    const wordCounts = {
      short: "300-400 words",
      medium: "500-700 words", 
      long: "800-1000 words"
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

    let systemPrompt = `You are a creative children's story writer. Create engaging, age-appropriate stories that teach important life lessons.

WRITING STYLE REQUIREMENT:
${selectedStyle.prompt}

CRITICAL REQUIREMENT FOR TITLE:
- Generate a unique, creative, and captivating title that reflects the specific story and theme
- The title MUST be original and avoid generic patterns like "The Adventures of [name]"
- Use imaginative language that captures the essence of the story's unique elements
- Start your story with the title on the first line in markdown format: # Your Creative Title Here
- Make the title memorable and age-appropriate`;
    
    // Add Guardian Ranch universe context if selected
    if (storyUniverse === 'guardian-ranch') {
      systemPrompt += `\n\nGUARDIAN RANCH UNIVERSE:
This story takes place in the Guardian Ranch universe where:
- All heroes are animals with unique abilities and brave hearts
- Doctor Shadow is the recurring villain who captures innocent animals and threatens the peace
- Guardian Ranch is a sanctuary where rescued animals live safely together
- The animal heroes work as a team to protect their friends and rescue those in danger
- Each adventure strengthens the bonds between the animal friends
- Stories should reference the ongoing battle between good and the forces of Doctor Shadow
- Include elements of teamwork, courage, and the importance of helping friends in need
- The tone should be adventurous but reassuring, showing that good always prevails when friends work together`;
    }
    
    systemPrompt += `\n\nThe story should:
- Be ${wordCounts[storyLength as keyof typeof wordCounts]} long
- ${ageGuidelines[ageRange as keyof typeof ageGuidelines]}
- Follow the ${narrativeStructure} narrative structure: ${narrativeDescriptions[narrativeStructure as keyof typeof narrativeDescriptions]}
- Include vivid descriptions and engaging dialogue
- Have a clear beginning, middle, and end
- Teach the moral lesson naturally through the story events
- Be appropriate for children ages ${ageRange}
- Include moments of excitement and wonder
- End with a positive resolution that reinforces the lesson

Write in a warm, friendly tone that captivates young readers.`;

    const settingDescription = setting ? `\nSetting: ${setting.replace(/-/g, ' ')} - Make this setting come alive with rich sensory details.` : '';
    const secondaryThemeText = secondaryTheme ? `\n\nSecondary Theme: Also weave in the lesson of "${secondaryTheme.name}" (${secondaryTheme.description}) as a supporting element in the story.` : '';

    // Build character description for prompt
    let characterDescription = '';
    if (customCharacterDescription) {
      characterDescription = `\n\nCUSTOM CHARACTER DESCRIPTION (VERY IMPORTANT - USE THIS EXACTLY):
The hero ${heroName} is: ${customCharacterDescription}

This is the user's personal vision for the character. Make this description central to the story and incorporate these specific details throughout the narrative.${storyUniverse === 'guardian-ranch' ? ' Remember this character is an animal with special abilities in the Guardian Ranch universe.' : ''}`;
    } else if (characterType && characterType !== 'Surprise') {
      characterDescription = `\nCharacter Type: ${characterType}${storyUniverse === 'guardian-ranch' ? ' (an animal with special abilities)' : ''}`;
    }

    let userPrompt = `Create a ${storyType} story with these details:

Hero's Name: ${heroName}${characterDescription}
Story Type: ${storyType}
Narrative Structure: ${narrativeStructure}
Primary Moral Theme: ${theme.name} - ${theme.description}${secondaryThemeText}${settingDescription}
Age Range: ${ageRange}
Length: ${wordCounts[storyLength as keyof typeof wordCounts]}`;

    if (storyUniverse === 'guardian-ranch') {
      userPrompt += `\n\nGUARDIAN RANCH STORY REQUIREMENTS:
- ${heroName} must be an animal hero with special abilities
- Include Doctor Shadow as the villain who has captured an innocent animal friend
- Show the animal heroes at Guardian Ranch working together to plan the rescue
- Include exciting action scenes during the rescue mission
- End with the rescued friend safely at Guardian Ranch and the heroes celebrating their teamwork`;
    }

    userPrompt += `\n\nThe story should naturally incorporate the theme of "${theme.name}" (${theme.description}) through the hero's adventure and choices. Use the ${narrativeStructure} structure to create a compelling narrative arc. Make it exciting, magical, and memorable!`;

    console.log("Generating story with AI...");

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

    // Extract title from the first line - AI should always provide one now
    const titleMatch = storyContent.match(/^#\s*(.+)/m);
    if (!titleMatch) {
      throw new Error("AI did not generate a story title. Please try again.");
    }
    const title = titleMatch[1].trim();

    // Remove title from content if it exists
    const cleanContent = storyContent.replace(/^#\s*.+\n\n/, "");

    console.log("Saving story to database...");

    // Save story to database
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert({
        title,
        content: cleanContent,
        excerpt: excerpt || null,
        hero_name: heroName,
        story_type: storyType,
        theme_id: themeId,
        narrative_structure: narrativeStructure,
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

    // Split content into paragraphs for intelligent image placement
    const paragraphs = cleanContent.split('\n\n').filter((p: string) => p.trim());

    // Generate ONLY 1 hero image automatically
    const imagesToGenerate = [
      {
        type: 'cover',
        content: paragraphs[0] || cleanContent.substring(0, 200),
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
      JSON.stringify({ storyId: story.id, title, content: cleanContent }),
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
