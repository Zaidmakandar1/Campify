-- Add feedback fields to event_reviews table
-- Run this in Supabase SQL Editor

ALTER TABLE public.event_reviews 
ADD COLUMN IF NOT EXISTS organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
ADD COLUMN IF NOT EXISTS usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
ADD COLUMN IF NOT EXISTS would_attend_again BOOLEAN;

-- Add comments for documentation
COMMENT ON COLUMN public.event_reviews.organization_rating IS 'How organized was the event (1-5)';
COMMENT ON COLUMN public.event_reviews.usefulness_rating IS 'How useful was the event (1-5)';
COMMENT ON COLUMN public.event_reviews.would_attend_again IS 'Would attend another event from this club';
