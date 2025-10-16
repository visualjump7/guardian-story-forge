-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create prompt templates table for managing LLM prompts and parameters
CREATE TABLE public.prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL, -- 'story_system', 'story_user', 'image_generation', etc.
  name text NOT NULL,
  version integer DEFAULT 1,
  content text NOT NULL,
  parameters jsonb DEFAULT '{}'::jsonb, -- store temperature, max_tokens, model, etc.
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can view prompt templates
CREATE POLICY "Admins can view all prompt templates"
ON public.prompt_templates
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can insert prompt templates
CREATE POLICY "Admins can insert prompt templates"
ON public.prompt_templates
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update prompt templates
CREATE POLICY "Admins can update prompt templates"
ON public.prompt_templates
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can delete prompt templates
CREATE POLICY "Admins can delete prompt templates"
ON public.prompt_templates
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_prompt_templates_updated_at
BEFORE UPDATE ON public.prompt_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_prompt_templates_type_active ON public.prompt_templates(template_type, is_active);

-- Insert default story system prompt template
INSERT INTO public.prompt_templates (template_type, name, content, parameters, is_active) VALUES
('story_system', 'Default Story System Prompt', 
'You are a creative children''s story writer specializing in personalized, educational stories for kids ages 5-12. Your stories must be:
- Age-appropriate and engaging
- Include positive life lessons and safety messages
- Rich in descriptive language
- Structured with clear beginning, middle, and end
- Free from violence, scary content, or inappropriate themes
- Educational while entertaining

CRITICAL SAFETY REQUIREMENTS:
- Never include content that could frighten or disturb children
- No violence, weapons, or dangerous situations
- No scary creatures or horror elements
- Always promote positive values: kindness, bravery, honesty, friendship
- Include age-appropriate safety lessons when relevant

FORMAT REQUIREMENTS:
- Start with an engaging title
- Write in clear paragraphs
- Use vivid descriptions
- Include dialogue when appropriate
- End with a satisfying conclusion and moral lesson',
'{"model": "google/gemini-2.5-flash", "temperature": 0.7, "max_tokens": 2000}'::jsonb,
true);

-- Insert default image generation prompt template
INSERT INTO public.prompt_templates (template_type, name, content, parameters, is_active) VALUES
('image_generation', 'Default Image Generation Prompt',
'Create a child-friendly, vibrant illustration in {art_style} style. The image should be colorful, inviting, and appropriate for children ages 5-12. Focus on:
- Bright, cheerful colors
- Safe, friendly characters
- Engaging, imaginative scenes
- No scary or violent elements
- High quality, detailed artwork

Scene: {scene_description}
Characters: {characters}
Mood: {mood}',
'{"model": "google/gemini-2.5-flash-image-preview"}'::jsonb,
true);