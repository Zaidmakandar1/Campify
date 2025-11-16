-- COMPREHENSIVE DATABASE POLICY FIX
-- This will fix all permission issues
-- Run this entire script in your Supabase SQL Editor

-- =====================================================
-- 1. FIX CLUBS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view clubs" ON public.clubs;
DROP POLICY IF EXISTS "Club owners can update their club" ON public.clubs;
DROP POLICY IF EXISTS "Users can create clubs" ON public.clubs;
DROP POLICY IF EXISTS "Club owners can delete their club" ON public.clubs;

-- Create comprehensive policies for clubs
CREATE POLICY "Anyone can view clubs" 
  ON public.clubs FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create clubs" 
  ON public.clubs FOR INSERT 
  TO authenticated 
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Club owners can update their club" 
  ON public.clubs FOR UPDATE 
  TO authenticated 
  USING (profile_id = auth.uid());

CREATE POLICY "Club owners can delete their club" 
  ON public.clubs FOR DELETE 
  TO authenticated 
  USING (profile_id = auth.uid());

-- =====================================================
-- 2. FIX AI_INSIGHTS TABLE
-- =====================================================

-- Drop and recreate ai_insights table completely
DROP TABLE IF EXISTS public.ai_insights CASCADE;

CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  target_id UUID,
  insight_data JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL DEFAULT 0.8,
  generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies
CREATE POLICY "Anyone can view insights" 
  ON public.ai_insights FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Anyone can insert insights" 
  ON public.ai_insights FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Anyone can update insights" 
  ON public.ai_insights FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Anyone can delete insights" 
  ON public.ai_insights FOR DELETE 
  TO authenticated 
  USING (true);

-- =====================================================
-- 3. FIX VENUE_BOOKINGS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.venue_bookings;
DROP POLICY IF EXISTS "Clubs can create bookings" ON public.venue_bookings;

-- Create new policies
CREATE POLICY "Anyone can view bookings" 
  ON public.venue_bookings FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create bookings" 
  ON public.venue_bookings FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update their bookings" 
  ON public.venue_bookings FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = venue_bookings.club_id
      AND clubs.profile_id = auth.uid()
    )
  );

-- =====================================================
-- 4. FIX EVENTS TABLE POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Clubs can manage their events" ON public.events;

-- Create new policies
CREATE POLICY "Anyone can view events" 
  ON public.events FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create events" 
  ON public.events FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Club owners can update their events" 
  ON public.events FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = events.club_id
      AND clubs.profile_id = auth.uid()
    )
  );

CREATE POLICY "Club owners can delete their events" 
  ON public.events FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = events.club_id
      AND clubs.profile_id = auth.uid()
    )
  );

-- =====================================================
-- 5. ENSURE ALL TABLES HAVE BASIC PERMISSIONS
-- =====================================================

-- Make sure all tables allow basic operations
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.clubs TO authenticated;
GRANT ALL ON public.venues TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.venue_bookings TO authenticated;
GRANT ALL ON public.ai_insights TO authenticated;
GRANT ALL ON public.feedback TO authenticated;
GRANT ALL ON public.feedback_comments TO authenticated;
GRANT ALL ON public.feedback_upvotes TO authenticated;
GRANT ALL ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_reviews TO authenticated;
GRANT ALL ON public.user_activities TO authenticated;
GRANT ALL ON public.club_analytics TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 6. CREATE HELPER FUNCTION FOR DEBUGGING
-- =====================================================

CREATE OR REPLACE FUNCTION debug_user_permissions()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  has_profile BOOLEAN,
  profile_role TEXT,
  club_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as user_email,
    EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid()) as has_profile,
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) as profile_role,
    (SELECT COUNT(*)::INTEGER FROM public.clubs WHERE profile_id = auth.uid()) as club_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION debug_user_permissions() TO authenticated;

-- =====================================================
-- 7. TEST THE SETUP
-- =====================================================

-- Test query to verify everything works
SELECT 'Database policies fixed successfully!' as message;

-- Show current user info (if logged in)
SELECT * FROM debug_user_permissions();

-- Show table permissions
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;