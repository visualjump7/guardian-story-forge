-- Add audio_url column to stories table
ALTER TABLE public.stories 
ADD COLUMN audio_url TEXT;

COMMENT ON COLUMN public.stories.audio_url IS 'URL to generated audio narration of the story';