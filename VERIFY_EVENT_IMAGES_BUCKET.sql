-- Verify event-images bucket and storage policies are correct
-- Run this in Supabase SQL Editor

-- Step 1: Check if bucket exists and is public
SELECT id, name, public FROM storage.buckets WHERE name = 'event-images';

-- Step 2: Check storage policies for event-images
SELECT 
  policyname, 
  definition,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND definition LIKE '%event-images%'
ORDER BY policyname;

-- Step 3: If policies are missing, create them
-- Run these if Step 2 shows no results:

-- Allow public to view images
CREATE POLICY IF NOT EXISTS "Public can view event images" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'event-images');

-- Allow authenticated to upload
CREATE POLICY IF NOT EXISTS "Authenticated can upload event images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'event-images');

-- Allow authenticated to delete
CREATE POLICY IF NOT EXISTS "Authenticated can delete event images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'event-images');

-- Step 4: Verify policies were created
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND definition LIKE '%event-images%';
