-- Phase 1: Database Foundation

-- 1.1 Create user_image_usage table for monthly limits
CREATE TABLE IF NOT EXISTS user_image_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  images_generated INTEGER DEFAULT 0,
  images_limit INTEGER DEFAULT 150,
  warning_threshold INTEGER DEFAULT 120,
  warned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

CREATE INDEX idx_user_image_usage_user_month ON user_image_usage(user_id, month_year);

ALTER TABLE user_image_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage" ON user_image_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service manages usage" ON user_image_usage FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Helper function to get/initialize usage
CREATE OR REPLACE FUNCTION get_user_image_usage(p_user_id UUID)
RETURNS TABLE (
  images_generated INTEGER,
  images_limit INTEGER,
  warning_threshold INTEGER,
  remaining INTEGER,
  should_warn BOOLEAN
) AS $$
DECLARE
  v_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  v_usage RECORD;
BEGIN
  INSERT INTO user_image_usage (user_id, month_year)
  VALUES (p_user_id, v_month)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  SELECT * INTO v_usage FROM user_image_usage WHERE user_id = p_user_id AND month_year = v_month;
  
  RETURN QUERY SELECT
    v_usage.images_generated,
    v_usage.images_limit,
    v_usage.warning_threshold,
    (v_usage.images_limit - v_usage.images_generated) AS remaining,
    (v_usage.images_generated >= v_usage.warning_threshold AND v_usage.warned_at IS NULL) AS should_warn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment usage
CREATE OR REPLACE FUNCTION increment_user_image_usage(p_user_id UUID, p_count INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  v_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  v_current INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT images_generated, images_limit INTO v_current, v_limit
  FROM user_image_usage WHERE user_id = p_user_id AND month_year = v_month;
  
  IF v_current + p_count > v_limit THEN RETURN FALSE; END IF;
  
  UPDATE user_image_usage
  SET images_generated = images_generated + p_count, updated_at = NOW()
  WHERE user_id = p_user_id AND month_year = v_month;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.2 Update story_images table for versioning and caching
ALTER TABLE story_images
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES story_images(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS full_res_url TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT,
ADD COLUMN IF NOT EXISTS image_size_px INTEGER DEFAULT 896,
ADD COLUMN IF NOT EXISTS generation_prompt TEXT,
ADD COLUMN IF NOT EXISTS generation_seed TEXT,
ADD COLUMN IF NOT EXISTS style_lock_data JSONB,
ADD COLUMN IF NOT EXISTS is_upfront BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_suggested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS generated_by_trigger TEXT;

CREATE INDEX IF NOT EXISTS idx_story_images_version ON story_images(story_id, page_number, version DESC);
CREATE INDEX IF NOT EXISTS idx_story_images_upfront ON story_images(story_id, is_upfront) WHERE is_upfront = TRUE;

COMMENT ON COLUMN story_images.version IS 'Version number (max 2 kept per page for rollback)';
COMMENT ON COLUMN story_images.thumbnail_url IS 'Signed URL to 512px thumbnail';
COMMENT ON COLUMN story_images.full_res_url IS 'Signed URL to 896px full resolution';
COMMENT ON COLUMN story_images.style_lock_data IS 'JSON with style/palette/camera from first image';

-- 1.3 Add character_sheet and source_version to stories
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS character_sheet JSONB,
ADD COLUMN IF NOT EXISTS source_version TEXT DEFAULT 'json_v1' CHECK (source_version IN ('json_v1', 'markdown_legacy'));

CREATE INDEX IF NOT EXISTS idx_stories_source_version ON stories(source_version);

COMMENT ON COLUMN stories.character_sheet IS 'Hybrid: user basics + AI-augmented details for visual continuity';
COMMENT ON COLUMN stories.source_version IS 'json_v1 = paginated JSON canonical, markdown_legacy = old format';

-- Mark existing stories as legacy if they don't have story_json
UPDATE stories SET source_version = 'markdown_legacy' WHERE story_json IS NULL;

-- 1.4 Create story-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-images', 
  'story-images', 
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'story-images');

CREATE POLICY "Authenticated users upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'story-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'story-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );