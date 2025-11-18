# Notification System Setup Guide

## Overview
This notification system automatically notifies:
- **Faculty** when students submit new feedback
- **Students** when their feedback status changes (pending → in_process → resolved)

## Setup Instructions

### Step 1: Run the SQL Script
Execute the `NOTIFICATION_SYSTEM.sql` file in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `NOTIFICATION_SYSTEM.sql`
4. Click "Run" to execute

This will create:
- `notifications` table
- Database triggers for automatic notifications
- RLS policies for security
- Helper functions

### Step 2: Verify Installation
The notification system is already integrated into your app:
- ✅ NotificationBell component added to Navbar
- ✅ Real-time subscription for instant notifications
- ✅ Toast notifications for new alerts
- ✅ Mark as read functionality

## How It Works

### For Students:
1. Submit feedback through "The Voice"
2. Receive notifications when faculty updates status:
   - "Pending Review" - Feedback received
   - "In Process" - Faculty is working on it
   - "Resolved" - Issue has been resolved

### For Faculty:
1. Receive notification when new feedback is submitted
2. Click notification to view feedback details
3. Update status using dropdown in feedback card
4. Student automatically receives status update notification

## Features

### Notification Bell
- Shows unread count badge
- Real-time updates (no refresh needed)
- Click to view all notifications
- "Mark all as read" button

### Notification Types
- 🔔 **feedback_new** - New feedback submitted
- 📝 **feedback_status** - Feedback status changed
- 📅 **event** - Event-related notifications (future)
- ℹ️ **general** - General announcements (future)

### Auto-Cleanup
- Read notifications older than 30 days are automatically deleted
- Keeps database clean and performant

## Testing

### Test as Student:
1. Sign in as a student
2. Submit new feedback
3. Wait for faculty to update status
4. Check notification bell for status update

### Test as Faculty:
1. Sign in as faculty
2. Check notification bell for new feedback
3. Click notification to view feedback
4. Update status using dropdown
5. Student will receive notification

## Troubleshooting

### Notifications not appearing?
1. Check if SQL script ran successfully
2. Verify RLS policies are enabled
3. Check browser console for errors
4. Ensure user is signed in

### Real-time not working?
1. Check Supabase Realtime is enabled
2. Verify network connection
3. Check browser console for subscription errors

### Database Issues?
Run this query to check notifications table:
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

## Future Enhancements
- Email notifications
- Push notifications
- Notification preferences
- Event reminders
- Club announcements
