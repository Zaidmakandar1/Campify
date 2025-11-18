-- Update existing feedback records to add user_id
-- This is optional - only needed if you want to track who submitted old feedback

-- Check how many feedback records are missing user_id
SELECT 
  COUNT(*) as total_feedback,
  COUNT(user_id) as with_user_id,
  COUNT(*) - COUNT(user_id) as missing_user_id
FROM feedback;

-- If you want to assign old feedback to a specific user (like yourself for testing)
-- Uncomment and replace 'YOUR_USER_ID' with an actual user ID

-- UPDATE feedback 
-- SET user_id = 'YOUR_USER_ID'
-- WHERE user_id IS NULL;

-- To find your user ID, run this while signed in:
-- SELECT auth.uid() as my_user_id;

-- Note: For truly anonymous feedback, you can leave user_id as NULL
-- Notifications will only work for feedback that has a user_id
