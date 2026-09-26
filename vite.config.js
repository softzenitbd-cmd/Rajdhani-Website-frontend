import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Split the heavy vendors so the main bundle stays small and cacheable
const vendorChunk = (id) => {
  if (!id.includes('node_modules')) return undefined;
  if (/[\/]node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler)[\/]/.test(id)) return 'react';
  if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'charts';
  if (id.includes('xlsx')) return 'xlsx';
  if (id.includes('lucide-react')) return 'icons';
  if (id.includes('i18next')) return 'i18n';
  return 'vendor';
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://server-rajdhaniserver-dbitqs-9932f2-62-84-177-235.sslip.io',
        changeOrigin: true,
        secure: false,
      },
      // Uploaded files (company banner / logo) are served by the backend under
      // /media; without these the header image 404s against the dev server.
      '/media': {
        target: 'https://server-rajdhaniserver-dbitqs-9932f2-62-84-177-235.sslip.io',
        changeOrigin: true,
        secure: false,
      },
      '/static': {
        target: 'https://server-rajdhaniserver-dbitqs-9932f2-62-84-177-235.sslip.io',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      }
    }
  }
})
