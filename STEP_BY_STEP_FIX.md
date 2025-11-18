# Step-by-Step Fix for 400 Error

## The Problem
You're getting a 400 error because the `status` column doesn't exist in your feedback table yet.

## The Solution (Choose One)

### Option 1: Quick Fix (Recommended)
Run the complete setup script:

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor (left sidebar)
3. Click "New Query"
4. Copy ALL contents from `QUICK_NOTIFICATION_SETUP.sql`
5. Paste and click "Run"
6. Wait for success message
7. Refresh your browser (Ctrl+Shift+R)

### Option 2: Diagnose First
If you want to see what's wrong first:

1. Run `DIAGNOSE_FEEDBACK_TABLE.sql` in Supabase SQL Editor
2. Check if `status_column_exists` shows `false`
3. Then run `QUICK_NOTIFICATION_SETUP.sql`

### Option 3: Temporary Workaround
The code now has a fallback that will:
- Try to update with status column
- If it fails, just update is_resolved
- Show a warning message

This lets you continue working, but you should still run the SQL script for full functionality.

## After Running the Script

### Test It Works:
1. Refresh browser
2. Go to Voice page
3. Try changing feedback status
4. Should work without 400 error

### Verify Notifications:
1. Submit new feedback as student
2. Check faculty account for notification
3. Update status as faculty
4. Check student account for notification

## Still Not Working?

### Check Supabase Connection:
```javascript
// In browser console
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

### Check if Script Ran:
Run this in Supabase SQL Editor:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'feedback' AND column_name = 'status';
```

Should return one row with 'status'.

### Check RLS Policies:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'feedback';
```

Should show several policies including update policies.

## Common Issues

### "Column does not exist"
- You didn't run the SQL script yet
- Run `QUICK_NOTIFICATION_SETUP.sql`

### "Permission denied"
- RLS policy issue
- Check if you're signed in as faculty
- Faculty role should be able to update feedback

### "Connection refused"
- Supabase project is paused
- Go to dashboard and restore project

## Need Help?
Check these files:
- `QUICK_NOTIFICATION_SETUP.sql` - The fix
- `DIAGNOSE_FEEDBACK_TABLE.sql` - Check what's wrong
- `FIX_400_ERROR.md` - Detailed explanation
