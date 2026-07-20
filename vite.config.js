import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Roast'n Rake landing page. Served from the apex domain roastandrake.com
// (GitHub Pages), so assets live at the site root.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5180 },
})
