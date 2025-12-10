import { createClient } from '@supabase/supabase-js';

// Safe environment variable retrieval
const getEnvVar = (key: string): string => {
  try {
    // Check import.meta.env (Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    
    // Check process.env (Node/Webpack)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    console.warn(`Error reading env var ${key}`, e);
  }

  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Check if configured (truthy & non-empty)
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey;

// Debug logging
if (typeof window !== 'undefined') {
  console.log('Supabase Config Check:', {
    url_exists: !!supabaseUrl,
    key_exists: !!supabaseKey,
    configured: isSupabaseConfigured,
    url_length: supabaseUrl?.length || 0,
    key_length: supabaseKey?.length || 0,
  });
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nexus-ai-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;