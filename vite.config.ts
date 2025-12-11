import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // ⚠️ SECURITY: Only expose SAFE public variables to the client
    // NEVER expose API keys or secrets here - they will be visible in the browser
    const supabaseUrl = env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // ✅ ONLY Supabase public variables (safe to expose)
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
        // ❌ REMOVED: GEMINI_API_KEY - now only accessible server-side via API routes
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks - separate large dependencies
              'react-vendor': ['react', 'react-dom'],
              'supabase-vendor': ['@supabase/supabase-js'],
              'icons-vendor': ['lucide-react'],
            }
          }
        },
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
        sourcemap: false, // Disable sourcemaps in production
      }
    };
});
