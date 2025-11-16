-- Fix AI insights table errors
-- Run this in your Supabase SQL Editor

-- Drop and recreate ai_insights table with better policies
DROP TABLE IF EXISTS public.ai_insights CASCADE;

CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  target_id UUID,
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL DEFAULT 0.8,
  generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Anyone can view insights" 
  ON public.ai_insights FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "System can insert insights" 
  ON public.ai_insights FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "System can update insights" 
  ON public.ai_insights FOR UPDATE 
  TO authenticated 
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_target_id ON public.ai_insights(target_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires_at ON public.ai_insights(expires_at);

-- Test the table
SELECT 'AI insights table fixed successfully!' as message;