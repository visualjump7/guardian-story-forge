-- Add art_style column to stories table
ALTER TABLE public.stories 
ADD COLUMN art_style TEXT DEFAULT 'pixar-3d';