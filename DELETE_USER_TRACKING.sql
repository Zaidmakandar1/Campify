-- 🗑️ Remove User Tracking - Delete user_activities Table

-- This removes all user tracking from your database
-- Decision: Don't track user activities (not needed for early stage app)

-- Step 1: Drop the table if it exists
DROP TABLE IF EXISTS public.user_activities CASCADE;

-- Step 2: Verify it's gone
-- Run this to confirm:
-- SELECT tablename FROM pg_tables WHERE tablename = 'user_activities';
-- Should return: NO RESULTS (table doesn't exist)

-- Done! No more user tracking in your database.
