# Faculty Venue Editing - Complete Setup

## ✨ What's New

Faculty can now:
- ✅ **Edit venues** - Update name, description, capacity, image, amenities
- ✅ **Delete venues** - With confirmation dialog
- ✅ **Replace images** - Old image automatically deleted from storage
- ✅ **Manage amenities** - Add/remove amenity tags

---

## 🔧 Setup (2 Steps)

### Step 1: Add RLS Policies

Run this SQL in **Supabase SQL Editor**:

Copy everything from `FACULTY_VENUE_EDIT_DELETE.sql` and paste it.

This creates:
```sql
-- Allow faculty to UPDATE any venue
CREATE POLICY "Faculty can update venues" ON public.venues FOR UPDATE ...

-- Allow faculty to DELETE any venue
CREATE POLICY "Faculty can delete venues" ON public.venues FOR DELETE ...
```

### Step 2: That's It! 
Files are already in place:
- ✅ `src/pages/VenueEdit.tsx` - Edit/delete form
- ✅ `src/App.tsx` - Route at `/venues/:id/edit`
- ✅ `src/components/VenueCard.tsx` - Edit button for faculty
- ✅ `src/pages/PublicVenues.tsx` - Shows edit button to faculty

---

## 🎯 How Faculty Uses It

### Edit a Venue

1. Go to **Hub → Campus Venues**
2. Faculty sees **"Edit Venue"** button on each card
3. Click it
4. Update fields:
   - Venue name, description, capacity
   - Change image (old one auto-deletes)
   - Add/remove amenities
5. Click **"Save Changes"**
6. Venue updated instantly ✅

### Delete a Venue

1. While editing, click **"Delete"** button
2. Confirmation dialog appears
3. Click **"Yes, Delete Venue"**
4. Venue deleted with image cleanup ✅

---

## 📋 Features

**Edit Form**
- Pre-filled with current venue data
- Image upload with preview & replace
- Amenity tag management
- Form validation
- Loading states

**Delete**
- Confirmation dialog to prevent accidents
- Cascading delete (deletes image from storage)
- Success/error notifications

**Image Handling**
- Detects old image URL
- Deletes old file from Supabase Storage
- Uploads new image
- Gets public URL automatically

---

## 🔐 Security

**Who can edit venues?**
- Only users with role = 'faculty'
- Verified at database level (RLS policy)
- Verified at UI level (component check)
- Can edit **any** venue (admin power)

**Database Policies:**
```sql
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'faculty'
  )
)
```

---

## 📁 Files Modified

**New Files:**
- `src/pages/VenueEdit.tsx` (350 lines) - Complete edit/delete page

**Updated Files:**
- `src/App.tsx` - Added VenueEdit import + route `/venues/:id/edit`
- `src/components/VenueCard.tsx` - Added Edit button for faculty + Edit icon import
- `src/pages/PublicVenues.tsx` - Pass `canEdit` prop to VenueCard

**SQL Required:**
- `FACULTY_VENUE_EDIT_DELETE.sql` - UPDATE & DELETE policies

---

## ✅ Testing Checklist

- [ ] Run SQL from FACULTY_VENUE_EDIT_DELETE.sql
- [ ] Create test venue as faculty
- [ ] Go to venues page
- [ ] See "Edit Venue" button (faculty only)
- [ ] Click edit button
- [ ] Change venue name and save
- [ ] Verify change appears on venues list
- [ ] Upload new image to venue
- [ ] Old image deleted from storage ✅
- [ ] New image appears on card
- [ ] Add amenities and save
- [ ] Delete a venue with confirmation
- [ ] Verify deleted (gone from DB and venues list)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Edit Venue" button doesn't show | Verify user role is 'faculty' |
| Can't save changes | Run FACULTY_VENUE_EDIT_DELETE.sql to enable UPDATE policy |
| Can't delete venue | Run FACULTY_VENUE_EDIT_DELETE.sql to enable DELETE policy |
| Old image not deleted | Check event-images bucket permissions |
| Changes don't appear | Hard refresh (Ctrl+Shift+R) |

---

## 🚀 What's Happening Under the Hood

```
Faculty clicks "Edit Venue"
    ↓
Navigate to /venues/:id/edit
    ↓
Load venue data from database
    ↓
Faculty edits form
    ↓
Click "Save Changes"
    ↓
Upload new image (if changed)
    ↓
Delete old image file
    ↓
Update venue in database via UPDATE RLS policy
    ↓
Success notification
    ↓
Redirect to venues list
```

---

**Status:** ✅ Ready to Use

Faculty can now edit and delete venues from the UI! 🎉
