-- Add INSERT policy for faculty to create venues
-- Run this in Supabase SQL Editor

-- First, check current policies
SELECT * FROM pg_policies WHERE tablename = 'venues';

-- Drop old INSERT policy if exists
DROP POLICY IF EXISTS "Faculty can create venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated can create venues" ON public.venues;

-- Add new INSERT policy for faculty only
CREATE POLICY "Faculty can create venues"
  ON public.venues FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'faculty'
    )
  );

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'venues';
