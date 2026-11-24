import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'we-the-leader-logo.jpg'],
      manifest: {
        name: 'WE the Leader - Lead The Change',
        short_name: 'WE the Leader',
        description: 'Official Membership Registration Application for WE the Leader, Kinathukadavu, Coimbatore',
        theme_color: '#20223E',
        background_color: '#F5F7FA',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  server: {
    port: 3000,
    host: true
  }
});
