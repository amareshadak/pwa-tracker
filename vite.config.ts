import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/pwa-tracker/',
  build: {
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['chart.js/auto'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide']
        }
      }
    }
  },
  server: {
    port: 8080
  }
});
