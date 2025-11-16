-- FINAL ERROR FIX
-- This creates any missing tables and fixes remaining issues

-- 1. Create event_registrations table if it doesn't exist (in case it's needed somewhere)
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID, -- No foreign key to avoid issues
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended'))
);

-- 2. Grant permissions on the new table
GRANT ALL ON event_registrations TO authenticated, anon;

-- 3. Create policy for event_registrations
CREATE POLICY "Allow all on event_registrations" ON event_registrations FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 5. Refresh schema
NOTIFY pgrst, 'reload schema';