import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: isTauri ? 'dist' : '../docs/app',
    emptyOutDir: true,
    sourcemap: true,
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
