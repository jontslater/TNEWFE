import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // Don't fail build on TypeScript errors
    typescript: {
      ignoreBuildErrors: true
    }
  })],
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/auth']
  },
  build: {
    // Disable source maps in production for smaller bundle
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Bundle React and related packages
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // Exclude Firebase from manual chunks - let Vite handle it automatically
            if (id.includes('firebase')) {
              return 'firebase-vendor'
            }
            // Other node_modules
            return 'vendor'
          }
        }
      }
    }
  }
})
