import { supabase } from './supabase';
import { Tool, NewsArticle } from '../types';

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
    const { data, error } = await supabase
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
    supabase.removeChannel(channel);
  };
};

export const addToolToDb = async (tool: Partial<Tool>) => {
  if (!supabase) throw new Error("Supabase not initialized");
  
  const dbData = mapToolToDB(tool);
  // Remove ID to let DB generate UUID
  delete (dbData as any).id;
  
  const { error } = await supabase.from('tools').insert(dbData);
  if (error) throw error;
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
    const { data, error } = await supabase
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
    supabase.removeChannel(channel);
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