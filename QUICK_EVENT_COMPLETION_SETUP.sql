-- ============================================
-- QUICK EVENT COMPLETION SETUP
-- ============================================
-- Run this single script to set up the complete event completion & feedback system
-- This is a consolidated version for easy deployment

-- STEP 1: Create event_feedback table
CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
  usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
  would_attend_again BOOLEAN,
  feedback_text TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- STEP 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_created_at ON event_feedback(created_at DESC);

-- STEP 3: Enable RLS and create policies
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view event feedback" ON event_feedback;
CREATE POLICY "Anyone can view event feedback"
  ON event_feedback FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own event feedback" ON event_feedback;
CREATE POLICY "Users can create their own event feedback"
  ON event_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own event feedback" ON event_feedback;
CREATE POLICY "Users can update their own event feedback"
  ON event_feedback FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own event feedback" ON event_feedback;
CREATE POLICY "Users can delete their own event feedback"
  ON event_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- STEP 4: Create notification function for event completion
CREATE OR REPLACE FUNCTION notify_event_completion()
RETURNS TRIGGER AS $$
DECLARE
  registration RECORD;
  notification_count INTEGER := 0;
BEGIN
  IF OLD.is_completed = FALSE AND NEW.is_completed = TRUE THEN
    FOR registration IN 
      SELECT DISTINCT user_id 
      FROM event_registrations 
      WHERE event_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, related_id)
      VALUES (
        registration.user_id,
        'Event Completed! 🎉',
        'The event "' || NEW.title || '" has been completed. Share your feedback to help us improve!',
        'event',
        NEW.id
      );
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Sent % completion notifications for event: %', notification_count, NEW.title;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_event_completion: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Create trigger for event completion
DROP TRIGGER IF EXISTS trigger_notify_event_completion ON events;
CREATE TRIGGER trigger_notify_event_completion
  AFTER UPDATE ON events
  FOR EACH ROW
  WHEN (OLD.is_completed IS DISTINCT FROM NEW.is_completed)
  EXECUTE FUNCTION notify_event_completion();

-- STEP 6: Create notification function for feedback submission
CREATE OR REPLACE FUNCTION notify_event_feedback_submitted()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
BEGIN
  SELECT e.title, e.club_id, c.profile_id
  INTO event_record
  FROM events e
  LEFT JOIN clubs c ON c.id = e.club_id
  WHERE e.id = NEW.event_id;
  
  IF event_record.profile_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      event_record.profile_id,
      'New Event Feedback Received',
      'Someone submitted feedback for your event "' || event_record.title || '"',
      'event',
      NEW.event_id
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_event_feedback_submitted: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: Create trigger for feedback submission
DROP TRIGGER IF EXISTS trigger_notify_event_feedback_submitted ON event_feedback;
CREATE TRIGGER trigger_notify_event_feedback_submitted
  AFTER INSERT ON event_feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_feedback_submitted();

-- STEP 8: Verify setup
DO $$
DECLARE
  trigger_count INTEGER;
  table_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgname IN ('trigger_notify_event_completion', 'trigger_notify_event_feedback_submitted');
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'event_feedback'
  ) INTO table_exists;
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'event_feedback';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EVENT COMPLETION SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Triggers created: %', trigger_count;
  RAISE NOTICE 'Event feedback table exists: %', table_exists;
  RAISE NOTICE 'RLS policies created: %', policy_count;
  RAISE NOTICE '========================================';
  
  IF trigger_count = 2 AND table_exists AND policy_count >= 4 THEN
    RAISE NOTICE '✓ Setup successful! All components ready.';
  ELSE
    RAISE WARNING '⚠ Setup incomplete. Please check the logs.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- Add helpful comments
COMMENT ON TABLE event_feedback IS 'Stores user feedback for completed events';
COMMENT ON FUNCTION notify_event_completion() IS 'Notifies all registered users when an event is marked as completed';
COMMENT ON FUNCTION notify_event_feedback_submitted() IS 'Notifies club owners when feedback is submitted for their event';
