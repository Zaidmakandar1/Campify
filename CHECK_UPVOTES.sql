-- Check if feedback_upvotes table exists and has data
SELECT 
  'feedback_upvotes table exists' as check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'feedback_upvotes'
  ) as result;

-- Check upvotes data
SELECT 
  'Total upvotes in database' as check_name,
  COUNT(*) as result
FROM feedback_upvotes;

-- Check your upvotes (replace with your user ID)
-- First, get your user ID
SELECT 
  'Your user ID' as info,
  id as user_id,
  email
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Then check your upvotes (replace USER_ID_HERE with actual ID from above)
-- SELECT * FROM feedback_upvotes WHERE user_id = 'USER_ID_HERE';

-- Check RLS policies on feedback_upvotes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'feedback_upvotes';
