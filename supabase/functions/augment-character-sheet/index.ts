import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { characterName, characterType, userBasics } = await req.json();
    
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const prompt = `You are a children's book illustrator creating a character reference sheet for consistent artwork.

Character Name: ${characterName}
Character Type: ${characterType}
User's Description: ${userBasics || 'Not provided - use type as guide'}

Create a detailed visual description suitable for an AI image generator. Include:
1. Approximate age (if applicable for character type)
2. Hair details (color, style, length)
3. Eye color and distinctive facial features
4. Typical clothing or outfit
5. Overall appearance and body type
6. Any unique visual elements (wings, antennae, armor, etc.)

Keep it vivid, kid-friendly, and specific for visual consistency across multiple images.
Output ONLY the description in 2-3 sentences, no extra commentary.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a children's book character designer." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    });

    if (!aiResponse.ok) throw new Error("AI augmentation failed");

    const aiData = await aiResponse.json();
    const augmentedDescription = aiData.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({
        augmented: {
          appearance: augmentedDescription,
          consistent_traits: extractKeyTraits(augmentedDescription),
          locked: true
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractKeyTraits(description: string): string[] {
  const traits: string[] = [];
  
  const hairMatch = description.match(/([\w\s-]+)\s+hair/i);
  if (hairMatch) traits.push(hairMatch[0].trim());
  
  const eyeMatch = description.match(/([\w\s-]+)\s+eyes/i);
  if (eyeMatch) traits.push(eyeMatch[0].trim());
  
  const clothingMatch = description.match(/wearing\s+([\w\s,]+)/i);
  if (clothingMatch) traits.push(clothingMatch[1].split(',')[0].trim());
  
  return traits.slice(0, 5);
}