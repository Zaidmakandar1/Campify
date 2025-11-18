-- Add total_people and group_size fields to events table
-- Run this in Supabase SQL Editor

-- Add the new columns
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS total_people INTEGER,
ADD COLUMN IF NOT EXISTS group_size INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN public.events.total_people IS 'Total number of people expected at the event';
COMMENT ON COLUMN public.events.group_size IS 'Number of people per group for team-based activities';
