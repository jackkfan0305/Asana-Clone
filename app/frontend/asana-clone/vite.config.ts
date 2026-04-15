import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/step': 'http://localhost:8030',
      '/tools': 'http://localhost:8030',
      '/health': 'http://localhost:8030',
      '/reset': 'http://localhost:8030',
      '/snapshot': 'http://localhost:8030',
      '/auth': 'http://localhost:8030',
    },
  },
})
