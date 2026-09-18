import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { buildInfo, catalogData } from './vite-plugins/catalog-data.ts'

// Set by the Tauri CLI for `tauri dev` / `tauri build`.
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined
const repoRoot = path.resolve(import.meta.dirname, '..')

export default defineConfig({
  // Web: absolute paths (BrowserRouter deep links). Tauri: relative (custom protocol).
  base: isTauri ? './' : '/',
  // The Tauri apps read the catalog from the live site, so only the web build bundles it.
  plugins: [react(), buildInfo(), ...(isTauri ? [] : [catalogData(repoRoot)])],
  build: {
    // Web (Cloudflare Workers Builds) and Tauri both build to webapp/dist.
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Higher priority wins when a module matches several groups.
          groups: [
            { name: 'vendor-charts', test: /node_modules[\\/](recharts|d3-|victory-vendor)/, priority: 50 },
            { name: 'vendor-query', test: /node_modules[\\/]@tanstack[\\/]/, priority: 40 },
            {
              name: 'vendor-ui',
              test: /node_modules[\\/](@radix-ui|lucide-react|sonner)[\\/]/,
              priority: 30,
            },
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // `npx wrangler dev` (port 8787) serves the Worker routes during development.
    proxy: {
      '/api': 'http://localhost:8787',
      '/img': 'http://localhost:8787',
    },
  },
  clearScreen: false,
})
