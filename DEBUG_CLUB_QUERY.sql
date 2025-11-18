-- Run this in Supabase SQL Editor to diagnose the club data issue

-- 1. Check clubs table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clubs'
ORDER BY ordinal_position;

-- 2. Check how many clubs exist
SELECT COUNT(*) as total_clubs FROM public.clubs;

-- 3. Check a sample club record
SELECT id, profile_id, name, created_at FROM public.clubs LIMIT 5;

-- 4. Check RLS policies on clubs table
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'clubs'
ORDER BY policyname;

-- 5. Check profiles table for current user (replace USER_ID with actual ID)
-- First, get a sample user ID
SELECT id, full_name, role FROM auth.users LIMIT 1;

-- 6. Then check if a club exists for that user
-- Example (replace 'user-id-here' with actual auth.users.id):
-- SELECT id, profile_id, name FROM public.clubs WHERE profile_id = 'user-id-here';

-- 7. Test if the SELECT query works
-- Run this to see if you have permission to query clubs:
SELECT id, profile_id, name FROM public.clubs;
