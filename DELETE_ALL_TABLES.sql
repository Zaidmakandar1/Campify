-- ⚠️ WARNING: This will DELETE ALL your tables and data!
-- Only run this if you want to start completely fresh
-- Make sure you have backups if needed

-- =====================================================
-- DELETE ALL CAMPIFY TABLES AND DATA
-- =====================================================

-- Drop all tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.ai_insights CASCADE;
DROP TABLE IF EXISTS public.club_analytics CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.venue_bookings CASCADE;
DROP TABLE IF EXISTS public.event_reviews CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.feedback_upvotes CASCADE;
DROP TABLE IF EXISTS public.feedback_comments CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.clubs CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.feedback_category CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS increment_upvotes(UUID) CASCADE;
DROP FUNCTION IF EXISTS decrement_upvotes(UUID) CASCADE;

-- Drop triggers (they should be dropped with the functions, but just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;

-- Verify deletion
SELECT 'All tables deleted successfully!' as message;

-- Show remaining tables (should only show system tables)
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;