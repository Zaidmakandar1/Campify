-- Add UPDATE and DELETE policies for faculty to manage venues
-- Run this in Supabase SQL Editor

-- Check current policies
SELECT policyname, definition FROM pg_policies WHERE tablename = 'venues';

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Faculty can update venues" ON public.venues;
DROP POLICY IF EXISTS "Faculty can delete venues" ON public.venues;

-- Add UPDATE policy for all venues (faculty can edit any venue)
CREATE POLICY "Faculty can update venues"
  ON public.venues FOR UPDATE
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'faculty'
    )
  );

-- Add DELETE policy for all venues (faculty can delete any venue)
CREATE POLICY "Faculty can delete venues"
  ON public.venues FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'faculty'
    )
  );

-- Verify all policies exist
SELECT policyname, definition FROM pg_policies WHERE tablename = 'venues' ORDER BY policyname;
