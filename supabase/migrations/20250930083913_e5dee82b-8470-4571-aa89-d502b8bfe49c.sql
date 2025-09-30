-- Create story_images table to store multiple cover images per story
CREATE TABLE public.story_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_images ENABLE ROW LEVEL SECURITY;

-- Users can view images for stories they own or that are public
CREATE POLICY "Users can view images for their stories or public stories"
ON public.story_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_images.story_id
    AND (stories.created_by = auth.uid() OR stories.is_public = true OR stories.is_featured = true)
  )
);

-- Users can insert images for their own stories
CREATE POLICY "Users can insert images for their own stories"
ON public.story_images
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_images.story_id
    AND stories.created_by = auth.uid()
  )
);

-- Users can update images for their own stories
CREATE POLICY "Users can update images for their own stories"
ON public.story_images
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_images.story_id
    AND stories.created_by = auth.uid()
  )
);

-- Users can delete images for their own stories
CREATE POLICY "Users can delete images for their own stories"
ON public.story_images
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_images.story_id
    AND stories.created_by = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_story_images_story_id ON public.story_images(story_id);