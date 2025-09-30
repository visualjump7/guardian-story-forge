-- Add story_universe field to stories table
ALTER TABLE public.stories 
ADD COLUMN story_universe text;

-- Insert Guardian Ranch specific themes
INSERT INTO public.story_themes (name, description, emoji) 
VALUES 
  ('Animal Teamwork', 'Stories about animals working together to overcome challenges', '🐾'),
  ('Rescue Mission', 'Exciting rescue adventures to save friends in danger', '🚁'),
  ('Guardian Heroes', 'Tales of brave animal guardians protecting their friends', '🦸')
ON CONFLICT DO NOTHING;