-- Add author_name field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN author_name text;

-- Add a comment to document the field
COMMENT ON COLUMN public.profiles.author_name IS 'The author name that will be displayed as "Created by" in stories';