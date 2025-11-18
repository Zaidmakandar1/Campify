-- ============================================
-- EVENT COMPLETION NOTIFICATION & FEEDBACK SYSTEM
-- ============================================
-- This script implements:
-- 1. Notifications when events are marked complete
-- 2. Event feedback tracking
-- 3. User profile integration for completed events

-- STEP 1: Ensure event_feedback table exists with proper structure
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_created_at ON event_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_feedback
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

-- STEP 2: Function to notify registered users when event is completed
CREATE OR REPLACE FUNCTION notify_event_completion()
RETURNS TRIGGER AS $$
DECLARE
  registration RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Only notify if event was just marked as completed
  IF OLD.is_completed = FALSE AND NEW.is_completed = TRUE THEN
    -- Notify all registered users
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_event_completion ON events;

-- Create trigger for event completion
CREATE TRIGGER trigger_notify_event_completion
  AFTER UPDATE ON events
  FOR EACH ROW
  WHEN (OLD.is_completed IS DISTINCT FROM NEW.is_completed)
  EXECUTE FUNCTION notify_event_completion();

-- STEP 3: Function to notify when user submits event feedback
CREATE OR REPLACE FUNCTION notify_event_feedback_submitted()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
  club_profile_id UUID;
BEGIN
  -- Get event details and club owner
  SELECT e.title, e.club_id, c.profile_id
  INTO event_record
  FROM events e
  LEFT JOIN clubs c ON c.id = e.club_id
  WHERE e.id = NEW.event_id;
  
  -- Notify club owner about new feedback
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_event_feedback_submitted ON event_feedback;

-- Create trigger for new event feedback
CREATE TRIGGER trigger_notify_event_feedback_submitted
  AFTER INSERT ON event_feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_feedback_submitted();

-- STEP 4: Add helpful views for querying

-- View for user's completed events with feedback status
CREATE OR REPLACE VIEW user_completed_events AS
SELECT 
  er.user_id,
  er.id as registration_id,
  e.*,
  ef.id as feedback_id,
  ef.rating as feedback_rating,
  ef.created_at as feedback_submitted_at,
  CASE WHEN ef.id IS NOT NULL THEN true ELSE false END as has_given_feedback
FROM event_registrations er
JOIN events e ON e.id = er.event_id
LEFT JOIN event_feedback ef ON ef.event_id = e.id AND ef.user_id = er.user_id
WHERE e.is_completed = true;

-- View for event feedback summary
CREATE OR REPLACE VIEW event_feedback_summary AS
SELECT 
  e.id as event_id,
  e.title as event_title,
  COUNT(ef.id) as total_feedback,
  ROUND(AVG(ef.rating), 2) as avg_rating,
  ROUND(AVG(ef.organization_rating), 2) as avg_organization_rating,
  ROUND(AVG(ef.usefulness_rating), 2) as avg_usefulness_rating,
  COUNT(CASE WHEN ef.would_attend_again = true THEN 1 END) as would_attend_again_count,
  COUNT(CASE WHEN ef.would_attend_again = false THEN 1 END) as would_not_attend_again_count
FROM events e
LEFT JOIN event_feedback ef ON ef.event_id = e.id
WHERE e.is_completed = true
GROUP BY e.id, e.title;

-- STEP 5: Verify setup
DO $$
DECLARE
  trigger_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  -- Check if triggers exist
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgname IN ('trigger_notify_event_completion', 'trigger_notify_event_feedback_submitted');
  
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'event_feedback'
  ) INTO table_exists;
  
  RAISE NOTICE '=== EVENT COMPLETION FEATURE SETUP COMPLETE ===';
  RAISE NOTICE 'Triggers created: %', trigger_count;
  RAISE NOTICE 'Event feedback table exists: %', table_exists;
  RAISE NOTICE '==============================================';
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION notify_event_completion() IS 'Notifies all registered users when an event is marked as completed';
COMMENT ON FUNCTION notify_event_feedback_submitted() IS 'Notifies club owners when feedback is submitted for their event';
COMMENT ON TABLE event_feedback IS 'Stores user feedback for completed events';
COMMENT ON VIEW user_completed_events IS 'Shows completed events for users with their feedback status';
COMMENT ON VIEW event_feedback_summary IS 'Provides aggregated feedback statistics for events';
