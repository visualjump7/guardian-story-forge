-- Create the featured-story-covers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('featured-story-covers', 'featured-story-covers', true);

-- RLS Policy: Only admins can upload to featured-story-covers
CREATE POLICY "Admins can upload featured covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'featured-story-covers' 
  AND public.is_admin(auth.uid())
);

-- RLS Policy: Anyone can view featured covers (they're public)
CREATE POLICY "Anyone can view featured covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'featured-story-covers');

-- RLS Policy: Only admins can delete featured covers
CREATE POLICY "Admins can delete featured covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'featured-story-covers'
  AND public.is_admin(auth.uid())
);

-- RLS Policy: Only admins can update featured covers
CREATE POLICY "Admins can update featured covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'featured-story-covers'
  AND public.is_admin(auth.uid())
);