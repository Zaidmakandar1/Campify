-- Database functions for upvote management
-- Run this in your Supabase SQL Editor

-- Function to increment upvotes
CREATE OR REPLACE FUNCTION increment_upvotes(feedback_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.feedback 
  SET upvotes = upvotes + 1 
  WHERE id = feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement upvotes
CREATE OR REPLACE FUNCTION decrement_upvotes(feedback_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.feedback 
  SET upvotes = GREATEST(upvotes - 1, 0)
  WHERE id = feedback_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_upvotes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_upvotes(UUID) TO authenticated;