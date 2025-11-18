-- COMPLETE NOTIFICATION FIX
-- Run this ENTIRE script to fix all issues
-- This includes: columns, table, triggers, AND RLS policies

-- ============================================
-- PART 1: Add Status Columns
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'status'
  ) THEN
    ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feedback_status_check'
  ) THEN
    ALTER TABLE feedback ADD CONSTRAINT feedback_status_check 
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

UPDATE feedback 
SET status = CASE 
  WHEN is_resolved = true THEN 'resolved'
  ELSE 'pending'
END
WHERE status IS NULL OR status = '';

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- ============================================
-- PART 2: Fix RLS Policies for Feedback
-- ============================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;
DROP POLICY IF EXISTS "Faculty can update feedback" ON feedback;
DROP POLICY IF EXISTS "Faculty can update all feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
DROP POLICY IF EXISTS "Students can update own feedback" ON feedback;
DROP POLICY IF EXISTS "Faculty can view all feedback" ON feedback;

-- Create new policies
CREATE POLICY "Students can update own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Faculty can update all feedback"
  ON feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'faculty'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'faculty'
    )
  );

CREATE POLICY "Faculty can view all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'faculty'
    )
  );

-- ============================================
-- PART 3: Create Notifications Table
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

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
-- PART 4: Create Functions and Triggers
-- ============================================

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

DROP TRIGGER IF EXISTS trigger_notify_faculty_new_feedback ON feedback;
DROP TRIGGER IF EXISTS trigger_notify_student_feedback_status ON feedback;

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
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  status_col_exists BOOLEAN;
  notifications_exists BOOLEAN;
  trigger_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'status'
  ) INTO status_col_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
  ) INTO notifications_exists;
  
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgname LIKE '%notify%';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'feedback' AND policyname LIKE '%Faculty%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Status column exists: %', status_col_exists;
  RAISE NOTICE 'Notifications table exists: %', notifications_exists;
  RAISE NOTICE 'Triggers created: %', trigger_count;
  RAISE NOTICE 'Faculty policies created: %', policy_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next step: Refresh your browser!';
  RAISE NOTICE '========================================';
END $$;
