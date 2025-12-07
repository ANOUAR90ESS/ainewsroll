import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Support both local .env and Vercel environment variables
    const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey)
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
