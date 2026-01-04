-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES public.tools(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration TEXT NOT NULL,
  thumbnail_url TEXT,
  content JSONB NOT NULL,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can read published courses
CREATE POLICY "Public can view published courses"
  ON public.courses
  FOR SELECT
  USING (is_published = true);

-- Authenticated users can insert courses (admin only in practice)
CREATE POLICY "Authenticated users can insert courses"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update courses (admin only in practice)
CREATE POLICY "Authenticated users can update courses"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete courses (admin only in practice)
CREATE POLICY "Authenticated users can delete courses"
  ON public.courses
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_tool_id ON public.courses(tool_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - comment out if not needed)
COMMENT ON TABLE public.courses IS 'Stores AI-generated courses for tools';
COMMENT ON COLUMN public.courses.content IS 'JSONB containing modules, lessons, and all course structure';
COMMENT ON COLUMN public.courses.difficulty IS 'Course difficulty level: beginner, intermediate, or advanced';
