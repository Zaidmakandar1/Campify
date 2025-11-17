-- FACULTY FEEDBACK STATUS MANAGEMENT
-- Add status field to feedback table and grant faculty permissions

-- 1. Add status column to feedback table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feedback' AND column_name = 'status') THEN
        ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_process', 'resolved'));
    END IF;
END $$;

-- 2. Add resolved_by and resolved_at columns for tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feedback' AND column_name = 'resolved_by') THEN
        ALTER TABLE feedback ADD COLUMN resolved_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feedback' AND column_name = 'resolved_at') THEN
        ALTER TABLE feedback ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Update existing feedback to have pending status
UPDATE feedback SET status = 'pending' WHERE status IS NULL;

-- 4. Update is_resolved based on status for backward compatibility
UPDATE feedback SET is_resolved = (status = 'resolved');

-- 5. Grant permissions
GRANT ALL ON feedback TO authenticated, anon;

-- 6. Refresh schema
NOTIFY pgrst, 'reload schema';