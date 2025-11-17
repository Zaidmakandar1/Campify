# Event Group Size Feature

## Changes Made

### 1. Frontend Form (src/pages/EventNew.tsx)
Added two new input fields to the event creation form:
- **Total People**: Number input for total expected attendees (1-10,000)
- **People Per Group**: Number input for group size (1-100)

Both fields are required and placed in a grid layout after the "Maximum Registrations" field.

### 2. Database Schema (ADD_EVENT_GROUP_FIELDS.sql)
Created SQL migration to add two new columns to the `events` table:
- `total_people` (INTEGER)
- `group_size` (INTEGER)

### 3. Form Submission
Updated the event creation logic to capture and save both fields to the database.

## Setup Instructions

1. Run the SQL migration in Supabase SQL Editor:
   ```bash
   # Open ADD_EVENT_GROUP_FIELDS.sql and execute it in Supabase
   ```

2. The frontend changes are already applied and ready to use.

## Usage

When creating an event, users will now be prompted to enter:
- How many total people are expected
- How many people should be in each group

This is useful for team-based events, workshops, or activities that require group organization.
