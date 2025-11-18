-- Diagnostic script to check feedback table structure
-- Run this to see what columns exist and what's missing

-- Check all columns in feedback table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- Check if status column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'feedback' AND column_name = 'status'
) as status_column_exists;

-- Check RLS policies on feedback table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'feedback';

-- Check if notifications table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'notifications'
) as notifications_table_exists;
