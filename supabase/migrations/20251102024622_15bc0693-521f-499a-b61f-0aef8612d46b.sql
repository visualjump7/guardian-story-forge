-- Drop the existing policy that blocks inserts
DROP POLICY IF EXISTS "Users manage own stories" ON public.stories;

-- Create a new INSERT policy that allows users to create their own stories
CREATE POLICY "Users can create own stories"
ON public.stories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Create a policy for SELECT/UPDATE/DELETE operations on existing stories
CREATE POLICY "Users manage own existing stories"
ON public.stories
FOR ALL
TO authenticated
USING (auth.uid() = created_by);