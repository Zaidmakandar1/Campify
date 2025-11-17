-- Fix: Ensure clubs table RLS policies allow authenticated users to read their own clubs

-- Step 1: Check current policies
SELECT policyname, definition FROM pg_policies WHERE tablename = 'clubs';

-- Step 2: Drop problematic policies if they exist
DROP POLICY IF EXISTS "Users can only select their own clubs" ON public.clubs;
DROP POLICY IF EXISTS "Club owners can update their club" ON public.clubs;

-- Step 3: Create/update SELECT policy - allow users to read clubs
CREATE POLICY IF NOT EXISTS "Anyone can view clubs"
  ON public.clubs FOR SELECT
  TO authenticated
  USING (true);

-- Step 4: Create/update UPDATE policy - allow club owners to update
CREATE POLICY IF NOT EXISTS "Club owners can update their club"
  ON public.clubs FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

-- Step 5: Create/update INSERT policy - allow authenticated to create clubs
CREATE POLICY IF NOT EXISTS "Authenticated can create clubs"
  ON public.clubs FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Step 6: Verify policies
SELECT policyname, definition FROM pg_policies WHERE tablename = 'clubs' ORDER BY policyname;

-- Step 7: Test - try to fetch clubs for your user
SELECT * FROM public.clubs LIMIT 5;
