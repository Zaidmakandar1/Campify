-- Create Club Profile for Existing Club Account
-- Run this in Supabase SQL Editor if your club account doesn't have a club profile

-- First, check if you already have a club profile
SELECT 
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role,
  c.id as club_id,
  c.name as club_name
FROM profiles p
LEFT JOIN clubs c ON c.profile_id = p.id
WHERE p.role = 'club';

-- If the club_id is NULL, create a club profile
-- Replace 'YOUR_PROFILE_ID' with your actual profile ID from the query above
-- Replace 'Your Club Name' with your desired club name

INSERT INTO clubs (profile_id, name, description, performance_score)
VALUES (
  'YOUR_PROFILE_ID',  -- Replace with your profile ID
  'Your Club Name',    -- Replace with your club name
  'Club description',  -- Replace with your club description
  50                   -- Starting performance score
)
ON CONFLICT (profile_id) DO NOTHING;

-- Verify the club was created
SELECT 
  c.*,
  p.email,
  p.full_name
FROM clubs c
JOIN profiles p ON p.id = c.profile_id
WHERE p.role = 'club';
