-- Drop existing constraint that only allows limited image types
ALTER TABLE story_images DROP CONSTRAINT IF EXISTS story_images_image_type_check;

-- Add new constraint with all image types the function uses
ALTER TABLE story_images ADD CONSTRAINT story_images_image_type_check 
CHECK (image_type = ANY (ARRAY['cover'::text, 'early-scene'::text, 'mid-scene'::text, 'climax'::text, 'ending'::text, 'scene'::text]));