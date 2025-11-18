-- Check current user's role and permissions
-- Run this while signed in to see your user details

SELECT 
  auth.uid() as current_user_id,
  auth.role() as auth_role,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
  (SELECT raw_user_meta_data FROM auth.users WHERE id = auth.uid()) as metadata,
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) as user_role;

-- Check if you're recognized as faculty
SELECT 
  CASE 
    WHEN (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'faculty' 
    THEN 'YES - You are faculty'
    ELSE 'NO - You are NOT faculty. Your role is: ' || COALESCE((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()), 'NULL')
  END as faculty_check;
