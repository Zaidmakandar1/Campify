-- FIXED EVENT DATABASE SETUP
-- This version checks existing structure and fixes only what's needed

-- 1. DISABLE RLS TEMPORARILY
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS venues DISABLE ROW LEVEL SECURITY;

-- 2. CREATE USERS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'club_representative', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FIX CLUBS TABLE (drop and recreate to ensure correct structure)
DROP TABLE IF EXISTS clubs CASCADE;
CREATE TABLE clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES users(id), -- This matches EventNew.tsx
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
    performance_score INTEGER DEFAULT 50, -- This matches EventNew.tsx
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CHECK AND FIX VENUES TABLE
-- First, let's see what columns exist and add missing ones
DO $$
BEGIN
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'venues' AND column_name = 'location') THEN
        ALTER TABLE venues ADD COLUMN location TEXT;
    END IF;
    
    -- Add other missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'venues' AND column_name = 'description') THEN
        ALTER TABLE venues ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'venues' AND column_name = 'capacity') THEN
        ALTER TABLE venues ADD COLUMN capacity INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'venues' AND column_name = 'amenities') THEN
        ALTER TABLE venues ADD COLUMN amenities TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'venues' AND column_name = 'hourly_rate') THEN
        ALTER TABLE venues ADD COLUMN hourly_rate DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'venues' AND column_name = 'image_url') THEN
        ALTER TABLE venues ADD COLUMN image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'venues' AND column_name = 'is_available') THEN
        ALTER TABLE venues ADD COLUMN is_available BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 5. CREATE EVENTS TABLE (drop and recreate to match EventNew.tsx exactly)
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

-- 6. INSERT SAMPLE VENUES (only if table is empty)
INSERT INTO venues (name, description, capacity, location) 
SELECT 'Main Auditorium', 'Large auditorium for major events', 500, 'Building A, Ground Floor'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Main Auditorium');

INSERT INTO venues (name, description, capacity, location) 
SELECT 'Conference Room 1', 'Small meeting room', 25, 'Building B, 2nd Floor'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Conference Room 1');

INSERT INTO venues (name, description, capacity, location) 
SELECT 'Sports Hall', 'Indoor sports facility', 200, 'Sports Complex'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Sports Hall');

INSERT INTO venues (name, description, capacity, location) 
SELECT 'Library Hall', 'Quiet study and presentation space', 100, 'Library Building'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Library Hall');

INSERT INTO venues (name, description, capacity, location) 
SELECT 'Outdoor Amphitheater', 'Open-air venue for outdoor events', 300, 'Campus Grounds'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Outdoor Amphitheater');

-- 7. GRANT ALL PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 8. DROP EXISTING POLICIES (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on clubs" ON clubs;
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
DROP POLICY IF EXISTS "Allow all operations on venues" ON venues;

-- 9. CREATE PERMISSIVE POLICIES
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on clubs" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on venues" ON venues FOR ALL USING (true) WITH CHECK (true);

-- 10. RE-ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- 11. REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';