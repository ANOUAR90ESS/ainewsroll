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

export const resetPassword = async (email: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) {
    console.error('Password reset error:', error);
    throw error;
  }
  
  return { message: 'Password reset email sent successfully' };
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  if (!supabase) return null;

  try {
    // Prefer getSession to avoid the noisy "Auth session missing" warning when unauthenticated.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.warn('Error getting session:', sessionError.message);
      return null;
    }

    const user = session?.user;
    if (!user) return null;

    // Fetch the role from the 'user_profiles' table
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Could not fetch profile, returning basic user info:', error.message);
      // Fallback if profile query fails (RLS restrictions, table doesn't exist, etc.)
      return {
        id: user.id,
        email: user.email || '',
        role: 'user'
      };
    }

    return {
      id: user.id,
      email: user.email || '',
      role: profile?.role as 'user' | 'admin' || 'user'
    };
  } catch (err: any) {
    console.error('Unexpected error in getCurrentUserProfile:', err);
    return null;
  }
};