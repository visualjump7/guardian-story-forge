-- Add image_type column to story_images table
ALTER TABLE public.story_images 
ADD COLUMN image_type text DEFAULT 'cover' CHECK (image_type IN ('cover', 'scene', 'ending'));

-- Add comment explaining the column
COMMENT ON COLUMN public.story_images.image_type IS 'Type of image: cover (1st/main), scene (2nd/middle story), ending (3rd/climax)';