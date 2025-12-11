import { supabase } from './supabase';
import { Tool, NewsArticle, Forum } from '../types';
import { createForumForTool } from './forumService';

// Generate appropriate image URL based on tool category and name
const generateToolImageUrl = (toolName: string, category: string): string => {
  // Category-based image mapping
  const categoryImages: Record<string, string> = {
    'Writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1280&h=720&fit=crop&q=80',
    'Content Generation': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
    'Image Generation': 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1280&h=720&fit=crop&q=80',
    'Video Editing': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1280&h=720&fit=crop&q=80',
    'Audio Production': 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&h=720&fit=crop&q=80',
    'Voice Synthesis': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1280&h=720&fit=crop&q=80',
    'Music Generation': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1280&h=720&fit=crop&q=80',
    'Code Generation': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1280&h=720&fit=crop&q=80',
    'Data Analysis': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&q=80',
    'Data Analytics': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&q=80',
    'Customer Support': 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1280&h=720&fit=crop&q=80',
    'Healthcare': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1280&h=720&fit=crop&q=80',
    'Personal Productivity': 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&h=720&fit=crop&q=80',
    'Marketing': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
    'Natural Language Processing': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
    'Text Generation': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
    '3D Modeling': 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=1280&h=720&fit=crop&q=80',
  };

  // Use category-specific image or default AI image
  return categoryImages[category] || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80';
};

// Mappers to handle CamelCase (App) <-> SnakeCase (DB)
const mapToolFromDB = (data: any): Tool => ({
  ...data,
  imageUrl: data.image_url || data.imageUrl || '',
});

const mapToolToDB = (tool: Partial<Tool>) => {
  const { imageUrl, ...rest } = tool;
  return {
    ...rest,
    image_url: imageUrl,
  };
};

const mapNewsFromDB = (data: any): NewsArticle => ({
  ...data,
  imageUrl: data.image_url || data.imageUrl || '',
});

const mapNewsToDB = (news: Partial<NewsArticle>) => {
  const { imageUrl, ...rest } = news;
  return {
    ...rest,
    image_url: imageUrl,
  };
};

// --- Tools Operations ---

export const subscribeToTools = (callback: (tools: Tool[]) => void) => {
  if (!supabase) {
    console.warn("Supabase not initialized, skipping tool subscription.");
    return () => {};
  }

  const fetchTools = async () => {
    const { data, error } = await supabase!
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching tools:", error.message, error.code, error);
        return;
    }
    
    console.log('Tools fetched successfully:', data?.length || 0, 'items');
    if (data) callback(data.map(mapToolFromDB));
  };

  // Initial Fetch
  fetchTools();

  // Realtime Subscription
  const channel = supabase.channel('tools_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tools' }, () => {
        fetchTools();
    })
    .subscribe();

  return () => {
    supabase!.removeChannel(channel);
  };
};

export const addToolToDb = async (tool: Partial<Tool>) => {
  if (!supabase) throw new Error("Supabase not initialized");

  // Auto-generate image URL if not provided
  if (!tool.imageUrl || tool.imageUrl.includes('picsum.photos')) {
    tool.imageUrl = generateToolImageUrl(tool.name || '', tool.category || 'Uncategorized');
    console.log(`🖼️ Auto-generated image for ${tool.name}: ${tool.imageUrl}`);
  }

  const dbData = mapToolToDB(tool);
  // Remove ID to let DB generate UUID
  delete (dbData as any).id;

  const { data, error } = await supabase.from('tools').insert(dbData).select();
  if (error) throw error;

  // Automatically create forum for this tool
  if (data && data[0]) {
    const toolId = data[0].id;
    try {
      await createForumForTool(toolId, tool.name || 'Tool Forum', tool.description || 'Discuss this tool');
      console.log(`✅ Forum created automatically for tool: ${tool.name}`);
    } catch (forumError) {
      console.error('Failed to create forum for tool:', forumError);
      // Don't throw error - tool was created successfully even if forum wasn't
    }
  }
};

