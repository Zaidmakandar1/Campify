# Team Registration Feature

## Overview
Added team formation during event registration and a registration management system for club representatives.

## Changes Made

### 1. Database Schema (ADD_TEAM_REGISTRATION.sql)
- Added `team_name` and `team_leader_name` columns to `event_registrations` table
- Created new `team_members` table to store individual team member details (name, email, phone)
- Added RLS policies for secure access
- Club owners can now view all registrations for their events

### 2. Event Registration with Teams (src/pages/EventDetail.tsx)
- When registering for an event with `group_size > 1`, users see a team formation dialog
- Team registration form includes:
  - Team name (optional)
  - Team leader name (required)
  - Team member details (name, email, phone) - dynamically based on group_size
- Simple registration (no team) for events without group requirements
- Add/remove team members dynamically

### 3. Registration Management Page (src/pages/EventRegistrations.tsx)
- New page for club owners to view all event registrations
- Displays:
  - Registration date and user info
  - Team name and leader
  - All team member details
- Download registrations as CSV with all details
- Accessible via "View Registrations" button on event detail page (club owners only)

### 4. Routing (src/App.tsx)
- Added route: `/club/events/:id/registrations` (club role only)

## Setup Instructions

1. Run the SQL migration in Supabase SQL Editor:
   ```
   Execute ADD_TEAM_REGISTRATION.sql
   ```

2. The frontend changes are already applied.

## Usage

### For Students:
1. Navigate to an event
2. Click "Register Now"
3. If event requires teams, fill in team formation dialog:
   - Enter team name (optional)
   - Enter team leader name
   - Fill in all team member details
4. Submit registration

### For Club Representatives:
1. Navigate to your event
2. Click "View Registrations" button
3. See all registrations with team details
4. Download CSV for offline use/analysis

## Features
- Dynamic team size based on event configuration
- Email and phone collection for team members
- CSV export with all registration data
- Secure access control (only club owners can view registrations)
- Clean, organized display of team information
