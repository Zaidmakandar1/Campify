-- Fix club policies to allow club creation
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view clubs" ON public.clubs;
DROP POLICY IF EXISTS "Club owners can update their club" ON public.clubs;

-- Create new policies that allow club creation
CREATE POLICY "Anyone can view clubs" 
  ON public.clubs FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create clubs" 
  ON public.clubs FOR INSERT 
  TO authenticated 
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Club owners can update their club" 
  ON public.clubs FOR UPDATE 
  TO authenticated 
  USING (profile_id = auth.uid());

CREATE POLICY "Club owners can delete their club" 
  ON public.clubs FOR DELETE 
  TO authenticated 
  USING (profile_id = auth.uid());

-- Also fix the unique constraint issue
ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS clubs_name_unique ON public.clubs(name);

-- Check if the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'clubs';