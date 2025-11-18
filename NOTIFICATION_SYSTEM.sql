-- Notification System for Campify
-- This creates a notifications table and triggers for feedback status changes

-- STEP 1: Add status columns to feedback table (if not exists)
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

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE feedback ADD COLUMN resolved_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE feedback ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update existing feedback to have proper status
UPDATE feedback 
SET status = CASE 
  WHEN is_resolved = true THEN 'resolved'
  ELSE 'pending'
END
WHERE status IS NULL;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- STEP 2: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feedback_new', 'feedback_status', 'event', 'general')),
  related_id UUID, -- ID of related feedback, event, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
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

-- Function to create notification for feedback submission
CREATE OR REPLACE FUNCTION notify_faculty_new_feedback()
RETURNS TRIGGER AS $$
DECLARE
  faculty_user RECORD;
BEGIN
  -- Notify all faculty members about new feedback
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

-- Function to notify student when feedback status changes
CREATE OR REPLACE FUNCTION notify_student_feedback_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify the student who created the feedback
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_notify_faculty_new_feedback ON feedback;
DROP TRIGGER IF EXISTS trigger_notify_student_feedback_status ON feedback;

-- Create trigger for new feedback submissions
CREATE TRIGGER trigger_notify_faculty_new_feedback
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_faculty_new_feedback();

-- Create trigger for feedback status changes
CREATE TRIGGER trigger_notify_student_feedback_status
  AFTER UPDATE ON feedback
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_student_feedback_status();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old read notifications (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
  DELETE FROM notifications
  WHERE is_read = TRUE 
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notifications IS 'Stores user notifications for feedback status updates and other events';
COMMENT ON FUNCTION notify_faculty_new_feedback() IS 'Automatically notifies faculty when new feedback is submitted';
COMMENT ON FUNCTION notify_student_feedback_status() IS 'Automatically notifies students when their feedback status changes';
