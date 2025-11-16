-- COMPLETE HUB AND EVENT SYSTEM FIX
-- This creates all tables with proper relationships for the Hub to work

-- 1. Disable RLS on all tables
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS venues DISABLE ROW LEVEL SECURITY;

-- 2. Drop and recreate all tables in correct order
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS venues CASCADE;

-- 3. Create venues table first (no dependencies)
CREATE TABLE venues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create clubs table (no foreign keys to avoid conflicts)
CREATE TABLE clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID, -- No foreign key constraint
    name TEXT NOT NULL,
    description TEXT,
    performance_score INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create events table with proper foreign keys
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    max_registrations INTEGER NOT NULL,
    current_registrations INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Insert sample data
INSERT INTO venues (name, description, capacity) VALUES
('Main Auditorium', 'Large auditorium for major events', 500),
('Conference Room 1', 'Small meeting room', 25),
('Sports Hall', 'Indoor sports facility', 200),
('Library Hall', 'Quiet study space', 100),
('Outdoor Amphitheater', 'Open-air venue', 300);

INSERT INTO clubs (name, description, performance_score) VALUES
('Tech Club', 'Technology and programming club', 75),
('Drama Society', 'Theater and performing arts', 80),
('Sports Club', 'Various sports activities', 85),
('Music Club', 'Musical performances and events', 70),
('Art Club', 'Visual arts and creativity', 65);

-- Get club and venue IDs for sample events
INSERT INTO events (club_id, venue_id, title, description, start_date, max_registrations, is_completed)
SELECT 
    c.id,
    v.id,
    'Tech Workshop: ' || c.name,
    'Learn the latest in technology with ' || c.name,
    NOW() + INTERVAL '7 days',
    50,
    false
FROM clubs c, venues v 
WHERE c.name = 'Tech Club' AND v.name = 'Conference Room 1'
LIMIT 1;

INSERT INTO events (club_id, venue_id, title, description, start_date, max_registrations, is_completed)
SELECT 
    c.id,
    v.id,
    'Drama Performance: Romeo and Juliet',
    'Classic Shakespeare performance by ' || c.name,
    NOW() + INTERVAL '14 days',
    200,
    false
FROM clubs c, venues v 
WHERE c.name = 'Drama Society' AND v.name = 'Main Auditorium'
LIMIT 1;

INSERT INTO events (club_id, venue_id, title, description, start_date, max_registrations, is_completed)
SELECT 
    c.id,
    v.id,
    'Basketball Tournament',
    'Inter-college basketball championship',
    NOW() - INTERVAL '7 days',
    100,
    true
FROM clubs c, venues v 
WHERE c.name = 'Sports Club' AND v.name = 'Sports Hall'
LIMIT 1;

-- 7. Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 8. Create permissive policies
CREATE POLICY "Allow all on venues" ON venues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clubs" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on events" ON events FOR ALL USING (true) WITH CHECK (true);

-- 9. Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 10. Refresh schema
NOTIFY pgrst, 'reload schema';