-- COMPLETE CAMPIFY DATABASE SETUP
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- =====================================================
-- 1. CREATE BASIC SCHEMA (if not exists)
-- =====================================================

-- Create user role enum
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('student', 'faculty', 'club');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- =====================================================
-- 2. CREATE VENUES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  capacity INTEGER,
  image_url TEXT,
  amenities TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view venues" ON public.venues;
CREATE POLICY "Anyone can view venues" ON public.venues FOR SELECT TO authenticated USING (true);

-- =====================================================
-- 3. CREATE CLUBS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  performance_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view clubs" ON public.clubs;
DROP POLICY IF EXISTS "Club owners can update their club" ON public.clubs;
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Club owners can update their club" ON public.clubs FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- =====================================================
-- 4. CREATE FEEDBACK SYSTEM
-- =====================================================

-- Create feedback categories enum
DO $$ BEGIN
    CREATE TYPE public.feedback_category AS ENUM ('facilities', 'academics', 'events', 'administration', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category feedback_category NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view feedback" ON public.feedback;
DROP POLICY IF EXISTS "Authenticated users can create feedback" ON public.feedback;
DROP POLICY IF EXISTS "Faculty can update feedback" ON public.feedback;

CREATE POLICY "Anyone can view feedback" ON public.feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Faculty can update feedback" ON public.feedback FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'faculty'
  )
);

-- Create feedback comments table
CREATE TABLE IF NOT EXISTS public.feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES public.feedback(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.feedback_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.feedback_comments;
CREATE POLICY "Anyone can view comments" ON public.feedback_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.feedback_comments FOR INSERT TO authenticated WITH CHECK (true);

-- Create feedback upvotes table
CREATE TABLE IF NOT EXISTS public.feedback_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES public.feedback(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(feedback_id, user_id)
);

ALTER TABLE public.feedback_upvotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view upvotes" ON public.feedback_upvotes;
DROP POLICY IF EXISTS "Users can manage their upvotes" ON public.feedback_upvotes;
CREATE POLICY "Users can view upvotes" ON public.feedback_upvotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their upvotes" ON public.feedback_upvotes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. CREATE EVENTS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  max_registrations INTEGER,
  current_registrations INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Clubs can manage their events" ON public.events;
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Clubs can manage their events" ON public.events FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE clubs.id = events.club_id
    AND clubs.profile_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE clubs.id = events.club_id
    AND clubs.profile_id = auth.uid()
  )
);

-- Create event registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can cancel their registrations" ON public.event_registrations;
CREATE POLICY "Users can view their registrations" ON public.event_registrations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can register for events" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can cancel their registrations" ON public.event_registrations FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create event reviews table
CREATE TABLE IF NOT EXISTS public.event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.event_reviews;
DROP POLICY IF EXISTS "Users can create reviews for attended events" ON public.event_reviews;
CREATE POLICY "Anyone can view reviews" ON public.event_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create reviews for attended events" ON public.event_reviews FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE event_registrations.event_id = event_reviews.event_id
    AND event_registrations.user_id = auth.uid()
  )
);

-- =====================================================
-- 6. CREATE VENUE BOOKINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.venue_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.venue_bookings;
DROP POLICY IF EXISTS "Clubs can create bookings" ON public.venue_bookings;
CREATE POLICY "Anyone can view bookings" ON public.venue_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Clubs can create bookings" ON public.venue_bookings FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE clubs.id = venue_bookings.club_id
    AND clubs.profile_id = auth.uid()
  )
);

-- =====================================================
-- 7. CREATE AI ANALYTICS TABLES
-- =====================================================

-- Create user activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own activities" ON public.user_activities;
DROP POLICY IF EXISTS "System can insert activities" ON public.user_activities;
CREATE POLICY "Users can view own activities" ON public.user_activities FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert activities" ON public.user_activities FOR INSERT TO authenticated WITH CHECK (true);

-- Create club analytics table
CREATE TABLE IF NOT EXISTS public.club_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.club_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view club analytics" ON public.club_analytics;
CREATE POLICY "Anyone can view club analytics" ON public.club_analytics FOR SELECT TO authenticated USING (true);

-- Create AI insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  target_id UUID,
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL DEFAULT 0.8,
  generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view insights" ON public.ai_insights;
CREATE POLICY "Anyone can view insights" ON public.ai_insights FOR SELECT TO authenticated USING (true);

-- =====================================================
-- 8. CREATE FUNCTIONS
-- =====================================================

-- Function to update profile timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;

