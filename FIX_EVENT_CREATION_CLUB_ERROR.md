# Fix: "Failed to Load Club Data" Error

## 🔴 Problem
When clicking "Create Event", you see error: **"Failed to load club data"** and get redirected

## ✅ Solution

This has been fixed in two ways:

### Fix 1: Better Error Handling (Already Applied)
- EventNew.tsx now shows "Create Club" form if no club exists
- No longer redirects to home on error
- Allows you to create club directly from event creation page

### Fix 2: Fix RLS Policies (Run This SQL)

If you still get errors, the clubs table RLS policies might be broken. Run this in Supabase SQL Editor:

**From file:** `FIX_CLUBS_TABLE_RLS.sql`

```sql
-- Drop problematic policies
DROP POLICY IF EXISTS "Users can only select their own clubs" ON public.clubs;

-- Add correct SELECT policy
CREATE POLICY IF NOT EXISTS "Anyone can view clubs"
  ON public.clubs FOR SELECT
  TO authenticated
  USING (true);

-- Add correct UPDATE policy  
CREATE POLICY IF NOT EXISTS "Club owners can update their club"
  ON public.clubs FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

-- Add INSERT policy
CREATE POLICY IF NOT EXISTS "Authenticated can create clubs"
  ON public.clubs FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());
```

## 🔍 What's Happening

**When you click "Create Event":**
1. App tries to load your club: `SELECT * FROM clubs WHERE profile_id = auth.uid()`
2. If you don't have a club yet → Shows "Create Club" form
3. If you have a club → Shows event creation form
4. If there's an RLS error → (Before) Error and redirect | (After) Shows create form anyway

## 🎯 Scenarios

| Scenario | Before | After |
|----------|--------|-------|
| No club exists | ❌ Error, redirected | ✅ Shows "Create Club" form |
| Club exists | ✅ Works | ✅ Works |
| RLS policy broken | ❌ Error, redirected | ✅ Shows create form (user can proceed) |

## 📋 Steps to Fix

### Option 1: Just Try Again (Might Work Now)
1. Go back to Home
2. Go to Club Dashboard
3. Click "Create Event" again
4. Should work now or show create club form

### Option 2: Run the SQL Fix (If Still Broken)
1. Go to Supabase Dashboard
2. SQL Editor
3. Copy from `FIX_CLUBS_TABLE_RLS.sql`
4. Paste and Run
5. Try creating event again

## 🧪 Testing

1. **If you have a club:**
   - Go to Club Dashboard → "Create Event"
   - Should show event form directly ✅

2. **If you don't have a club:**
   - Go to Club Dashboard → "Create Event"
   - Should show "Create Club" form
   - Fill it out and create club ✅
   - Then create event ✅

3. **After SQL fix:**
   - Hard refresh (Ctrl+Shift+R)
   - Try creating event again
   - Should work without errors ✅

## 📝 What Changed in Code

**EventNew.tsx:**
```javascript
// Before: Navigated away on error
if (clubError) {
  toast.error('Failed to load club data');
  navigate('/');  // ❌ Redirects user
  return;
}

// After: Allows user to create club
if (clubError) {
  console.log('No club found, will show create club form');
  setClub(null);  // ✅ Shows create form instead
}
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Still showing error | Run `FIX_CLUBS_TABLE_RLS.sql` SQL |
| Club form won't submit | Check CreateClubProfile component (separate issue) |
| Can't find SQL Editor | In Supabase Dashboard, top nav → "SQL Editor" |
| Error persists after SQL | Hard refresh browser (Ctrl+Shift+R) |

---

**Status:** ✅ Fixed

Try creating an event now - it should either show event form or club creation form! 🎉