export const updateToolInDb = async (id: string, tool: Partial<Tool>) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const dbData = mapToolToDB(tool);
  // Remove ID from payload to avoid PK conflict if passed
  delete (dbData as any).id;
  delete (dbData as any).created_at; 
  
  const { error } = await supabase.from('tools').update(dbData).eq('id', id);
  if (error) throw error;
};

export const deleteToolFromDb = async (id: string) => {
  if (!supabase) throw new Error("Supabase not initialized");
  // Simply attempt delete. If RLS allows it, it works. If not, 'error' is populated.
  // We removed { count: 'exact' } check because some RLS policies hide the count return.
  const { error } = await supabase.from('tools').delete().eq('id', id);
  if (error) throw error;
};

// --- News Operations ---

export const subscribeToNews = (callback: (news: NewsArticle[]) => void) => {
  if (!supabase) {
    console.warn("Supabase not initialized, skipping news subscription.");
    return () => {};
  }

  const fetchNews = async () => {
    const { data, error } = await supabase!
        .from('news')
        .select('id,title,description,content,date,category,image_url,source')
        .order('date', { ascending: false })
        .limit(50);
    
    if (error) {
        console.error("Error fetching news:", error.message, error.code, error);
        return;
    }

    console.log('News fetched successfully:', data?.length || 0, 'items');
    if (data) callback(data.map(mapNewsFromDB));
  };

  // Initial Fetch
  fetchNews();

  // Realtime Subscription
  const channel = supabase.channel('news_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        fetchNews();
    })
    .subscribe();

  return () => {
    supabase!.removeChannel(channel);
  };
};

export const addNewsToDb = async (article: Partial<NewsArticle>) => {
  if (!supabase) throw new Error("Supabase not initialized");
  
  const dbData = mapNewsToDB(article);
  delete (dbData as any).id;
  delete (dbData as any).created_at;

  const payload = {
    ...dbData,
    date: dbData.date || new Date().toISOString()
  };

  console.log('Inserting news to DB:', payload);
  const { data, error } = await supabase.from('news').insert(payload).select();
  
  if (error) {
    console.error('Failed to insert news:', error);
    throw error;
  }
  
  console.log('News inserted successfully:', data);
};

export const updateNewsInDb = async (id: string, article: Partial<NewsArticle>) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const dbData = mapNewsToDB(article);
  delete (dbData as any).id;
  
  const { error } = await supabase.from('news').update(dbData).eq('id', id);
  if (error) throw error;
};

export const deleteNewsFromDb = async (id: string) => {
  if (!supabase) throw new Error("Supabase not initialized");
  // Simply attempt delete. If RLS allows it, it works. If not, 'error' is populated.
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) throw error;
};

// --- Favorites Operations ---

export const getUserFavorites = async (userId: string): Promise<string[]> => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase
    .from('user_favorites')
    .select('tool_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(fav => fav.tool_id);
};

export const addFavorite = async (userId: string, toolId: string) => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, tool_id: toolId });

  if (error) throw error;
};

export const removeFavorite = async (userId: string, toolId: string) => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('tool_id', toolId);

  if (error) throw error;
};

export const subscribeToFavorites = (userId: string, callback: (favoriteIds: string[]) => void) => {
  if (!supabase) {
    console.warn("Supabase not initialized, skipping favorites subscription.");
    return () => {};
  }

  const fetchFavorites = async () => {
    try {
      const favoriteIds = await getUserFavorites(userId);
      callback(favoriteIds);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  // Initial fetch
  fetchFavorites();

  // Realtime subscription
  const channel = supabase.channel('user_favorites_changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_favorites',
        filter: `user_id=eq.${userId}`
      },
      () => {
        fetchFavorites();
      }
    )
    .subscribe();

  return () => {
    supabase!.removeChannel(channel);
  };
};

// --- Forums Operations ---

