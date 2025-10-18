-- Phase 1: Add age_band to profiles table
ALTER TABLE profiles 
ADD COLUMN age_band TEXT CHECK (age_band IN ('A', 'B')) DEFAULT 'B';

COMMENT ON COLUMN profiles.age_band IS 'Age band for story configuration: A (5-7), B (8-10)';

-- Phase 1: Update stories table for JSON structure
ALTER TABLE stories
ADD COLUMN story_json JSONB,
ADD COLUMN writing_style TEXT,
ADD COLUMN character_archetype TEXT,
ADD COLUMN mission TEXT,
ADD COLUMN page_count INTEGER,
ADD COLUMN word_count INTEGER,
ADD COLUMN has_subplot BOOLEAN DEFAULT FALSE,
ADD COLUMN back_matter JSONB;

-- Add indexes for performance
CREATE INDEX idx_stories_age_band ON stories((story_json->>'band')) WHERE story_json IS NOT NULL;
CREATE INDEX idx_stories_writing_style ON stories(writing_style) WHERE writing_style IS NOT NULL;

COMMENT ON COLUMN stories.story_json IS 'Full paginated JSON structure with meta, pages[], and back_matter';
COMMENT ON COLUMN stories.writing_style IS 'Writing style used (from config styles[])';
COMMENT ON COLUMN stories.back_matter IS 'Glossary and reflection questions';

-- Update story_images table for page-specific images
ALTER TABLE story_images
ADD COLUMN page_number INTEGER,
ADD COLUMN page_beat TEXT;

CREATE INDEX idx_story_images_page ON story_images(story_id, page_number) WHERE page_number IS NOT NULL;