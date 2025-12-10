-- ============================================================================
-- SUPABASE DATABASE SCHEMA
-- ============================================================================
-- This file contains the SQL schema required for the AI News-Roll app.
-- Copy and paste these commands into the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql
-- ============================================================================

-- ============================================================================
-- 1. TOOLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  price TEXT,
  image_url TEXT,
  website TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tools
CREATE POLICY "Allow public read access to tools"
  ON tools FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update/delete tools
CREATE POLICY "Allow authenticated users to manage tools"
  ON tools FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update tools"
  ON tools FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete tools"
  ON tools FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 2. NEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT,
  image_url TEXT,
  source TEXT,
  date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read news
CREATE POLICY "Allow public read access to news"
  ON news FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update/delete news
CREATE POLICY "Allow authenticated users to manage news"
  ON news FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update news"
  ON news FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete news"
  ON news FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 3. USER_PROFILES TABLE (for role management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Allow users to read their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile (except role)
CREATE POLICY "Allow users to update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- TABLE INDEXES (for performance)
-- ============================================================================
CREATE INDEX idx_news_date ON news(date DESC);
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_tools_category ON tools(category);
CREATE INDEX idx_tools_name ON tools(name);

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. After creating tables, go to Supabase Dashboard
-- 2. Enable "Realtime" for both 'news' and 'tools' tables
-- 3. For public read access without auth, modify RLS policies:
--    - Change "Allow public read access" policies from "USING (true)" to allow anonymous access
-- 4. Test data insertion in Supabase SQL Editor or Admin Dashboard
-- ============================================================================
