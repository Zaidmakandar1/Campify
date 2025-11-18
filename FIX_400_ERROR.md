# Fix 400 Error - Notification System Setup

## Problem
Getting 400 error when updating feedback status because the `status` column doesn't exist in the feedback table.

## Solution
Run the `QUICK_NOTIFICATION_SETUP.sql` script in Supabase.

## Steps:

### 1. Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project

### 2. Open SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 3. Run the Setup Script
- Copy the entire contents of `QUICK_NOTIFICATION_SETUP.sql`
- Paste into the SQL Editor
- Click "Run" button

### 4. Verify Success
You should see a message like:
```
=== NOTIFICATION SYSTEM SETUP COMPLETE ===
Status column exists: true
Notifications table exists: true
Triggers created: 2
==========================================
```

### 5. Test the System

#### Test as Student:
1. Refresh your browser
2. Go to "The Voice"
3. Submit new feedback
4. Faculty should receive notification

#### Test as Faculty:
1. Sign in as faculty
2. Check notification bell (should show badge)
3. Click notification to view feedback
4. Update status using dropdown
5. Student should receive notification

## What This Script Does:

✅ Adds `status` column to feedback table (pending/in_process/resolved)
✅ Adds `resolved_by` column (tracks who resolved it)
✅ Adds `resolved_at` column (timestamp)
✅ Creates `notifications` table
✅ Sets up RLS policies for security
✅ Creates automatic triggers for notifications
✅ Adds helper functions

## Troubleshooting:

### Still getting 400 error?
1. Check if script ran successfully (look for success message)
2. Refresh your browser (Ctrl+Shift+R)
3. Check browser console for errors

### Notifications not appearing?
1. Make sure you're signed in
2. Check if Supabase Realtime is enabled
3. Try submitting new feedback to test

### Need to reset?
Run this to check current state:
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feedback' 
AND column_name IN ('status', 'resolved_by', 'resolved_at');

-- Check notifications table
SELECT COUNT(*) as notification_count FROM notifications;

-- Check triggers
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%notify%';
```

## Files Reference:
- `QUICK_NOTIFICATION_SETUP.sql` - Complete setup (USE THIS ONE)
- `NOTIFICATION_SYSTEM.sql` - Detailed version with comments
- `ADD_FEEDBACK_STATUS_COLUMNS.sql` - Just the column additions
