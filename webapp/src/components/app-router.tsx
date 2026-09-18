import type { ReactNode } from 'react'
import { BrowserRouter, HashRouter } from 'react-router'
import { isTauri } from '@/lib/runtime'

/**
 * The web app uses real paths (crawlable, protectable by Cloudflare Access);
 * the Tauri apps keep hash routing on their custom protocol.
 *
 * `useTransitions={false}`: navigations commit right away instead of inside
 * `startTransition`. The Games page writes its filters to the URL, and with
 * transitions `useSearchParams` kept returning the previous URL until the
 * transition committed, so quick clicks overwrote each other.
 */
export function AppRouter({ children }: { children: ReactNode }) {
  return isTauri() ? (
    <HashRouter useTransitions={false}>{children}</HashRouter>
  ) : (
    <BrowserRouter useTransitions={false}>{children}</BrowserRouter>
  )
}
