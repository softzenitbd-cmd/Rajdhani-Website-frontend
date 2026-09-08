import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://server-rajdhaniserver-dbitqs-9932f2-62-84-177-235.sslip.io',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
