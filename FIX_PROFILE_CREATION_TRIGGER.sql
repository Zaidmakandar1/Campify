-- FIX: Profile Creation Trigger Error
-- Error: "Database error saving new user"
-- Cause: Missing INSERT policy on profiles table for trigger/system role
-- Solution: Add INSERT policy for trigger to work

-- Step 1: Add INSERT policy to profiles table to allow trigger to create profiles
CREATE POLICY "System can create profiles on signup"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Alternative if above doesn't work - use service_role:
-- CREATE POLICY "System can create profiles on signup"
--   ON public.profiles
--   FOR INSERT
--   USING (true);

-- Step 2: Verify all required policies exist
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Step 3: Test by creating a new user manually
-- Go to Supabase Auth dashboard and try to sign up

-- If still not working, check trigger with this query:
SELECT 
  trigger_name,
  trigger_schema,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Debug: Check if profiles table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
