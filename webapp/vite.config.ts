import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  build: {
    outDir: isTauri ? 'dist' : '../docs/app',
    emptyOutDir: true,
    sourcemap: false,
    target: isTauri ? 'es2022' : 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('openpgp')) return 'vendor-openpgp'
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
            if (id.includes('@octokit')) return 'vendor-github'
            if (id.includes('@tanstack')) return 'vendor-query'
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('sonner')) {
              return 'vendor-ui'
            }
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react'
            }
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  clearScreen: false,
})
