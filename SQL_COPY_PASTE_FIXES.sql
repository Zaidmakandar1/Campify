# 🔧 Copy-Paste SQL Fixes

## Issue: Image Upload Shows Success But URL is Null

### Fix 1: Create Storage Policies (MOST COMMON FIX)

**Go to:** Supabase Dashboard → SQL Editor → New Query

**Copy and paste THIS ENTIRE BLOCK:**

```sql
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete event images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Clubs can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Clubs can delete their event images" ON storage.objects;

-- Create working policies
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Authenticated can delete event images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');
```

**Click:** Execute

**Expected result:** `Query executed successfully`

---

### Fix 2: Ensure Events Table Has Update Policy

**Go to:** SQL Editor → New Query

**Copy and paste:**

```sql
-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Clubs can update their events" ON public.events;
DROP POLICY IF EXISTS "Clubs can manage their events" ON public.events;

-- Create policy allowing club owners to update their events
CREATE POLICY "Clubs can update their events"
ON public.events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE clubs.id = events.club_id
    AND clubs.profile_id = auth.uid()
  )
);

-- Also ensure they can insert
CREATE POLICY "Clubs can insert events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clubs
    WHERE clubs.id = events.club_id
    AND clubs.profile_id = auth.uid()
  )
);
```

**Click:** Execute

**Expected result:** `Query executed successfully`

---

### Fix 3: Verify Storage Bucket Settings

**Go to:** SQL Editor → New Query

**Copy and paste:**

```sql
-- Check if bucket exists and is public
SELECT id, name, public FROM storage.buckets WHERE name = 'event-images';
```

**Click:** Execute

**Expected result:** 
```
id              | name          | public
event-images    | event-images  | true
```

**If `public` is `false`:**
- Your bucket is private
- Need to make it public
- Go to Storage → event-images → Settings → Toggle "Public bucket" ON

---

### Fix 4: Check Events Table Has image_url Column

**Go to:** SQL Editor → New Query

**Copy and paste:**

```sql
-- Check if image_url column exists in events table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;
```

**Click:** Execute

**Look for:**
```
column_name  | data_type
...
image_url    | text
...
```

**If you DON'T see `image_url` in the list:**
- Run this to add it:

```sql
ALTER TABLE public.events ADD COLUMN image_url TEXT;
```

---

### Fix 5: Quick Debug - Check Your Event

**Go to:** SQL Editor → New Query

**Replace `'YOUR-EVENT-ID'` with actual event ID from URL:**

```sql
-- Check your specific event
SELECT id, title, image_url, club_id FROM public.events 
WHERE id = 'YOUR-EVENT-ID' 
LIMIT 1;
```

**Example:**
```sql
SELECT id, title, image_url, club_id FROM public.events 
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 
LIMIT 1;
```

**Click:** Execute

**Look for:**
- `image_url` should NOT be `null`
- Should show: `https://...supabase.co/storage/v1/object/public/event-images/...`

---

### Fix 6: Check Storage Upload Worked

**Go to:** SQL Editor → New Query

**Copy and paste:**

```sql
-- List all files in event-images bucket
SELECT name, owner FROM storage.objects 
WHERE bucket_id = 'event-images' 
ORDER BY created_at DESC 
LIMIT 20;
```

**Click:** Execute

**Expected result:** See list of image files like:
```
name                          | owner
a1b2c3d4-e5f6-7890.jpg       | user123
1234567890.png               | user123
...
```

**If you see files:**
- ✅ Upload is working
- Issue is saving URL to database

**If you see NO files:**
- ❌ Upload is not working
- Check storage policies
- Check bucket permissions

---

## All-In-One Fix (Run ALL of these in order)

**If nothing is working, run these 3 SQL blocks in order:**

### Block 1 - Storage Policies:
```sql
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete event images" ON storage.objects;

CREATE POLICY "Public can view event images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'event-images');
CREATE POLICY "Authenticated can upload event images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-images');
CREATE POLICY "Authenticated can delete event images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event-images');
```

### Block 2 - Events Table Policies:
```sql
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clubs can update their events" ON public.events;
DROP POLICY IF EXISTS "Clubs can insert events" ON public.events;

CREATE POLICY "Clubs can update their events" ON public.events FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id = events.club_id AND clubs.profile_id = auth.uid()));

CREATE POLICY "Clubs can insert events" ON public.events FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.clubs WHERE clubs.id = events.club_id AND clubs.profile_id = auth.uid()));
```

### Block 3 - Add Column If Missing:
```sql
-- This is safe - only adds if doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

---

## Verification After Running SQL

Run this to verify everything is set up:

```sql
-- Check storage bucket
SELECT 'Bucket' as check_item, id as detail FROM storage.buckets WHERE name = 'event-images'
UNION ALL
-- Check storage policies
SELECT 'Storage Policy', policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%event%'
UNION ALL
-- Check events table policies
SELECT 'Events Policy', policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events'
UNION ALL
-- Check image_url column
SELECT 'Image URL Column', column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url';
```

**Should see results for:**
- ✅ Bucket
- ✅ Storage Policy (at least 1)
- ✅ Events Policy (at least 1)
- ✅ Image URL Column

---

## After Running SQL

1. **Close and reopen browser**
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Try uploading image again**
4. **Check DevTools Console** for logs
5. **Check database** - image_url should show URL

---

## Questions?

If still not working:
1. Run the verification query above
2. Share what you see
3. Or run individual Fix blocks 1-6 and tell me which one shows error

I'm here to help! 🚀
