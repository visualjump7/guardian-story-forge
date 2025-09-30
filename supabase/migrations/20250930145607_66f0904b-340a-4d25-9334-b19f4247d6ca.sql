-- Add excerpt column to stories table
ALTER TABLE public.stories 
ADD COLUMN excerpt TEXT;