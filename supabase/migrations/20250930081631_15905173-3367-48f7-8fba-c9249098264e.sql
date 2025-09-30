-- Add new columns to stories table for enhanced parameters
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS narrative_structure TEXT,
ADD COLUMN IF NOT EXISTS story_length TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS age_range TEXT DEFAULT '8-10',
ADD COLUMN IF NOT EXISTS setting TEXT,
ADD COLUMN IF NOT EXISTS secondary_theme_id UUID REFERENCES story_themes(id);