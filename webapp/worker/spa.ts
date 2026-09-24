/**
 * Requests that match no static asset (wrangler.jsonc `not_found_handling:
 * "none"` sends them here).
 *
 * - Anything that looks like a file (under /assets/ or /data/, or with an
 *   extension) is a real 404 — never the app shell, which the browser would
 *   otherwise cache under a hashed chunk URL or try to parse as JSON.
 * - App routes get the shell (index.html) with 200; unknown paths and game
 *   slugs that are not in the catalog get the same shell with 404, so the SPA
 *   still renders its Not Found page but crawlers see a real 404.
 * - With the verification gate on, a visitor who has not passed gets the
 *   verification page instead of the shell (gate.ts).
 */
import { catalogUrls, type DataSource } from './data'
import { json } from './http'

// Keep in sync with the <Routes> in src/App.tsx.
const ROUTES = new Set(['/', '/games', '/charts', '/removed', '/settings', '/about', '/suggest'])
// Renamed routes: permanent redirects (the SPA would also redirect, but crawlers get a 301).
const MOVED: Record<string, string> = { '/deleted': '/removed' }
const GAME_ROUTE = /^\/games\/([a-z0-9-]+)$/
const ERROR_PREVIEW_ROUTE = /^\/errors\/[a-z0-9-]+$/

// Keep in sync with slugify() in src/lib/utils.ts.
function slugify(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

const slugSets = new WeakMap<Map<string, string>, Set<string>>()

async function isGameSlug(slug: string, src: DataSource): Promise<boolean> {
  let urls: Map<string, string>
  try {
    urls = await catalogUrls(src)
  } catch {
    return true // catalog unavailable: don't turn real pages into 404s
  }
  let slugs = slugSets.get(urls)
  if (!slugs) {
    slugs = new Set([...urls.keys()].map(slugify))
    slugSets.set(urls, slugs)
  }
  return slugs.has(slug)
}

async function isAppRoute(pathname: string, src: DataSource): Promise<boolean> {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (ROUTES.has(path) || ERROR_PREVIEW_ROUTE.test(path)) return true
  const game = GAME_ROUTE.exec(path)
  return game !== null && (await isGameSlug(game[1], src))
}

/** Answers an app page request that may not see the shell yet; null lets it through (gate.ts). */
export type PageGate = (request: Request) => Promise<Response | null>

export async function handleMiss(request: Request, url: URL, assets: Fetcher, gate?: PageGate): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET, HEAD' })
  }
  const last = url.pathname.slice(url.pathname.lastIndexOf('/') + 1)
  if (/^\/(assets|data)\//.test(url.pathname) || last.includes('.')) {
    // CORS on /data misses too, so the desktop/Android apps see a 404, not a CORS error.
    const cors = url.pathname.startsWith('/data/') ? { 'Access-Control-Allow-Origin': '*' } : undefined
    return json({ error: 'not_found' }, 404, cors)
  }
  const moved = MOVED[url.pathname.replace(/\/+$/, '')]
  if (moved) return Response.redirect(new URL(moved + url.search, url).toString(), 301)
  // Before the shell is fetched, so a conditional request (If-None-Match)
  // without a pass gets the verification page, never a 304 for a cached shell.
  const blocked = await gate?.(request)
  if (blocked) return blocked
  // "/" rather than "/index.html": auto-trailing-slash would redirect the latter.
  const shell = await assets.fetch(new Request(new URL('/', url), request))
  if (shell.status !== 200 || (await isAppRoute(url.pathname, { assets, origin: url.origin }))) {
    return shell
  }
  return new Response(shell.body, { status: 404, headers: shell.headers })
}
