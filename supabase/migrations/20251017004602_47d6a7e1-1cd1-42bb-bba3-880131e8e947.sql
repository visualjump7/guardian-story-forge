-- Create style_presets table
CREATE TABLE IF NOT EXISTS public.style_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  prompt_template TEXT NOT NULL,
  example TEXT,
  tags TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.style_presets ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can see enabled presets)
CREATE POLICY "Public can view enabled presets"
  ON public.style_presets
  FOR SELECT
  USING (enabled = true);

-- Admin write access - using existing is_admin function
CREATE POLICY "Admins can manage presets"
  ON public.style_presets
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add constraint to ensure prompt_template contains ${user_prompt}
ALTER TABLE public.style_presets
ADD CONSTRAINT prompt_template_must_contain_token
CHECK (prompt_template LIKE '%${user_prompt}%');

-- Create indexes
CREATE INDEX idx_style_presets_slug ON public.style_presets(slug);
CREATE INDEX idx_style_presets_enabled ON public.style_presets(enabled);

-- Insert the 4 seed presets
INSERT INTO public.style_presets (name, slug, prompt_template, example, tags) VALUES
(
  'Cinematic Animation (Pixar / Disney Style)',
  'cinematic-animation-pixar-disney-style',
  '${user_prompt}, in the style of a Pixar / Disney 3D animation — expressive characters, cinematic lighting, soft shadows, realistic textures, vibrant colors, and emotional atmosphere. Highly detailed character design with whimsical realism, warm tones, and a sense of storytelling.',
  'A young adventurer riding a sea turtle through glowing ocean currents, in the style of a Pixar / Disney 3D animation — expressive lighting, detailed water reflections, soft cinematic glow.',
  ARRAY['3d', 'cinematic', 'animation']
),
(
  'Anime Vision (Studio Quality)',
  'anime-vision-studio-quality',
  '${user_prompt}, in high-quality anime style — sharp linework, smooth cel shading, expressive faces, cinematic composition, and atmospheric lighting inspired by Studio Ghibli or Ufotable animation. Include stylized backgrounds and dynamic energy.',
  'A cyberpunk city street at night with neon lights reflecting off rain-soaked pavement, in high-quality anime style — cel shaded, cinematic perspective, glowing effects, inspired by Ufotable.',
  ARRAY['2d', 'anime', 'cel-shade']
),
(
  'Artistic Illustration (Storybook / Concept Art)',
  'artistic-illustration-storybook-concept-art',
  '${user_prompt}, as a detailed hand-drawn illustration — soft brush strokes, textured background, natural lighting, balanced color palette, and painterly storytelling style. Evoke the look of concept art or a children''s book illustration.',
  'A fox playing a guitar under a tree at sunrise, as a detailed hand-drawn illustration — painterly brushwork, warm natural colors, textured paper look.',
  ARRAY['illustration', 'painterly', 'storybook']
),
(
  'Dynamic Comic Book (Graphic Novel Style)',
  'dynamic-comic-book-graphic-novel-style',
  '${user_prompt}, in bold comic book style — strong ink outlines, halftone shading, vivid contrast, and dynamic action poses. Inspired by Marvel and DC graphic novels, with dramatic lighting, exaggerated expressions, and speech bubble or panel composition if applicable.',
  'A masked hero leaping across city rooftops at sunset, in bold comic book style — strong ink outlines, vivid contrast, halftone textures, and dynamic motion lines.',
  ARRAY['comic', 'halftone', 'graphic-novel']
);