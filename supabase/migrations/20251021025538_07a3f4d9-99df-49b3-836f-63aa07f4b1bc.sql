-- Add aspect ratio tracking to story_images table
ALTER TABLE story_images 
ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT '1:1',
ADD COLUMN IF NOT EXISTS width_px integer,
ADD COLUMN IF NOT EXISTS height_px integer;

-- Update existing records to have dimensions
UPDATE story_images 
SET width_px = COALESCE(image_size_px, 1024), 
    height_px = COALESCE(image_size_px, 1024),
    aspect_ratio = '1:1'
WHERE width_px IS NULL;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_story_images_aspect_ratio ON story_images(aspect_ratio);
CREATE INDEX IF NOT EXISTS idx_story_images_story_type ON story_images(story_id, image_type);

COMMENT ON COLUMN story_images.aspect_ratio IS 'Image aspect ratio (16:9 for covers, 1:1 for scenes)';
COMMENT ON COLUMN story_images.width_px IS 'Image width in pixels';
COMMENT ON COLUMN story_images.height_px IS 'Image height in pixels';