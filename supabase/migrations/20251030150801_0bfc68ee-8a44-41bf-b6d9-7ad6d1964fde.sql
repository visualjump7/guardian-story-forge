-- Drop old tables and start fresh
DROP TABLE IF EXISTS user_libraries CASCADE;
DROP TABLE IF EXISTS story_images CASCADE;
DROP TABLE IF EXISTS story_nodes CASCADE;
DROP TABLE IF EXISTS story_choices CASCADE;
DROP TABLE IF EXISTS stories CASCADE;

-- Create new interactive story tables
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Story metadata
  title TEXT NOT NULL,
  hero_name TEXT NOT NULL,
  genre TEXT NOT NULL,
  art_style TEXT NOT NULL,
  
  -- Status
  is_complete BOOLEAN DEFAULT false,
  current_part INTEGER DEFAULT 1,
  
  -- Age band config
  age_band TEXT DEFAULT 'B'
);

CREATE TABLE story_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  part_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(story_id, part_number)
);

CREATE TABLE story_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  after_part INTEGER NOT NULL,
  choice_number INTEGER NOT NULL,
  choice_text TEXT NOT NULL,
  was_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(story_id, after_part, choice_number)
);

-- RLS Policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_choices ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own stories
CREATE POLICY "Users manage own stories" ON stories
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users manage own story parts" ON story_parts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_parts.story_id 
      AND stories.created_by = auth.uid()
    )
  );

CREATE POLICY "Users manage own story choices" ON story_choices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_choices.story_id 
      AND stories.created_by = auth.uid()
    )
  );

-- Admins can see everything
CREATE POLICY "Admins view all stories" ON stories
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins view all story parts" ON story_parts
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins view all story choices" ON story_choices
  FOR SELECT USING (is_admin(auth.uid()));