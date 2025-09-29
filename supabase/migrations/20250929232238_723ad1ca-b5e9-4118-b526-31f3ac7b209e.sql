-- Create profiles table
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', 'Guardian'));
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Story themes (morals/lessons)
CREATE TABLE public.story_themes (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text not null,
  emoji text,
  created_at timestamptz default now()
);

ALTER TABLE public.story_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view themes"
  ON public.story_themes FOR SELECT
  USING (true);

-- Insert initial themes
INSERT INTO public.story_themes (name, description, emoji) VALUES
  ('Honesty', 'The importance of telling the truth and being truthful with others', '🤝'),
  ('Kindness', 'Treating others with compassion and generosity', '💖'),
  ('Courage', 'Being brave in the face of fear or difficulty', '🦁'),
  ('Perseverance', 'Never giving up, even when things are hard', '💪'),
  ('Friendship', 'The value of true friends and being a good friend', '👫'),
  ('Responsibility', 'Taking care of your duties and being accountable', '✅'),
  ('Gratitude', 'Being thankful and appreciating what you have', '🙏'),
  ('Sharing', 'The joy of sharing with others and working together', '🎁'),
  ('Respect', 'Treating everyone with dignity and consideration', '🌟'),
  ('Self-Belief', 'Believing in yourself and your abilities', '🌈'),
  ('Caution', 'Being careful and thinking before acting - if something seems too good to be true, it probably is', '⚠️'),
  ('Empathy', 'Understanding and caring about how others feel', '❤️'),
  ('Patience', 'Learning to wait and not rush things', '⏰'),
  ('Forgiveness', 'Learning to forgive others and let go of anger', '🕊️'),
  ('Hard Work', 'The rewards that come from effort and dedication', '🏆');

-- Stories table
CREATE TABLE public.stories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  theme_id uuid references public.story_themes(id),
  hero_name text,
  story_type text,
  content_type text check (content_type in ('text', 'audio', 'video')) default 'text',
  media_url text,
  cover_image_url text,
  is_featured boolean default false,
  is_public boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public and featured stories"
  ON public.stories FOR SELECT
  USING (is_public = true OR is_featured = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = created_by);

-- User library (saved stories)
CREATE TABLE public.user_libraries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  story_id uuid references public.stories(id) on delete cascade not null,
  saved_at timestamptz default now(),
  unique(user_id, story_id)
);

ALTER TABLE public.user_libraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own library"
  ON public.user_libraries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their library"
  ON public.user_libraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their library"
  ON public.user_libraries FOR DELETE
  USING (auth.uid() = user_id);

-- Insert some featured stories
INSERT INTO public.stories (title, content, theme_id, hero_name, story_type, is_featured, is_public, cover_image_url) VALUES
  ('The Golden Promise', 'Once upon a time, a young adventurer named Alex found a mysterious golden coin that promised to grant any wish. But as Alex soon learned, some promises are too good to be true...', (SELECT id FROM public.story_themes WHERE name = 'Caution'), 'Alex', 'Adventure', true, true, null),
  ('The Brave Little Star', 'In the vast night sky, a tiny star named Stella felt scared of shining too bright. But when her friends needed light to find their way home, she discovered her courage...', (SELECT id FROM public.story_themes WHERE name = 'Courage'), 'Stella', 'Fantasy', true, true, null),
  ('The Sharing Tree', 'Maya planted an apple tree and watched it grow. When it bore fruit, she had to decide: keep all the apples or share with her neighbors...', (SELECT id FROM public.story_themes WHERE name = 'Sharing'), 'Maya', 'Life Lesson', true, true, null);