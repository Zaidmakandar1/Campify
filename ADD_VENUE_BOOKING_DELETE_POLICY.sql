-- Add DELETE policy for venue_bookings so clubs can delete their own bookings
-- Run this in Supabase SQL Editor

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Clubs can delete their bookings" ON public.venue_bookings;

-- Create DELETE policy for clubs to delete their own bookings
CREATE POLICY "Clubs can delete their bookings" 
ON public.venue_bookings 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE clubs.id = venue_bookings.club_id
    AND clubs.profile_id = auth.uid()
  )
);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'venue_bookings' 
AND cmd = 'DELETE';
