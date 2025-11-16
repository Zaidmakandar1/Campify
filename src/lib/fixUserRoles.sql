-- Fix user roles and database trigger
-- Run this in your Supabase SQL Editor

-- First, let's recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    role = COALESCE((NEW.raw_user_meta_data->>'role')::app_role, profiles.role);
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to manually fix existing users (run this once)
CREATE OR REPLACE FUNCTION fix_existing_user_roles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'full_name', 'User'),
      COALESCE((user_record.raw_user_meta_data->>'role')::app_role, 'student')
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the fix function
SELECT fix_existing_user_roles();

-- Clean up the temporary function
DROP FUNCTION fix_existing_user_roles();