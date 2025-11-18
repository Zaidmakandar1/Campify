# Faculty Venue Creation Feature - Setup Guide

## ✨ Feature Overview

Faculty members can now add new venues to the system for clubs to book.

**What's Included:**
- ✅ VenueNew.tsx - Create venue page with image upload
- ✅ Updated App.tsx - New route `/venues/new`
- ✅ Updated PublicVenues.tsx - "Add Venue" button for faculty
- ✅ RLS Policy - Faculty-only access control
- ✅ Image upload support
- ✅ Amenities management

---

## 🔧 Setup Instructions

### Step 1: Run the SQL to Enable Faculty Permissions

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste everything from `FACULTY_VENUE_CREATION.sql`
4. Click **Run**

This creates a new RLS policy allowing faculty to insert venues:
```sql
CREATE POLICY "Faculty can create venues"
  ON public.venues FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'faculty'
    )
  );
```

### Step 2: Verify Files Are in Place

Check these files exist:
- ✅ `src/pages/VenueNew.tsx` - Venue creation form
- ✅ `src/App.tsx` - Updated with VenueNew import and route
- ✅ `src/pages/PublicVenues.tsx` - Updated with "Add Venue" button

---

## 🎯 How Faculty Uses It

### Step 1: Navigate to Venues
- Faculty logs in
- Goes to **Hub** → **Campus Venues**
- Clicks **"Add Venue"** button (only visible to faculty)

### Step 2: Fill Out Venue Information
Faculty fills in:
- **Venue Name** (e.g., "Main Auditorium")
- **Description** (purpose, features)
- **Capacity** (number of people)
- **Amenities** (WiFi, Projector, Sound System, etc.)
- **Image** (optional - click to upload venue photo)

### Step 3: Submit
- Click **"Create Venue"**
- Success toast appears
- Redirected back to venues list
- New venue is now available for clubs to book

---

## 📸 Image Upload Details

**Supported:**
- File types: JPG, PNG, GIF, WebP, SVG, BMP
- Max size: 5MB
- Storage: Supabase `event-images` bucket (public)

**Upload Flow:**
1. Click image area to select file
2. File validates (type + size)
3. Uploads to Supabase Storage with unique filename
4. Public URL is retrieved automatically
5. Preview shown before venue creation

---

## 🔐 Security Details

**Who Can Create Venues?**
- Only users with role = 'faculty'
- Verified at database level (RLS policy)
- Also verified at UI level (component checks `userRole`)

**Database Policy:**
```sql
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'faculty'
  )
)
```

**If Non-Faculty Tries:**
- UI shows: "Access Denied - Only faculty members can add venues"
- Database blocks: RLS policy prevents insert
- Double protection ✅

---

## 📋 Venue Data Structure

When created, venues include:

```json
{
  "id": "uuid",
  "name": "Main Auditorium",
  "description": "Large auditorium for conferences",
  "capacity": 500,
  "amenities": ["projector", "sound system", "wifi"],
  "image_url": "https://...",
  "created_at": "2024-11-16T..."
}
```

---

## ✅ Testing Checklist

- [ ] Create faculty test account (sign up as "Faculty/Admin")
- [ ] Confirm "Add Venue" button appears on venues page
- [ ] Upload venue image successfully
- [ ] Add amenities with dropdown
- [ ] Create venue and see in Supabase
- [ ] Verify clubs can see new venue
- [ ] Test that students can't see "Add Venue" button
- [ ] Test that clubs can't see "Add Venue" button

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Add Venue" button doesn't show | Verify your user role is 'faculty' (check profiles table) |
| Image upload fails | Check event-images bucket exists and is public |
| Venue creation fails | Run FACULTY_VENUE_CREATION.sql to enable policy |
| Can't see new venue | Refresh page, check Supabase venues table |
| "Access Denied" error | Only faculty can create venues, user role must be 'faculty' |

---

## 📁 File Changes Summary

### New Files
- `src/pages/VenueNew.tsx` (300 lines)

### Modified Files
- `src/App.tsx` - Added VenueNew import + route
- `src/pages/PublicVenues.tsx` - Added Plus icon import + "Add Venue" button

### SQL Required
- `FACULTY_VENUE_CREATION.sql` - RLS policy

---

## 🚀 Next Steps (Optional)

Future enhancements could include:
- Edit existing venues (only by faculty who created them)
- Delete venues (with cascading delete for bookings)
- Approve/reject venue booking requests
- Venue availability calendar
- Rating system for venues

---

**Status:** ✅ Ready to Use

Faculty can now add venues from the UI without SQL access!
