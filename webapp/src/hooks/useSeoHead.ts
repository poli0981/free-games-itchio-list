import { useEffect } from 'react'
import { matchRoutes, useLocation } from 'react-router'
import { SITE_ORIGIN } from '@/lib/config'
import { isTauri } from '@/lib/runtime'

// Pages worth indexing. Keep in sync with the <Routes> in App.tsx (and
// worker/spa.ts, which answers unknown paths and game slugs with a 404).
const INDEXED = ['/', '/games', '/games/:slug', '/charts', '/deleted', '/about', '/suggest'].map((path) => ({
  path,
}))

function headTag<T extends HTMLElement>(selector: string, create: () => T): T {
  return document.head.querySelector<T>(selector) ?? document.head.appendChild(create())
}

/**
 * Per-route canonical URL and robots directive (web only). index.html ships
 * no static canonical on purpose: every route is served the same file, and a
 * static root canonical would mark each game page a duplicate of the home
 * page. Runs in App() outside the legal gate, so crawlers get it too.
 */
export function useSeoHead(): void {
  const { pathname } = useLocation()
  useEffect(() => {
    if (isTauri()) return
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
    const canonical = headTag('link[rel="canonical"]', () => {
      const link = document.createElement('link')
      link.rel = 'canonical'
      return link
    })
    canonical.href = SITE_ORIGIN + path
    const robots = headTag('meta[name="robots"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      return meta
    })
    robots.content = matchRoutes(INDEXED, path) ? 'index,follow' : 'noindex'
  }, [pathname])
}
