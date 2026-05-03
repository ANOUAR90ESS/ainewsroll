import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key for admin operations (bypasses RLS)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const getAdminClient = () => {
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

// Map frontend Tool format to database format
const mapToolToDB = (tool: any) => {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    price: tool.price,
    tags: tool.tags || [],
    website: tool.website,
    image_url: tool.imageUrl,
    how_to_use: tool.how_to_use || '',
    features_detailed: tool.features_detailed || '',
    use_cases: tool.use_cases || '',
    pros_cons: tool.pros_cons || '',
    screenshots_urls: tool.screenshots_urls || []
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, payload } = req.body;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // We can use the service role client or anon client to get user by token.
    // getAdminClient().auth.getUser(token) works securely on the backend.
    const supabaseAdmin = getAdminClient();

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const supabase = supabaseAdmin; // Already initialized
    switch (action) {
      case 'addTool': {
        const { tool } = payload;
        console.log('📝 Admin API: Adding tool:', tool.name);

        const dbData = mapToolToDB(tool);
        // Remove ID to let DB generate UUID
        delete (dbData as any).id;

        const { data, error } = await supabase
          .from('tools')
          .insert(dbData)
          .select();

        if (error) {
          console.error('❌ DB Error:', error);
          throw error;
        }

        console.log('✅ Tool added successfully:', data);
        return res.json({ success: true, data: data[0] });
      }

      case 'updateTool': {
        const { id, tool } = payload;
        console.log('✏️ Admin API: Updating tool:', id);

        const dbData = mapToolToDB(tool);
        delete (dbData as any).id;

        const { data, error } = await supabase
          .from('tools')
          .update(dbData)
          .eq('id', id)
          .select();

        if (error) {
          console.error('❌ DB Error:', error);
          throw error;
        }

        console.log('✅ Tool updated successfully');
        return res.json({ success: true, data: data[0] });
      }

      case 'deleteTool': {
        const { id } = payload;
        console.log('🗑️ Admin API: Deleting tool:', id);

        const { error } = await supabase
          .from('tools')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('❌ DB Error:', error);
          throw error;
        }

        console.log('✅ Tool deleted successfully');
        return res.json({ success: true });
      }

      case 'addNews': {
        const { article } = payload;
        console.log('📰 Admin API: Adding news:', article.title);

        const dbData = {
          id: article.id,
          title: article.title,
          description: article.description,
          content: article.content,
          source: article.source,
          category: article.category,
          image_url: article.imageUrl,
          date: article.date || new Date().toISOString()
        };
        delete (dbData as any).id;

        const { data, error } = await supabase
          .from('news')
          .insert(dbData)
          .select();

        if (error) {
          console.error('❌ DB Error:', error);
          throw error;
        }

        console.log('✅ News added successfully');
        return res.json({ success: true, data: data[0] });
      }

      case 'updateNews': {
        const { id, article } = payload;
        console.log('✏️ Admin API: Updating news:', id);

        const dbData = {
          title: article.title,
          description: article.description,
          content: article.content,
          source: article.source,
          category: article.category,
          image_url: article.imageUrl,
          date: article.date || new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('news')
          .update(dbData)
          .eq('id', id)
          .select();

        if (error) {
          console.error('❌ DB Error:', error);
          throw error;
        }

        console.log('✅ News updated successfully');
        return res.json({ success: true, data: data[0] });
      }

      case 'deleteNews': {
        const { id } = payload;
        console.log('🗑️ Admin API: Deleting news:', id);

        const { error } = await supabase
          .from('news')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('❌ DB Error:', error);
          throw error;
        }

        console.log('✅ News deleted successfully');
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error: any) {
    console.error('Admin API error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process request',
      details: error.details || error.hint || ''
    });
  }
}
