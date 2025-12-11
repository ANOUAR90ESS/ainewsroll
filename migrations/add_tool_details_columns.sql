-- Migration: Add detailed fields to tools table
-- This migration adds columns for rich tool content (how-to guides, features, use cases, pros/cons)

ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS how_to_use TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS features_detailed TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS use_cases TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pros_cons TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS screenshots_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comment to document new columns
COMMENT ON COLUMN tools.how_to_use IS 'Step-by-step guide on how to use this tool';
COMMENT ON COLUMN tools.features_detailed IS 'Detailed breakdown of key features';
COMMENT ON COLUMN tools.use_cases IS 'Real-world use case examples';
COMMENT ON COLUMN tools.pros_cons IS 'Advantages and disadvantages of using this tool';
COMMENT ON COLUMN tools.screenshots_urls IS 'Array of screenshot URLs for the tool';
