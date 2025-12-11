import { supabase } from './supabase';
import { Tool, NewsArticle, Forum } from '../types';
import { createForumForTool } from './forumService';

// Generate appropriate image URL based on tool category and name
const generateToolImageUrl = (toolName: string, category: string): string => {
  // Category-based image mapping with multiple variations
  const categoryImages: Record<string, string[]> = {
    'Writing': [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1280&h=720&fit=crop&q=80'
    ],
    'Content Generation': [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542435503-956c469947f6?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1280&h=720&fit=crop&q=80'
    ],
    'Image Generation': [
      'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1280&h=720&fit=crop&q=80'
    ],
    'Video Editing': [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579547621869-0ddb5f237392?w=1280&h=720&fit=crop&q=80'
    ],
    'Code Generation': [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1280&h=720&fit=crop&q=80'
    ],
    'Data Analysis': [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=1280&h=720&fit=crop&q=80'
    ],
    'Design Tools': [
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=1280&h=720&fit=crop&q=80'
    ],
    'Education': [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1280&h=720&fit=crop&q=80'
    ],
    'Audio & Voice': [
      'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&h=720&fit=crop&q=80',
      'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1280&h=720&fit=crop&q=80'
    ]
  };

  // Default images if category not found
  const defaultImages = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&h=720&fit=crop&q=80',
    'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=1280&h=720&fit=crop&q=80'
  ];

  // Get images for category
  const images = categoryImages[category] || defaultImages;
  
  // Use hash of tool name to consistently select an image variant
  const hash = toolName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[hash % images.length];
};

// Mappers to handle CamelCase (App) <-> SnakeCase (DB)
const mapToolFromDB = (data: any): Tool => ({
  ...data,
  imageUrl: data.image_url || data.imageUrl || '',
  how_to_use: data.how_to_use || '',
  features_detailed: data.features_detailed || '',
  use_cases: data.use_cases || '',
  pros_cons: data.pros_cons || '',
  screenshots_urls: data.screenshots_urls || []
});

const mapToolToDB = (tool: Partial<Tool>) => {
  const { imageUrl, how_to_use, features_detailed, use_cases, pros_cons, screenshots_urls, ...rest } = tool;
  return {
    ...rest,
    image_url: imageUrl,
    how_to_use: how_to_use || null,
    features_detailed: features_detailed || null,
    use_cases: use_cases || null,
    pros_cons: pros_cons || null,
    screenshots_urls: screenshots_urls || []
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

