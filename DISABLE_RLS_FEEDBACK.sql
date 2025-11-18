-- TEMPORARY FIX: Disable RLS on feedback table for development
-- This allows all authenticated users to update feedback
-- Use this for testing, then enable proper RLS later

-- Option 1: Completely disable RLS (easiest for development)
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, use permissive policies
-- Uncomment the lines below and comment out the line above

-- ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Allow all authenticated users" ON feedback;
-- 
-- CREATE POLICY "Allow all authenticated users"
--   ON feedback FOR ALL
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');

-- Verify RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'feedback';

-- Show current policies
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'feedback';
