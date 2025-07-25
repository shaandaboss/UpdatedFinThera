import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})