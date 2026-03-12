
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: '../robs-backend/src/installer/public',
    emptyOutDir: true,
  },
  server: {
    port: 3005, // PORTS.INSTALLER — installer UI dev server
    proxy: {
      '/api': {
        // Installer backend is always on 3005 (PORTS.INSTALLER)
        target: 'http://localhost:3005',
        changeOrigin: true,
      }
    }
  }
})
