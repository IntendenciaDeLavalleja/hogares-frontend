import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/admin': 'http://127.0.0.1:5000',
      '/auth': 'http://127.0.0.1:5000',
      '/static': 'http://127.0.0.1:5000',
    },
  },
})
