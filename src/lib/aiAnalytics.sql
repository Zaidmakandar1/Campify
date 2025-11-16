-- AI Analytics Extension for Campify
-- Run this in Supabase SQL Editor after the main setup

-- Create user activity tracking table
CREATE TABLE public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'page_view', 'event_register', 'feedback_submit', 'upvote', etc.
  target_type TEXT, -- 'event', 'feedback', 'club', 'venue'
  target_id UUID,
  metadata JSONB, -- Additional data about the activity
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON public.user_activities FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert activities" ON public.user_activities FOR INSERT TO authenticated WITH CHECK (true);

-- Create club analytics table
CREATE TABLE public.club_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL, -- 'engagement', 'event_success', 'member_growth', etc.
  metric_value DECIMAL NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.club_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view club analytics" ON public.club_analytics FOR SELECT TO authenticated USING (true);

-- Create AI insights table
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL, -- 'club_ranking', 'user_recommendation', 'trend_analysis'
  target_id UUID, -- club_id or user_id depending on type
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL DEFAULT 0.8,
  generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view insights" ON public.ai_insights FOR SELECT TO authenticated USING (true);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  interests JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  ai_recommendations_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at);
CREATE INDEX idx_club_analytics_club_id ON public.club_analytics(club_id);
CREATE INDEX idx_ai_insights_target_id ON public.ai_insights(target_id);
CREATE INDEX idx_ai_insights_expires_at ON public.ai_insights(expires_at);

-- Function to calculate club engagement score
CREATE OR REPLACE FUNCTION calculate_club_engagement(club_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  event_count INTEGER;
  avg_attendance DECIMAL;
  feedback_mentions INTEGER;
  engagement_score DECIMAL;
BEGIN
  -- Count events in last 3 months
  SELECT COUNT(*) INTO event_count
  FROM public.events
  WHERE club_id = club_uuid
  AND created_at > now() - interval '3 months';
  
  -- Average attendance rate
  SELECT COALESCE(AVG(
    CASE 
      WHEN max_registrations > 0 
      THEN (current_registrations::DECIMAL / max_registrations::DECIMAL) * 100
      ELSE 0 
    END
  ), 0) INTO avg_attendance
  FROM public.events
  WHERE club_id = club_uuid
  AND created_at > now() - interval '3 months';
  
  -- Count feedback mentions (simplified)
  SELECT COUNT(*) INTO feedback_mentions
  FROM public.feedback
  WHERE content ILIKE '%' || (SELECT name FROM public.clubs WHERE id = club_uuid) || '%'
  AND created_at > now() - interval '3 months';
  
  -- Calculate engagement score (0-100)
  engagement_score := (
    (event_count * 10) + 
    (avg_attendance * 0.5) + 
    (feedback_mentions * 5)
  );
  
  -- Cap at 100
  IF engagement_score > 100 THEN
    engagement_score := 100;
  END IF;
  
  RETURN engagement_score;
END;
$$ LANGUAGE plpgsql;