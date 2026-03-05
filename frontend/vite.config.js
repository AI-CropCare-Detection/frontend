import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('Backend server not available. Make sure the backend is running on port 3001.')
            console.warn('To start the backend: cd backend && npm run dev')
            // Don't crash the frontend if backend is unavailable
            // The frontend already handles API errors gracefully
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log proxy requests in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:3001${req.url}`)
            }
          })
        },
      },
    },
  },
})
