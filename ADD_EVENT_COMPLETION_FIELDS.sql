-- Add event completion fields to events table
-- Run this in Supabase SQL Editor

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS attendance INTEGER,
ADD COLUMN IF NOT EXISTS closing_remarks TEXT,
ADD COLUMN IF NOT EXISTS winner_details TEXT,
ADD COLUMN IF NOT EXISTS event_pics TEXT[], -- Array of image URLs
ADD COLUMN IF NOT EXISTS winner_pics TEXT[]; -- Array of image URLs

-- Add comments for documentation
COMMENT ON COLUMN public.events.attendance IS 'Number of attendees at the event';
COMMENT ON COLUMN public.events.closing_remarks IS 'Closing remarks about the event';
COMMENT ON COLUMN public.events.winner_details IS 'Details about event winners';
COMMENT ON COLUMN public.events.event_pics IS 'Array of event picture URLs';
COMMENT ON COLUMN public.events.winner_pics IS 'Array of winner/podium picture URLs';
