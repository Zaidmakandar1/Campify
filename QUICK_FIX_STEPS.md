# 🚀 STEP-BY-STEP: Fix "Unable to Load Club Data" Error

## ⚡ Quick Start (Do This First)

### Step 1: Run the Quick Fix in Supabase
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New Query"** (top button)
5. Open the file `QUICK_FIX_CLUBS_RLS.sql` from your project
6. Copy ALL the code from that file
7. Paste it into the SQL Editor
8. Click **"Execute"** (green button)
9. Wait for success message

### Step 2: Test in Your App
1. Press **Ctrl+Shift+R** in browser (hard refresh)
2. Log out (if logged in)
3. Log back in
4. Click on "Create Event"
5. If it works → ✅ Done!
6. If error → Go to **Debugging Section** below

---

## 🔍 If It Still Doesn't Work

### Check the Console
1. Open browser: **F12** or **Right-click** → **Inspect**
2. Go to **Console** tab
3. Look for blue text starting with "🔍 EventNew:"
4. Look for red text starting with "❌"
5. **Copy the error message**

### Example Errors and Fixes

**Error: "relation 'public.clubs' does not exist"**
- Cause: Database migration not run
- Fix: Run all migrations in Supabase SQL Editor first

**Error: "permission denied for schema public"**
- Cause: RLS policy issue
- Fix: Run `QUICK_FIX_CLUBS_RLS.sql` again

**Error: Session error / Session expired**
- Cause: Auth session timeout
- Fix: Log out → Clear browser cache → Log in again

**No error, just shows "Create Club Profile"**
- Cause: User doesn't have a club yet
- Fix: This is NORMAL! Fill in club form and create club

---

## 🛠️ Advanced Debugging

### Option A: Run SQL Diagnosis
1. Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Paste and run this:

```sql
-- Check if clubs table has data
SELECT COUNT(*) as total_clubs FROM public.clubs;

-- Check your user ID from auth
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com' LIMIT 1;

-- Check if you have a club
-- (Replace YOUR_USER_ID with the id from above)
SELECT id, profile_id, name FROM public.clubs 
WHERE profile_id = 'YOUR_USER_ID';
```

### Option B: Enable Debug Component
1. Open `src/pages/EventNew.tsx`
2. Find this line near the top:
   ```tsx
   import { useAuth } from '@/contexts/AuthContext';
   ```
3. Add below it:
   ```tsx
   import { DebugEventNew } from '@/components/DebugEventNew';
   ```
4. Scroll to the bottom return statement
5. Find `</div>` at the very end
6. Add this BEFORE the `</div>`:
   ```tsx
   <DebugEventNew />
   ```
7. Save and look for black debug box in bottom-right corner
8. Take a screenshot of the debug info

---

## 📝 What to Report to Developer

If none of the above works, provide:

1. **Console Error:**
   - Open DevTools (F12)
   - Console tab
   - Copy the red error text

2. **SQL Results:**
   - Run the SQL queries from "Advanced Debugging"
   - Copy the results

3. **Debug Screenshot:**
   - If debug component enabled
   - Screenshot the black box in bottom-right

4. **Your Email:**
   - The email you're logged in with

---

## ✅ Verification Checklist

After running the quick fix:

- [ ] Ran `QUICK_FIX_CLUBS_RLS.sql` in Supabase
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Logged out and logged back in
- [ ] Navigated to Create Event page
- [ ] No error shown
- [ ] Can see either:
  - [ ] "Create Club Profile" form (if no club), OR
  - [ ] Event creation form (if club exists)

---

## 🆘 Emergency Reset

If nothing works, run this in Supabase SQL Editor:

```sql
-- WARNING: This will require recreating policies
-- USE ONLY IF NOTHING ELSE WORKS

-- 1. Disable RLS temporarily
ALTER TABLE public.clubs DISABLE ROW LEVEL SECURITY;

-- 2. Try accessing the page
-- 3. Then re-enable with:
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- 4. Then run QUICK_FIX_CLUBS_RLS.sql again
```

---

## 📞 Need More Help?

1. Check `EVENT_NEW_TROUBLESHOOTING.md` for detailed guide
2. Check `DEBUG_CLUB_QUERY.sql` for diagnostic queries
3. Share console error + SQL results with development team
