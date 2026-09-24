/**
 * Vite plugin: bundle the catalog into the site at build time.
 *
 * The data stays in the repo (data_game/, scripts/deleted_games.json) as the
 * source of truth; every push to main rebuilds the site on Cloudflare Workers
 * Builds, so the app reads same-origin /data/* instead of raw.githubusercontent.
 *
 * Emits (minified):
 *   data/index.json, data/game_info_NNN.json   exactly the files in index.files
 *   data/count_history.json, data/deleted_games.json
 *   data/urls.json      {url: thumbnail} — dedupe + image-proxy allow-list for the Worker
 *   sitemap.xml         real paths incl. one /games/<slug> per game
 * The build FAILS on invalid JSON, a missing chunk or an index/chunk mismatch,
 * so a broken data commit never replaces a working deployment.
 *
 * In dev, the same files are served from /data/* by a middleware.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

interface IndexFile {
  total_games: number
  last_updated: string
  files: { name: string; count: number }[]
}

interface GameLike {
  url: string
  thumbnail?: string
}

const SITE = 'https://freeitchgames.win'
const STATIC_PAGES = ['/', '/games', '/charts', '/removed', '/about', '/suggest']

// Keep in sync with slugify() in src/lib/utils.ts.
function slugify(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function readJson<T>(file: string): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T
  } catch (e) {
    throw new Error(`catalog-data: cannot read ${file}: ${(e as Error).message}`, { cause: e })
  }
}

function buildFiles(repoRoot: string): Map<string, string> {
  const dataDir = path.join(repoRoot, 'data_game')
  const index = readJson<IndexFile>(path.join(dataDir, 'index.json'))
  const out = new Map<string, string>()
  const urls: Record<string, string> = {}
  let total = 0
  for (const { name, count } of index.files) {
    if (!/^game_info_\d{3}\.json$/.test(name)) throw new Error(`catalog-data: bad chunk name ${name}`)
    const games = readJson<GameLike[]>(path.join(dataDir, name))
    if (!Array.isArray(games) || games.length !== count) {
      throw new Error(`catalog-data: ${name} has ${games.length} games, index.json says ${count}`)
    }
    total += games.length
    for (const g of games) urls[g.url] = g.thumbnail ?? ''
    out.set(`data/${name}`, JSON.stringify(games))
  }
  if (total !== index.total_games) {
    throw new Error(`catalog-data: chunks hold ${total} games, index.json says ${index.total_games}`)
  }
  out.set('data/index.json', JSON.stringify(index))
  out.set(
    'data/count_history.json',
    JSON.stringify(readJson(path.join(dataDir, 'count_history.json'))),
  )
  out.set(
    'data/deleted_games.json',
    JSON.stringify(readJson(path.join(repoRoot, 'scripts', 'deleted_games.json'))),
  )
  out.set('data/urls.json', JSON.stringify(urls))

  const lastmod = index.last_updated.slice(0, 10)
  const locs = [
    ...STATIC_PAGES.map((p) => `${SITE}${p === '/' ? '/' : p}`),
    ...Object.keys(urls).map((u) => `${SITE}/games/${slugify(u)}`),
  ]
  out.set(
    'sitemap.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      locs.map((loc) => `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n') +
      '\n</urlset>\n',
  )
  return out
}

export function catalogData(repoRoot: string): Plugin {
  return {
    name: 'catalog-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        if (!url.startsWith('/data/') && url !== '/sitemap.xml') return next()
        const body = buildFiles(repoRoot).get(url.slice(1))
        if (body === undefined) return next()
        res.setHeader('Content-Type', url.endsWith('.xml') ? 'application/xml' : 'application/json')
        res.end(body)
      })
    },
    generateBundle() {
      for (const [fileName, source] of buildFiles(repoRoot)) {
        this.emitFile({ type: 'asset', fileName, source })
      }
    },
  }
}

/**
 * version.json: build stamp read at runtime by the About page. Kept out of the
 * JS bundle so a data-only rebuild produces byte-identical JS (unchanged
 * chunk hashes → no broken lazy imports in open tabs, fewer uploads).
 */
export function buildInfo(): Plugin {
  return {
    name: 'build-info',
    generateBundle() {
      const commit =
        process.env.WORKERS_CI_COMMIT_SHA ?? process.env.GITHUB_SHA ?? process.env.COMMIT_SHA ?? ''
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ builtAt: new Date().toISOString(), commit: commit.slice(0, 12) }),
      })
    },
  }
}

/**
 * Cloudflare Web Analytics beacon (cookieless) for a *manual* Web Analytics
 * setup: web build only, only when the build has a token (Workers Builds
 * variable VITE_CF_BEACON_TOKEN), never on the admin page. freeitchgames.win
 * uses the automatic setup instead — the zone injects the beacon into every
 * HTML response — so the token stays unset; setting it too would count every
 * page view twice. The site CSP allows the beacon either way.
 */
export function analyticsBeacon(token: string | undefined): Plugin {
  return {
    name: 'analytics-beacon',
    transformIndexHtml(html, ctx) {
      if (!token || !/^[0-9a-f]{32}$/i.test(token) || ctx.path.startsWith('/admin/')) return html
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: {
              defer: true,
              src: 'https://static.cloudflareinsights.com/beacon.min.js',
              'data-cf-beacon': JSON.stringify({ token }),
            },
            injectTo: 'body',
          },
        ],
      }
    },
  }
}
