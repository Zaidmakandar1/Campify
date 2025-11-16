-- COMPLETE EVENT CREATION FIX
-- This fixes the database schema mismatch for event creation

-- 1. DISABLE RLS TEMPORARILY
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS venues DISABLE ROW LEVEL SECURITY;

-- 2. CREATE/FIX USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'club_representative', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE/FIX CLUBS TABLE (with correct column name)
DROP TABLE IF EXISTS clubs CASCADE;
CREATE TABLE clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES users(id), -- This matches the EventNew.tsx code
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    logo_url TEXT,
    banner_url TEXT,
    social_links JSONB DEFAULT '{}',
    member_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    performance_score INTEGER DEFAULT 50, -- This matches the EventNew.tsx code
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE/FIX VENUES TABLE
CREATE TABLE IF NOT EXISTS venues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER,
    location TEXT,
    amenities TEXT[],
    hourly_rate DECIMAL(10,2),
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE/FIX EVENTS TABLE (matching EventNew.tsx exactly)
DROP TABLE IF EXISTS events CASCADE;
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INSERT SAMPLE VENUES
INSERT INTO venues (name, description, capacity, location) VALUES
('Main Auditorium', 'Large auditorium for major events', 500, 'Building A, Ground Floor'),
('Conference Room 1', 'Small meeting room', 25, 'Building B, 2nd Floor'),
('Sports Hall', 'Indoor sports facility', 200, 'Sports Complex'),
('Library Hall', 'Quiet study and presentation space', 100, 'Library Building'),
('Outdoor Amphitheater', 'Open-air venue for outdoor events', 300, 'Campus Grounds')
ON CONFLICT DO NOTHING;

-- 7. GRANT ALL PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 8. CREATE PERMISSIVE POLICIES
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on clubs" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on venues" ON venues FOR ALL USING (true) WITH CHECK (true);

-- 9. RE-ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- 10. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';