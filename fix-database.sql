-- Run this SQL in your Neon database to fix the shortUrl column issue
-- This will remove the problematic column that was added by mistake

-- Drop the shortUrl column if it exists
ALTER TABLE "Urls" DROP COLUMN IF EXISTS "shortUrl";

-- Verify the table structure (optional - just to check)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'Urls';