-- Create trigger for profiles updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user signup (FIXED VERSION)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to increment upvotes
CREATE OR REPLACE FUNCTION increment_upvotes(feedback_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.feedback 
  SET upvotes = upvotes + 1 
  WHERE id = feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement upvotes
CREATE OR REPLACE FUNCTION decrement_upvotes(feedback_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.feedback 
  SET upvotes = GREATEST(upvotes - 1, 0)
  WHERE id = feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_upvotes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_upvotes(UUID) TO authenticated;

-- =====================================================
-- 9. FIX EXISTING USERS
-- =====================================================

-- Function to fix existing users without profiles
CREATE OR REPLACE FUNCTION fix_existing_user_roles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, raw_user_meta_data, email
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email, 'User'),
      COALESCE((user_record.raw_user_meta_data->>'role')::app_role, 'student')
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the fix function
SELECT fix_existing_user_roles();

-- Clean up the temporary function
DROP FUNCTION fix_existing_user_roles();

-- =====================================================
-- 10. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample venues (only if they don't exist)
INSERT INTO public.venues (name, description, capacity, amenities) 
SELECT * FROM (VALUES
  ('Main Auditorium', 'Large auditorium perfect for conferences and major events', 500, ARRAY['projector', 'sound system', 'air conditioning', 'parking']),
  ('Student Center Hall', 'Flexible space for meetings and social events', 150, ARRAY['wifi', 'catering', 'tables', 'chairs']),
  ('Library Conference Room', 'Quiet space ideal for academic discussions', 50, ARRAY['wifi', 'projector', 'whiteboard']),
  ('Outdoor Amphitheater', 'Open-air venue for cultural events and performances', 300, ARRAY['sound system', 'stage', 'lighting'])
) AS v(name, description, capacity, amenities)
WHERE NOT EXISTS (SELECT 1 FROM public.venues WHERE venues.name = v.name);

-- Insert sample clubs (only if they don't exist)
INSERT INTO public.clubs (name, description, performance_score) 
SELECT * FROM (VALUES
  ('Computer Science Club', 'A community for CS students to learn, collaborate, and build amazing projects together.', 85),
  ('Drama Society', 'Bringing stories to life through theater, acting workshops, and creative performances.', 92),
  ('Environmental Club', 'Working towards a sustainable future through campus initiatives and awareness campaigns.', 78),
  ('Photography Club', 'Capturing moments and developing skills in digital and film photography.', 88)
) AS c(name, description, performance_score)
WHERE NOT EXISTS (SELECT 1 FROM public.clubs WHERE clubs.name = c.name);

-- Insert sample feedback (only if they don't exist)
INSERT INTO public.feedback (title, content, category, upvotes, is_resolved) 
SELECT * FROM (VALUES
  ('Need more water fountains in the library', 'The library only has one water fountain on the ground floor. Students studying on upper floors have to go all the way down just to get water. This is especially inconvenient during exam periods when the library is packed.', 'facilities'::feedback_category, 15, false),
  ('Extend computer lab hours during finals', 'Computer labs close at 10 PM, but many students need to work on projects late into the night during finals week. Please consider extending hours to at least midnight during exam periods.', 'academics'::feedback_category, 23, false),
  ('More vegetarian options in cafeteria', 'The cafeteria has limited vegetarian options, and they are often the same every day. It would be great to have more variety and healthier vegetarian meals.', 'facilities'::feedback_category, 8, false),
  ('Improve WiFi in dormitories', 'WiFi connection in the dormitories is very slow and unreliable, especially during peak hours. This makes it difficult to attend online classes and complete assignments.', 'facilities'::feedback_category, 31, false),
  ('Create more study spaces', 'During exam periods, it is very difficult to find quiet study spaces on campus. The library fills up quickly and there are not many alternative locations.', 'facilities'::feedback_category, 19, true)
) AS f(title, content, category, upvotes, is_resolved)
WHERE NOT EXISTS (SELECT 1 FROM public.feedback WHERE feedback.title = f.title);

-- =====================================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_club_analytics_club_id ON public.club_analytics(club_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_target_id ON public.ai_insights(target_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires_at ON public.ai_insights(expires_at);
CREATE INDEX IF NOT EXISTS idx_feedback_upvotes_feedback_id ON public.feedback_upvotes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_upvotes_user_id ON public.feedback_upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON public.events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Check what we created
SELECT 'Setup completed successfully! Here are your tables:' as message;

SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'clubs', 'venues', 'feedback', 'feedback_comments', 
    'feedback_upvotes', 'events', 'event_registrations', 'event_reviews',
    'venue_bookings', 'user_activities', 'club_analytics', 'ai_insights'
  )
ORDER BY tablename;