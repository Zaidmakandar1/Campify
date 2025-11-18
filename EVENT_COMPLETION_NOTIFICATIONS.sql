-- Event Completion Notification System
-- Notifies all registered users when an event is marked as completed

-- Function to notify registered users when event is completed
CREATE OR REPLACE FUNCTION notify_event_completion()
RETURNS TRIGGER AS $$
DECLARE
  registration RECORD;
BEGIN
  -- Only notify if event was just marked as completed
  IF OLD.is_completed = FALSE AND NEW.is_completed = TRUE THEN
    -- Notify all registered users
    FOR registration IN 
      SELECT user_id FROM event_registrations 
      WHERE event_id = NEW.id
    LOOP
      INSERT INTO notifications (user_id, title, message, type, related_id)
      VALUES (
        registration.user_id,
        'Event Completed',
        'The event "' || NEW.title || '" has been completed. Share your feedback!',
        'event',
        NEW.id
      );
    END LOOP;
    
    RAISE NOTICE 'Sent completion notifications for event: %', NEW.title;
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

-- Verify trigger was created
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'trigger_notify_event_completion';

COMMENT ON FUNCTION notify_event_completion() IS 'Notifies all registered users when an event is marked as completed';
