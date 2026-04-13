import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/step': 'http://localhost:8000',
      '/tools': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/reset': 'http://localhost:8000',
      '/snapshot': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
    },
  },
})
