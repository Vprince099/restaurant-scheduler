// vite.config.js
// Copy this into your project root (replace existing if present).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // IMPORTANT: base must match your repo name for GitHub Pages
  base: '/restaurant-scheduler/',
  plugins: [react()],
})
