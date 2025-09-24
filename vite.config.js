import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/restaurant-scheduler/', // important for GitHub Pages
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Restaurant Scheduler',
        short_name: 'Scheduler',
        start_url: '/restaurant-scheduler/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0f766e',
        icons: [
          { src: '/restaurant-scheduler/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/restaurant-scheduler/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/restaurant-scheduler/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache built assets + runtime requests; tweak as needed
        navigateFallback: '/restaurant-scheduler/index.html'
      }
    })
  ],
})
