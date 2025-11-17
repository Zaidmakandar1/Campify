-- Run this in Supabase SQL Editor to set up event-images storage bucket and policies

-- Create the storage bucket for event images
INSERT INTO storage.buckets (id, name, owner, public)
VALUES ('event-images', 'event-images', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their club folder
CREATE POLICY "Clubs can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM public.clubs
    WHERE profile_id = auth.uid()
    LIMIT 1
  )
);

-- Allow public read access to event images
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Allow authenticated users to view event images
CREATE POLICY "Authenticated users can view event images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-images');

-- Allow clubs to delete their own event images
CREATE POLICY "Clubs can delete their event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM public.clubs
    WHERE profile_id = auth.uid()
    LIMIT 1
  )
);
