import { supabase } from './supabase';
import { Forum } from '../types';

// --- Forums Operations ---

export const createForumForTool = async (toolId: string, title: string, description: string) => {
  if (!supabase) throw new Error("Supabase not initialized");

  const forumData = {
    tool_id: toolId,
    title: `${title} - Discussion Forum`,
    description: description || 'Discuss and share experiences with this tool',
    created_at: new Date().toISOString()
  };

  const { error } = await supabase.from('forums').insert(forumData);
  if (error) throw error;
};

export const getForumByToolId = async (toolId: string): Promise<Forum | null> => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase
    .from('forums')
    .select('*')
    .eq('tool_id', toolId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }

  return data;
};

export const getAllForums = async (): Promise<Forum[]> => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase
    .from('forums')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};
