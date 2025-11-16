-- MINIMAL EVENT FIX - Just fix what's broken
-- Run this if the previous script still has issues

-- 1. Disable RLS temporarily
ALTER TABLE IF EXISTS clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS venues DISABLE ROW LEVEL SECURITY;

-- 2. Fix clubs table structure (the main issue)
DROP TABLE IF EXISTS clubs CASCADE;
CREATE TABLE clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID, -- This is what EventNew.tsx expects
    name TEXT NOT NULL,
    description TEXT,
    performance_score INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Fix events table structure
DROP TABLE IF EXISTS events CASCADE;
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES clubs(id),
    venue_id UUID REFERENCES venues(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_registrations INTEGER NOT NULL,
    current_registrations INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add just basic venues (without location if it doesn't exist)
INSERT INTO venues (name) VALUES 
('Main Auditorium'),
('Conference Room 1'),
('Sports Hall'),
('Library Hall')
ON CONFLICT DO NOTHING;

-- 5. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- 6. Create simple policies
CREATE POLICY "Allow all" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON venues FOR ALL USING (true) WITH CHECK (true);

-- 7. Enable RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;