-- Add status tracking columns to feedback table
-- This enables the notification system to work properly

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'status'
  ) THEN
    ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_process', 'resolved'));
  END IF;
END $$;

-- Add resolved_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE feedback ADD COLUMN resolved_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add resolved_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE feedback ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update existing feedback to have proper status based on is_resolved
UPDATE feedback 
SET status = CASE 
  WHEN is_resolved = true THEN 'resolved'
  ELSE 'pending'
END
WHERE status IS NULL;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Update the is_resolved column when status changes (for backward compatibility)
CREATE OR REPLACE FUNCTION sync_feedback_resolved_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_resolved := (NEW.status = 'resolved');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_sync_feedback_resolved ON feedback;

CREATE TRIGGER trigger_sync_feedback_resolved
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_feedback_resolved_status();

COMMENT ON COLUMN feedback.status IS 'Current status: pending, in_process, or resolved';
COMMENT ON COLUMN feedback.resolved_by IS 'Faculty member who resolved the feedback';
COMMENT ON COLUMN feedback.resolved_at IS 'Timestamp when feedback was resolved';
