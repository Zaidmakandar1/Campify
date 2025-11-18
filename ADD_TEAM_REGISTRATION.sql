-- Add team registration functionality
-- Run this in Supabase SQL Editor

-- Add team_name column to event_registrations
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS team_name TEXT,
ADD COLUMN IF NOT EXISTS team_leader_name TEXT;

-- Create team_members table to store individual team member details
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE NOT NULL,
  member_name TEXT NOT NULL,
  member_email TEXT,
  member_phone TEXT,
  position INTEGER NOT NULL, -- Order of team members
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policies for team_members
DROP POLICY IF EXISTS "Users can view their team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert their team members" ON public.team_members;
DROP POLICY IF EXISTS "Club owners can view all team members" ON public.team_members;

CREATE POLICY "Users can view their team members" ON public.team_members 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE event_registrations.id = team_members.registration_id
    AND event_registrations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their team members" ON public.team_members 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE event_registrations.id = team_members.registration_id
    AND event_registrations.user_id = auth.uid()
  )
);

CREATE POLICY "Club owners can view all team members" ON public.team_members 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.event_registrations er
    JOIN public.events e ON e.id = er.event_id
    JOIN public.clubs c ON c.id = e.club_id
    WHERE er.id = team_members.registration_id
    AND c.profile_id = auth.uid()
  )
);

-- Update event_registrations policies to allow club owners to view all registrations
DROP POLICY IF EXISTS "Club owners can view event registrations" ON public.event_registrations;
CREATE POLICY "Club owners can view event registrations" ON public.event_registrations 
FOR SELECT TO authenticated 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.clubs c ON c.id = e.club_id
    WHERE e.id = event_registrations.event_id
    AND c.profile_id = auth.uid()
  )
);

-- Add comments for documentation
COMMENT ON COLUMN public.event_registrations.team_name IS 'Name of the team (optional)';
COMMENT ON COLUMN public.event_registrations.team_leader_name IS 'Name of the team leader';
COMMENT ON TABLE public.team_members IS 'Individual team member details for event registrations';
