-- QUICK NOTIFICATION SETUP
-- Run this single script to set up the complete notification system
-- This includes: status columns, notifications table, triggers, and RLS policies

-- ============================================
-- PART 1: Add Status Columns to Feedback Table
-- ============================================

-- Add status column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'status'
  ) THEN
    ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feedback_status_check'
  ) THEN
    ALTER TABLE feedback ADD CONSTRAINT feedback_status_check 
    CHECK (status IN ('pending', 'in_process', 'resolved'));
  END IF;
END $$;

-- Add resolved_by column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE feedback ADD COLUMN resolved_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add resolved_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE feedback ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update existing feedback
UPDATE feedback 
SET status = CASE 
  WHEN is_resolved = true THEN 'resolved'
  ELSE 'pending'
END
WHERE status IS NULL OR status = '';

-- Create index
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- ============================================
-- PART 2: Create Notifications Table
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feedback_new', 'feedback_status', 'event', 'general')),
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- PART 3: Enable RLS and Create Policies
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 4: Create Notification Functions
-- ============================================

-- Function to notify faculty of new feedback
CREATE OR REPLACE FUNCTION notify_faculty_new_feedback()
RETURNS TRIGGER AS $$
DECLARE
  faculty_user RECORD;
BEGIN
  FOR faculty_user IN 
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'faculty'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      faculty_user.id,
      'New Feedback Submitted',
      'A new feedback "' || NEW.title || '" has been submitted in ' || NEW.category || ' category.',
      'feedback_new',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify student of status change
CREATE OR REPLACE FUNCTION notify_student_feedback_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      'Feedback Status Updated',
      'Your feedback "' || NEW.title || '" status has been updated to: ' || 
      CASE NEW.status
        WHEN 'pending' THEN 'Pending Review'
        WHEN 'in_process' THEN 'In Process'
        WHEN 'resolved' THEN 'Resolved'
        ELSE NEW.status
      END,
      'feedback_status',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: Create Triggers
-- ============================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_notify_faculty_new_feedback ON feedback;
DROP TRIGGER IF EXISTS trigger_notify_student_feedback_status ON feedback;

-- Create triggers
CREATE TRIGGER trigger_notify_faculty_new_feedback
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_faculty_new_feedback();

CREATE TRIGGER trigger_notify_student_feedback_status
  AFTER UPDATE ON feedback
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_student_feedback_status();

-- ============================================
-- PART 6: Helper Functions
-- ============================================

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
  DELETE FROM notifications
  WHERE is_read = TRUE 
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if everything is set up correctly
DO $$
DECLARE
  status_col_exists BOOLEAN;
  notifications_table_exists BOOLEAN;
  trigger_count INTEGER;
BEGIN
  -- Check status column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'status'
  ) INTO status_col_exists;
  
  -- Check notifications table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
  ) INTO notifications_table_exists;
  
  -- Check triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgname LIKE '%notify%';
  
  -- Report results
  RAISE NOTICE '=== NOTIFICATION SYSTEM SETUP COMPLETE ===';
  RAISE NOTICE 'Status column exists: %', status_col_exists;
  RAISE NOTICE 'Notifications table exists: %', notifications_table_exists;
  RAISE NOTICE 'Triggers created: %', trigger_count;
  RAISE NOTICE '==========================================';
END $$;
