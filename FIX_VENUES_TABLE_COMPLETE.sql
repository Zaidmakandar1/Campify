-- Fix: Add missing columns to venues table
-- Run this in Supabase SQL Editor

-- Step 1: Add missing columns if they don't exist
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS amenities TEXT[];

ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 2: Verify both columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'venues' 
ORDER BY ordinal_position;

-- Step 3: Check the complete venues table structure
SELECT * FROM public.venues LIMIT 1;

-- Step 4: Summary
SELECT 
  'venues table structure' as check_item,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'venues';
