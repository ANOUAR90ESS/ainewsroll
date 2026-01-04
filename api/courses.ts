import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

          // Prompt optimizado para ChatGPT
          const prompt = `You are an expert AI course creator. Create a comprehensive, practical course about this AI tool.

**Tool Name:** ${toolName}
**Description:** ${toolDescription}
**Category:** ${category || 'AI Tools'}

Generate a complete course in JSON format. Respond ONLY with valid JSON, no markdown or extra text:

{
  "title": "Mastering ${toolName}: Complete Guide",
  "description": "A comprehensive course description (2-3 sentences)",
  "difficulty": "beginner",
  "estimated_duration": "2-3 hours",
  "learning_objectives": [
    "Understand what ${toolName} is and its core features",
    "Learn to set up and configure ${toolName}",
    "Master practical use cases and workflows",
    "Apply advanced techniques and best practices"
  ],
  "prerequisites": ["Basic computer skills", "Interest in AI tools"],
  "modules": [
    {
      "id": 1,
      "title": "Introduction to ${toolName}",
      "description": "Get started with the fundamentals",
      "icon": "🚀",
      "lessons": [
        {
          "id": 1,
          "title": "What is ${toolName}?",
          "duration": "10 min",
          "content": "Detailed lesson content with explanations, examples, and practical insights (minimum 200 words). Include real-world context and why this matters.",
          "key_points": ["Key point 1", "Key point 2", "Key point 3"],
          "tips": "Pro tip for this lesson"
        },
        {
          "id": 2,
          "title": "Key Features Overview",
          "duration": "15 min",
          "content": "Comprehensive overview of features...",
          "key_points": ["Feature 1", "Feature 2", "Feature 3"],
          "tips": "How to get the most out of these features"
        }
      ]
    },
    {
      "id": 2,
      "title": "Getting Started",
      "description": "Setup and first steps",
      "icon": "⚙️",
      "lessons": [
        {
          "id": 1,
          "title": "Account Setup & Configuration",
          "duration": "12 min",
          "content": "Step by step guide...",
          "key_points": ["Step 1", "Step 2", "Step 3"],
          "tips": "Tip for setup"
        }
      ]
    },
    {
      "id": 3,
      "title": "Practical Applications",
      "description": "Real-world use cases",
      "icon": "💡",
      "lessons": []
    },
    {
      "id": 4,
      "title": "Advanced Techniques",
      "description": "Level up your skills",
      "icon": "🎯",
      "lessons": []
    }
  ],
  "summary": {
    "total_modules": 4,
    "total_lessons": 10,
    "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
  },
  "resources": [
    {
      "title": "Official Documentation",
      "type": "documentation",
      "description": "Link to official docs"
    }
  ]
}

IMPORTANT RULES:
1. Create exactly 4 modules with 2-4 lessons each
2. Each lesson content must be at least 150 words with practical examples
3. Make content specific to ${toolName}, not generic
4. Include practical tips and real use cases
5. Response must be valid JSON only`;

          console.log('🎓 Generating course for:', toolName);

          // Llamada a ChatGPT
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are an expert course creator. Always respond with valid JSON only, no markdown code blocks or additional text. Ensure all JSON is properly formatted and complete.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4500,
          });

          const responseText = completion.choices[0]?.message?.content;

          if (!responseText) {
            throw new Error('No response from ChatGPT');
          }

          console.log('📝 ChatGPT response received, parsing...');

          // Limpiar y parsear JSON
          let courseContent;
          try {
            // Remover posibles markdown code blocks
            let cleanJson = responseText
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim();

            courseContent = JSON.parse(cleanJson);
          } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            console.error('Raw response:', responseText.substring(0, 500));
            return res.status(500).json({
              error: 'Failed to parse course content. Please try again.'
            });
          }

          console.log('✅ Course content parsed successfully');

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
