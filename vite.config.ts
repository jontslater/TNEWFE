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
  resolve: {
    dedupe: ['firebase']
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
    exclude: []
  },
  build: {
    // Disable source maps in production for smaller bundle
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Bundle React and related packages
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // Don't manually chunk Firebase - let Vite handle it automatically
            // Firebase v12 uses ES modules and needs special handling
          }
        }
      }
    }
  }
})
