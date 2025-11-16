-- Manual role update for specific users
-- Replace 'user-email@example.com' with the actual email
-- Replace 'club' with the desired role ('student', 'faculty', 'club')

UPDATE public.profiles 
SET role = 'club'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'user-email@example.com'
);

-- Or if you know the user ID directly:
-- UPDATE public.profiles SET role = 'club' WHERE id = 'user-uuid-here';

-- To check all users and their roles:
SELECT 
  u.email,
  p.full_name,
  p.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;