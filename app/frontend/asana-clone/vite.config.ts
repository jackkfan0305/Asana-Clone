import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/step': 'http://localhost:8031',
      '/tools': 'http://localhost:8031',
      '/health': 'http://localhost:8031',
      '/reset': 'http://localhost:8031',
      '/snapshot': 'http://localhost:8031',
      '/auth': 'http://localhost:8031',
    },
  },
})
