import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En dev, `npm run dev` sirve en localhost:5173 y proxea /api al gateway.
// En prod, `npm run build` genera dist/ que Nginx sirve en localhost:8080/.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    outDir: 'dist'
  }
})
