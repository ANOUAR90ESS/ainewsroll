-- Migration: Add affiliate monetization fields to news table
-- Run this in your Supabase SQL Editor: https://app.supabase.com -> SQL Editor -> New Query

ALTER TABLE news 
ADD COLUMN IF NOT EXISTS affiliate_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS affiliate_cta TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sponsored_tool_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sponsored_tool_desc TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sponsored_tool_price TEXT DEFAULT NULL;

COMMENT ON COLUMN news.affiliate_url IS 'Direct referral / affiliate link for sponsored tool';
COMMENT ON COLUMN news.affiliate_cta IS 'Custom CTA button text (e.g. Try Free, Claim 20% Off)';
COMMENT ON COLUMN news.sponsored_tool_name IS 'Name of the recommended / sponsored tool';
COMMENT ON COLUMN news.sponsored_tool_desc IS 'Short description of the recommended tool';
COMMENT ON COLUMN news.sponsored_tool_price IS 'Price tag of the recommended tool';
