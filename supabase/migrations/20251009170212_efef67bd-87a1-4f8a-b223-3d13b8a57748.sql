-- Create admin notes table
CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Admins can view all notes
CREATE POLICY "Admins can view all notes"
ON public.admin_notes
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert notes
CREATE POLICY "Admins can insert notes"
ON public.admin_notes
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update their own notes
CREATE POLICY "Admins can update their own notes"
ON public.admin_notes
FOR UPDATE
USING (is_admin(auth.uid()) AND admin_id = auth.uid());

-- Admins can delete their own notes
CREATE POLICY "Admins can delete their own notes"
ON public.admin_notes
FOR DELETE
USING (is_admin(auth.uid()) AND admin_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_admin_notes_user_id ON public.admin_notes(user_id);
CREATE INDEX idx_admin_notes_created_at ON public.admin_notes(created_at DESC);