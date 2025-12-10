import { supabase } from './supabase';
import { ToolReview, ToolRatingSummary } from '../types';

export const getToolReviews = async (toolId: string): Promise<ToolReview[]> => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase
    .from('tool_reviews')
    .select(`
      *,
      user:user_id (email)
    `)
    .eq('tool_id', toolId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Map to include user email
  return (data || []).map((review: any) => ({
    ...review,
    user_email: review.user?.email || 'Anonymous'
  }));
};

export const getToolRatingSummary = async (toolId: string): Promise<ToolRatingSummary> => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase
    .from('tool_ratings_summary')
    .select('*')
    .eq('tool_id', toolId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

  return data || {
    tool_id: toolId,
    review_count: 0,
    average_rating: 0,
    five_star_count: 0,
    four_star_count: 0,
    three_star_count: 0,
    two_star_count: 0,
    one_star_count: 0
  };
};

export const addReview = async (
  userId: string,
  toolId: string,
  rating: number,
  title?: string,
  comment?: string
): Promise<ToolReview> => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase
    .from('tool_reviews')
    .insert({
      user_id: userId,
      tool_id: toolId,
      rating,
      title,
      comment
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateReview = async (
  reviewId: string,
  rating: number,
  title?: string,
  comment?: string
): Promise<ToolReview> => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase
    .from('tool_reviews')
    .update({
      rating,
      title,
      comment,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { error } = await supabase
    .from('tool_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
};

export const getUserReviewForTool = async (userId: string, toolId: string): Promise<ToolReview | null> => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase
    .from('tool_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('tool_id', toolId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

  return data || null;
};
