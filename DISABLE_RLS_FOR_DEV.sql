-- DISABLE RLS FOR DEVELOPMENT
-- This will make all database operations work by removing security restrictions
-- ⚠️ Only use this for development, not production!

-- =====================================================
-- DISABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_upvotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_analytics DISABLE ROW LEVEL SECURITY;

-- Drop the problematic ai_insights table and recreate it simple
DROP TABLE IF EXISTS public.ai_insights CASCADE;

CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  target_id UUID,
  insight_data JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL DEFAULT 0.8,
  generated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- No RLS on ai_insights
ALTER TABLE public.ai_insights DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- GRANT ALL PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users
GRANT ALL ON ALL