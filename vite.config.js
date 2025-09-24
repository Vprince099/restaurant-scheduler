import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/restaurant-scheduler/',   // ← required for GitHub Pages
  plugins: [react()],
})
