import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: true,
    port: process.env.PORT || 5173,
    strictPort: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (_err, _req, _res) => {
            console.warn('Backend server not available. Make sure the backend is running on port 3001.')
            console.warn('To start the backend: cd backend && npm run dev')
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${process.env.VITE_API_URL || 'http://localhost:3001'}${req.url}`)
            }
          })
        },
      },
    },
  },

  preview: {
    host: true,
    port: process.env.PORT || 5173,
    strictPort: true,
    allowedHosts: 'all',
  },
})