-- QUICK FIX: Run this if you're still getting "Unable to load club data" error
-- This script ensures all RLS policies and tables are properly configured

-- 1. Verify clubs table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clubs') THEN
    RAISE EXCEPTION 'clubs table does not exist! Run migrations first.';
  END IF;
END $$;

-- 2. Enable RLS on clubs table if not already enabled
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (clean slate)
DROP POLICY IF EXISTS "Anyone can view clubs" ON public.clubs;
DROP POLICY IF EXISTS "Club owners can update their club" ON public.clubs;
DROP POLICY IF EXISTS "Clubs can insert their own club" ON public.clubs;
DROP POLICY IF EXISTS "Club owners can delete their club" ON public.clubs;

-- 4. Create comprehensive policies

-- SELECT policy - Anyone authenticated can view all clubs
CREATE POLICY "Anyone can view clubs"
  ON public.clubs FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policy - Users can create clubs for themselves
CREATE POLICY "Users can create their own club"
  ON public.clubs FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- UPDATE policy - Club owners can update their club
CREATE POLICY "Club owners can update their club"
  ON public.clubs FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- DELETE policy - Club owners can delete their club
CREATE POLICY "Club owners can delete their club"
  ON public.clubs FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- 5. Verify policies are created
SELECT 'RLS Policies Created:' as message;
SELECT policyname, permissive, roles FROM pg_policies WHERE tablename = 'clubs';

-- 6. Test: Get total club count
SELECT COUNT(*) as total_clubs FROM public.clubs;
