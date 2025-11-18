-- Check event registrations table
SELECT 
  'event_registrations table exists' as check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'event_registrations'
  ) as result;

-- Check total registrations
SELECT 
  'Total registrations' as info,
  COUNT(*) as count
FROM event_registrations;

-- Check recent registrations with event details
SELECT 
  er.id,
  er.user_id,
  er.event_id,
  er.created_at,
  e.title as event_title,
  e.is_completed,
  p.full_name as user_name
FROM event_registrations er
LEFT JOIN events e ON e.id = er.event_id
LEFT JOIN profiles p ON p.id = er.user_id
ORDER BY er.created_at DESC
LIMIT 10;

-- Check RLS policies on event_registrations
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'event_registrations';

-- Get your user ID
SELECT 
  'Your user info' as info,
  id as user_id,
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
