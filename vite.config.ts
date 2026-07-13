import { defineConfig } from 'vite';

export default defineConfig({
  base: '/pwa-tracker/',
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
