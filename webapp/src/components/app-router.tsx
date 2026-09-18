import type { ReactNode } from 'react'
import { BrowserRouter, HashRouter } from 'react-router'
import { isTauri } from '@/lib/runtime'

/**
 * The web app uses real paths (crawlable, protectable by Cloudflare Access);
 * the Tauri apps keep hash routing on their custom protocol.
 */
export function AppRouter({ children }: { children: ReactNode }) {
  return isTauri() ? <HashRouter>{children}</HashRouter> : <BrowserRouter>{children}</BrowserRouter>
}
