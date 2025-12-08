import { supabase } from './supabase';
import { UserProfile } from '../types';

export const signIn = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  console.log('Attempting sign in for:', email);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }
  
  console.log('Sign in successful:', data.user?.email);
  return data;
};

export const signUp = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  console.log('Attempting sign up for:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    console.error('Sign up error:', error);
    throw error;
  }
  
  console.log('Sign up successful:', data.user?.email);
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch the role from the 'user_profiles' table
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // Fallback if profile trigger failed or table doesn't exist yet
    return {
      id: user.id,
      email: user.email || '',
      role: 'user'
    };
  }

  return {
    id: user.id,
    email: user.email || '',
    role: profile.role as 'user' | 'admin'
  };
};