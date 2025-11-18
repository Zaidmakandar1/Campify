-- Fix RLS Policies for Feedback Table
-- This allows faculty to update feedback status

-- Drop existing policies that might be blocking updates
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;
DROP POLICY IF EXISTS "Faculty can update feedback" ON feedback;
DROP POLICY IF EXISTS "Faculty can update all feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;

-- Create comprehensive policies

-- 1. Students can update their own feedback
CREATE POLICY "Students can update own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Faculty can update ANY feedback (for status changes)
CREATE POLICY "Faculty can update all feedback"
  ON feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'faculty'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'faculty'
    )
  );

-- 3. Ensure SELECT policy exists for faculty
DROP POLICY IF EXISTS "Faculty can view all feedback" ON feedback;
CREATE POLICY "Faculty can view all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'faculty'
    )
  );

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'feedback'
ORDER BY policyname;
