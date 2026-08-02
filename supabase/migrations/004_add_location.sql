-- Run this in the Supabase SQL Editor to add the location field
ALTER TABLE people ADD COLUMN IF NOT EXISTS location TEXT;
