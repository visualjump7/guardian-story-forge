-- Add narrative type to stories table
ALTER TABLE stories 
ADD COLUMN narrative_type TEXT DEFAULT 'linear' CHECK (narrative_type IN ('linear', 'interactive'));

-- Create story_nodes table
CREATE TABLE story_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  node_key TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  is_start_node BOOLEAN DEFAULT false,
  is_ending_node BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, node_key)
);

-- Enable RLS on story_nodes
ALTER TABLE story_nodes ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_nodes
CREATE POLICY "Users can view story nodes for public stories"
ON story_nodes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_nodes.story_id 
    AND (stories.is_public = true OR stories.is_featured = true OR stories.created_by = auth.uid())
  )
);

CREATE POLICY "Admins can manage all story nodes"
ON story_nodes FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can manage nodes for their own stories"
ON story_nodes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_nodes.story_id 
    AND stories.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_nodes.story_id 
    AND stories.created_by = auth.uid()
  )
);

-- Create story_choices table
CREATE TABLE story_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id UUID NOT NULL REFERENCES story_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES story_nodes(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  choice_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on story_choices
ALTER TABLE story_choices ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_choices
CREATE POLICY "Users can view story choices for accessible stories"
ON story_choices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM story_nodes
    JOIN stories ON stories.id = story_nodes.story_id
    WHERE story_nodes.id = story_choices.from_node_id
    AND (stories.is_public = true OR stories.is_featured = true OR stories.created_by = auth.uid())
  )
);

CREATE POLICY "Admins can manage all story choices"
ON story_choices FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can manage choices for their own stories"
ON story_choices FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM story_nodes
    JOIN stories ON stories.id = story_nodes.story_id
    WHERE story_nodes.id = story_choices.from_node_id
    AND stories.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM story_nodes
    JOIN stories ON stories.id = story_nodes.story_id
    WHERE story_nodes.id = story_choices.from_node_id
    AND stories.created_by = auth.uid()
  )
);

-- Create user_story_progress table
CREATE TABLE user_story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_node_id UUID NOT NULL REFERENCES story_nodes(id) ON DELETE CASCADE,
  path_history JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- Enable RLS on user_story_progress
ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_story_progress
CREATE POLICY "Users can view their own story progress"
ON user_story_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own story progress"
ON user_story_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own story progress"
ON user_story_progress FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own story progress"
ON user_story_progress FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all story progress"
ON user_story_progress FOR SELECT
USING (is_admin(auth.uid()));

-- Create index for better query performance
CREATE INDEX idx_story_nodes_story_id ON story_nodes(story_id);
CREATE INDEX idx_story_choices_from_node ON story_choices(from_node_id);
CREATE INDEX idx_user_story_progress_user_story ON user_story_progress(user_id, story_id);