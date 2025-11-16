-- STEP 1: Create basic schema
-- Run this first

-- Create user role enum
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('student', 'faculty', 'club');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create feedback categories enum
DO $$ BEGIN
    CREATE TYPE public.feedback_category AS ENUM ('facilities', 'academics', 'events', 'administration', 'other');
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
-- 
STEP 2: Create other tables
-- Run this after step 1

CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER,
  image_url TEXT,
  amenities TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  performance_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.feedback_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES public.feedback(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(feedback_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_upvotes ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Anyone can view venues" ON public.venues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view feedback" ON public.feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can manage their upvotes" ON public.feedback_upvotes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());-- 
STEP 3: Create functions
-- Run this after step 2

-- Function to handle new user signup
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

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Upvote functions
CREATE OR REPLACE FUNCTION increment_upvotes(feedback_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.feedback 
  SET upvotes = upvotes + 1 
  WHERE id = feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_upvotes(feedback_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.feedback 
  SET upvotes = GREATEST(upvotes - 1, 0)
  WHERE id = feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_upvotes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_upvotes(UUID) TO authenticated;-- STEP 4
: Insert sample data
-- Run this after step 3

-- Sample venues
INSERT INTO public.venues (name, description, capacity, amenities) VALUES
('Main Auditorium', 'Large auditorium perfect for conferences and major events', 500, ARRAY['projector', 'sound system', 'air conditioning', 'parking']),
('Student Center Hall', 'Flexible space for meetings and social events', 150, ARRAY['wifi', 'catering', 'tables', 'chairs']),
('Library Conference Room', 'Quiet space ideal for academic discussions', 50, ARRAY['wifi', 'projector', 'whiteboard']),
('Outdoor Amphitheater', 'Open-air venue for cultural events and performances', 300, ARRAY['sound system', 'stage', 'lighting']);

-- Sample clubs
INSERT INTO public.clubs (name, description, performance_score) VALUES
('Computer Science Club', 'A community for CS students to learn, collaborate, and build amazing projects together.', 85),
('Drama Society', 'Bringing stories to life through theater, acting workshops, and creative performances.', 92),
('Environmental Club', 'Working towards a sustainable future through campus initiatives and awareness campaigns.', 78),
('Photography Club', 'Capturing moments and developing skills in digital and film photography.', 88);

-- Sample feedback
INSERT INTO public.feedback (title, content, category, upvotes, is_resolved) VALUES
('Need more water fountains in the library', 'The library only has one water fountain on the ground floor. Students studying on upper floors have to go all the way down just to get water. This is especially inconvenient during exam periods when the library is packed.', 'facilities', 15, false),
('Extend computer lab hours during finals', 'Computer labs close at 10 PM, but many students need to work on projects late into the night during finals week. Please consider extending hours to at least midnight during exam periods.', 'academics', 23, false),
('More vegetarian options in cafeteria', 'The cafeteria has limited vegetarian options, and they are often the same every day. It would be great to have more variety and healthier vegetarian meals.', 'facilities', 8, false),
('Improve WiFi in dormitories', 'WiFi connection in the dormitories is very slow and unreliable, especially during peak hours. This makes it difficult to attend online classes and complete assignments.', 'facilities', 31, false),
('Create more study spaces', 'During exam periods, it is very difficult to find quiet study spaces on campus. The library fills up quickly and there are not many alternative locations.', 'facilities', 19, true);

SELECT 'Database setup completed successfully!' as message;