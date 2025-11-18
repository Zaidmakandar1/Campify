-- Fix: Add missing amenities column to venues table
-- Run this in Supabase SQL Editor

-- Step 1: Add amenities column if it doesn't exist
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS amenities TEXT[];

-- Step 2: Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'venues' 
ORDER BY ordinal_position;

-- Step 3: Update existing venues to have empty array for amenities (if null)
UPDATE public.venues 
SET amenities = ARRAY[]::TEXT[] 
WHERE amenities IS NULL;

-- Step 4: Verify venues table structure
SELECT * FROM public.venues LIMIT 1;
