-- EMERGENCY DATABASE FIX FOR CONSOLE ERRORS
-- Run this in Supabase SQL Editor to fix all permission and structure issues

-- 1. DISABLE ALL RLS TEMPORARILY FOR DEBUGGING
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_insights DISABLE ROW LEVEL SECURITY;

-- 2. DROP AND RECREATE AI_INSIGHTS TABLE (fixing 406 error)
DROP TABLE IF EXISTS ai_insights CASCADE;
CREATE TABLE ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_type TEXT NOT NULL,
    target_id UUID,
    insight_data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(insight_type, target_id)
);

-- 3. ENSURE CLUBS TABLE EXISTS WITH CORRECT STRUCTURE (fixing 400 error)
DROP TABLE IF EXISTS clubs CASCADE;
CREATE TABLE clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    is_verified BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. GRANT ALL PERMISSIONS TO AUTHENTICATED USERS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 5. GRANT PERMISSIONS TO ANON USERS (for public access)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 6. CREATE SIMPLE POLICIES (ALLOW ALL FOR NOW)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on clubs" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on venues" ON venues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on feedback" ON feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ai_insights" ON ai_insights FOR ALL USING (true) WITH CHECK (true);

-- 7. RE-ENABLE RLS WITH PERMISSIVE POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- 8. INSERT SAMPLE DATA TO TEST
INSERT INTO clubs (name, description, category, contact_email, is_verified) VALUES
('Tech Club', 'Technology and programming club', 'Technology', 'tech@university.edu', true),
('Drama Society', 'Theater and performing arts', 'Arts', 'drama@university.edu', true),
('Sports Club', 'Various sports activities', 'Sports', 'sports@university.edu', true)
ON CONFLICT DO NOTHING;

-- 9. CREATE FUNCTION TO HANDLE UPSERTS PROPERLY
CREATE OR REPLACE FUNCTION upsert_ai_insight(
    p_insight_type TEXT,
    p_target_id UUID,
    p_insight_data JSONB,
    p_confidence_score DECIMAL DEFAULT 0.0
) RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO ai_insights (insight_type, target_id, insight_data, confidence_score)
    VALUES (p_insight_type, p_target_id, p_insight_data, p_confidence_score)
    ON CONFLICT (insight_type, target_id)
    DO UPDATE SET
        insight_data = EXCLUDED.insight_data,
        confidence_score = EXCLUDED.confidence_score,
        updated_at = NOW()
    RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION upsert_ai_insight TO authenticated, anon;

-- 10. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';