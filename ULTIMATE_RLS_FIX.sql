-- ULTIMATE RLS FIX
-- This creates the most permissive policies possible while keeping RLS enabled

-- Drop ALL existing policies on feedback
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'feedback') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON feedback';
    END LOOP;
END $$;

-- Create super permissive policies for all operations
CREATE POLICY "Allow all SELECT for authenticated users"
  ON feedback FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all INSERT for authenticated users"
  ON feedback FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all UPDATE for authenticated users"
  ON feedback FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all DELETE for authenticated users"
  ON feedback FOR DELETE
  USING (auth.role() = 'authenticated');

-- Ensure RLS is enabled
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  '✅ RLS is now configured' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'feedback';

-- Show all policies
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename = 'feedback'
ORDER BY cmd;
