# Team Registration Setup Guide

## Step-by-Step Setup

### Step 1: Run Database Migrations

You need to run TWO SQL files in your Supabase SQL Editor:

#### 1.1 First, add the event fields (if not already done):
Open `ADD_EVENT_GROUP_FIELDS.sql` and execute it in Supabase SQL Editor.

This adds:
- `total_people` column to events table
- `group_size` column to events table

#### 1.2 Then, add the team registration tables:
Open `ADD_TEAM_REGISTRATION.sql` and execute it in Supabase SQL Editor.

This adds:
- `team_name` and `team_leader_name` columns to event_registrations
- New `team_members` table
- All necessary RLS policies

### Step 2: Create or Edit an Event with Team Requirements

1. Go to your club dashboard
2. Create a new event or edit an existing one
3. **IMPORTANT:** Fill in these fields:
   - **Total People**: e.g., 50
   - **People Per Group**: e.g., 5 (this is the key field!)
   
If `People Per Group` is greater than 1, the team registration dialog will appear.

### Step 3: Test the Registration

1. As a student, navigate to the event
2. You should see:
   - A badge showing "Team Event (X per team)"
   - A blue info box explaining team registration is required
3. Click "Register Now"
4. The team formation dialog should appear
5. Fill in team details and submit

### Troubleshooting

#### Team dialog doesn't appear?

**Check the browser console (F12)** - you should see logs like:
```
Event group_size: 5
Event total_people: 50
Opening team dialog
```

If you see `Event group_size: null`, then:
1. Make sure you ran `ADD_EVENT_GROUP_FIELDS.sql`
2. Edit your event and set the "People Per Group" field
3. The value must be greater than 1

#### Can't see the new fields when creating events?

Make sure you ran `ADD_EVENT_GROUP_FIELDS.sql` in Supabase.

#### Registration fails?

Make sure you ran `ADD_TEAM_REGISTRATION.sql` in Supabase.

### Quick Test Checklist

- [ ] Ran `ADD_EVENT_GROUP_FIELDS.sql` in Supabase
- [ ] Ran `ADD_TEAM_REGISTRATION.sql` in Supabase
- [ ] Created/edited an event with "People Per Group" > 1
- [ ] Can see "Team Event" badge on event detail page
- [ ] Can see blue info box about team registration
- [ ] Team dialog opens when clicking "Register Now"
- [ ] Can add/remove team members
- [ ] Registration succeeds
- [ ] As club owner, can view registrations with team details
- [ ] Can download CSV with all team data

## Features Overview

### For Students:
- See which events require teams
- Fill in team formation during registration
- Provide team member details (name, email, phone)

### For Club Representatives:
- View all registrations with complete team details
- Download CSV with all registration data
- See team names, leaders, and all member information

## Database Schema

### events table (new columns):
- `total_people` - INTEGER
- `group_size` - INTEGER

### event_registrations table (new columns):
- `team_name` - TEXT (optional)
- `team_leader_name` - TEXT

### team_members table (new):
- `id` - UUID (primary key)
- `registration_id` - UUID (foreign key)
- `member_name` - TEXT
- `member_email` - TEXT
- `member_phone` - TEXT
- `position` - INTEGER
