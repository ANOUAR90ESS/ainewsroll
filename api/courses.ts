import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateCourseWithGemini } from '../services/geminiCourseService';

// Service role para bypass RLS (solo admin backend)
const getAdminClient = () => {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.body || {};

  try {
    const supabase = getAdminClient();

    // GET: Obtener todos los cursos
    if (req.method === 'GET') {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.json({ courses });
    }

    // POST: Generar o gestionar cursos
    if (req.method === 'POST') {
      switch (action) {
        case 'generateCourse': {
          const { toolId, toolName, toolDescription, category, imageUrl } = req.body;

          if (!toolName || !toolDescription) {
            return res.status(400).json({
              error: 'Tool name and description are required'
            });
          }

          console.log('🎓 [Gemini] Generating course for:', toolName);

          let courseContent;
          try {
            // Llamada a Gemini para generar curso completo
            courseContent = await generateCourseWithGemini(
              toolName,
              toolDescription,
              category || 'AI Tools'
            );
            console.log('✅ [Gemini] Course content generated successfully');
          } catch (genError: any) {
            console.error('❌ [Gemini] Generation failed:', genError);
            return res.status(500).json({
              error: 'Failed to generate course with Gemini',
              details: genError.message || 'AI generation error'
            });
          }

          // Guardar en Supabase
          const { data: course, error: dbError } = await supabase
            .from('courses')
            .insert({
              tool_id: toolId || null,
              tool_name: toolName,
              title: courseContent.title,
              description: courseContent.description,
              difficulty: courseContent.difficulty || 'beginner',
              estimated_duration: courseContent.estimated_duration || '2-3 hours',
              content: courseContent,
              thumbnail_url: imageUrl || null,
              is_published: true,
              view_count: 0
            })
            .select()
            .single();

          if (dbError) {
            console.error('❌ Database Error:', dbError);
            return res.status(500).json({
              error: 'Failed to save course to database',
              details: dbError.message
            });
          }

          console.log('🎉 Course saved successfully:', course.id);

          return res.json({
            success: true,
            course: course,
            message: 'Course generated successfully!'
          });
        }

        case 'getCourse': {
          const { id } = req.body;

          const { data: course, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', id)
            .eq('is_published', true)
            .single();

          if (error) {
            return res.status(404).json({ error: 'Course not found' });
          }

          // Incrementar view_count
          await supabase
            .from('courses')
            .update({ view_count: (course.view_count || 0) + 1 })
            .eq('id', id);

          return res.json({ course });
        }

        case 'deleteCourse': {
          const { id } = req.body;

          const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);

          if (error) throw error;

          return res.json({ success: true });
        }

        default:
          return res.status(400).json({ error: 'Unknown action' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('❌ Courses API error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process request',
      details: error.details || error.hint || ''
    });
  }
}
