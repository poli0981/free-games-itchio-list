import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { analyticsBeacon, buildInfo, catalogData } from './vite-plugins/catalog-data.ts'

// Set by the Tauri CLI for `tauri dev` / `tauri build`.
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined
const repoRoot = path.resolve(import.meta.dirname, '..')

export default defineConfig({
  // Web: absolute paths (BrowserRouter deep links). Tauri: relative (custom protocol).
  base: isTauri ? './' : '/',
  // The Tauri apps read the catalog from the live site, so only the web build bundles it.
  plugins: [
    react(),
    buildInfo(),
    ...(isTauri ? [] : [catalogData(repoRoot), analyticsBeacon(process.env.VITE_CF_BEACON_TOKEN)]),
  ],
  build: {
    // Web (Cloudflare Workers Builds) and Tauri both build to webapp/dist.
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Web floor: Safari/iOS 15.4 (iPhone 6s/7/SE1 stop at iOS 15.8). Vite 8's
    // default (Safari 16.4) would ship Radix's class static blocks unlowered:
    // a SyntaxError, i.e. a blank page, on older iOS. Tauri keeps the default
    // (the macOS app documents Safari 16.4+).
    target: isTauri ? 'baseline-widely-available' : ['chrome111', 'edge111', 'firefox114', 'safari15.4', 'ios15.4'],
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      // Web: the public app + the maintainer-only admin (/admin/, served by
      // the Worker after the Access check). The Tauri apps ship the public app only.
      input: isTauri
        ? undefined
        : {
            main: path.resolve(import.meta.dirname, 'index.html'),
            admin: path.resolve(import.meta.dirname, 'admin/index.html'),
          },
      output: {
        codeSplitting: {
          // Higher priority wins when a module matches several groups. Groups
          // also pull in their dependencies, so React must be claimed first.
          // No vendor-charts group: it would capture shared deps (React, clsx)
          // and put Recharts on the first load. Recharts is only reached from
          // the lazy chart tabs, so default splitting keeps it lazy.
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              priority: 100,
            },
            { name: 'vendor-query', test: /node_modules[\\/]@tanstack[\\/]/, priority: 40 },
            {
              name: 'vendor-ui',
              test: /node_modules[\\/](@radix-ui|lucide-react|sonner)[\\/]/,
              priority: 30,
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
