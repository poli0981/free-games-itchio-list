/**
 * Vite plugin: bundle the catalog into the site at build time.
 *
 * The data stays in the repo (data_game/, scripts/deleted_games.json) as the
 * source of truth; every push to main rebuilds the site on Cloudflare Workers
 * Builds, so the app reads same-origin /data/* instead of raw.githubusercontent.
 *
 * Emits:
 *   data/pack/manifest-v1.json + data/pack/<sha256 prefix>.bin
 *                       what the site and the apps (4.2+) read: per chunk a "main"
 *                       pack (every field but description) and a "desc" pack,
 *                       plus the removal log and the games-over-time series
 *                       (src/lib/data/pack-format.ts). Names change exactly when
 *                       the bytes do, so the files are cached for good.
 *   data/index.json, data/game_info_NNN.json, data/count_history.json,
 *   data/deleted_games.json   the readable JSON (minified), byte-for-byte as
 *                       before: only apps 4.0–4.1.1 get it (worker/legacy-data.ts)
 *   data/urls.json      {url: thumbnail}: image-proxy allow-list etc. for the Worker
 *   sitemap.xml         real paths incl. one /games/<slug> per game
 * The build FAILS on invalid JSON, a missing chunk or an index/chunk mismatch,
 * so a broken data commit never replaces a working deployment. Nothing here may
 * reach the JS bundle: a data-only rebuild must keep producing identical JS.
 *
 * In dev, the same files are served from /data/* by a middleware.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { deflateRawSync } from 'node:zlib'
import type { Plugin } from 'vite'
import { encodePack, MANIFEST_FILE, PACK_VERSION, type PackManifest } from '../src/lib/data/pack-format.ts'

interface IndexFile {
  total_games: number
  last_updated: string
  files: { name: string; count: number }[]
}

export interface CatalogSources {
  index: IndexFile
  /** In index.files order. */
  chunks: { name: string; count: number; games: unknown }[]
  history: unknown
  deleted: unknown
}

type Row = Record<string, unknown>
export type CatalogFiles = Map<string, string | Uint8Array>

const SITE = 'https://freeitchgames.win'
const STATIC_PAGES = ['/', '/games', '/charts', '/removed', '/about', '/suggest']
const CHUNK_NAME = /^game_info_\d{3}\.json$/

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

export function readCatalogSources(repoRoot: string): CatalogSources {
  const dataDir = path.join(repoRoot, 'data_game')
  const index = readJson<IndexFile>(path.join(dataDir, 'index.json'))
  const chunks = index.files.map(({ name, count }) => {
    if (!CHUNK_NAME.test(name)) throw new Error(`catalog-data: bad chunk name ${name}`)
    return { name, count, games: readJson<unknown>(path.join(dataDir, name)) }
  })
  return {
    index,
    chunks,
    history: readJson(path.join(dataDir, 'count_history.json')),
    deleted: readJson(path.join(repoRoot, 'scripts', 'deleted_games.json')),
  }
}

function rowsOf(value: unknown, file: string): Row[] {
  if (!Array.isArray(value) || !value.every((r) => typeof r === 'object' && r !== null && !Array.isArray(r))) {
    throw new Error(`catalog-data: ${file} must be a list of objects`)
  }
  return value as Row[]
}

/** Adds one pack (deflate-raw of its JSON) and returns its file name. */
function addPack(out: CatalogFiles, rows: readonly object[]): string {
  const bytes = new Uint8Array(deflateRawSync(JSON.stringify(encodePack(rows)), { level: 9 }))
  const file = `${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.bin`
  out.set(`data/pack/${file}`, bytes)
  return file
}

/** Every file under dist/ that comes from the catalog. Pure: the same sources give the same bytes. */
export function buildCatalogFiles(src: CatalogSources): CatalogFiles {
  const { index } = src
  const out: CatalogFiles = new Map()
  const urls: Record<string, string> = {}
  const chunks: PackManifest['chunks'] = []
  let total = 0
  for (const { name, count, games } of src.chunks) {
    if (!CHUNK_NAME.test(name)) throw new Error(`catalog-data: bad chunk name ${name}`)
    if (!Array.isArray(games) || games.length !== count) {
      const found = Array.isArray(games) ? games.length : 'no'
      throw new Error(`catalog-data: ${name} has ${found} games, index.json says ${count}`)
    }
    total += games.length
    const main: Row[] = []
    const desc: { description: string }[] = []
    for (const game of rowsOf(games, name)) {
      const { description, ...rest } = game
      if (typeof description !== 'string') throw new Error(`catalog-data: ${name}: ${String(game.url)} has no description`)
      main.push(rest)
      desc.push({ description })
      urls[game.url as string] = (game.thumbnail as string | undefined) ?? ''
    }
    out.set(`data/${name}`, JSON.stringify(games))
    chunks.push({ count, main: addPack(out, main), desc: addPack(out, desc) })
  }
  if (total !== index.total_games) {
    throw new Error(`catalog-data: chunks hold ${total} games, index.json says ${index.total_games}`)
  }
  out.set('data/index.json', JSON.stringify(index))
  out.set('data/count_history.json', JSON.stringify(src.history))
  out.set('data/deleted_games.json', JSON.stringify(src.deleted))
  out.set('data/urls.json', JSON.stringify(urls))

  const manifest: PackManifest = {
    v: PACK_VERSION,
    total_games: index.total_games,
    last_updated: index.last_updated,
    chunks,
    deleted: addPack(out, rowsOf(src.deleted, 'deleted_games.json')),
    history: addPack(out, rowsOf(src.history, 'count_history.json')),
  }
  out.set(`data/pack/${MANIFEST_FILE}`, JSON.stringify(manifest))

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

/** Changes whenever a source file does; packing at level 9 on every dev request would be slow. */
function sourceStamp(repoRoot: string): string {
  const dataDir = path.join(repoRoot, 'data_game')
  const files = [
    ...fs.readdirSync(dataDir).filter((f) => f.endsWith('.json')).map((f) => path.join(dataDir, f)),
    path.join(repoRoot, 'scripts', 'deleted_games.json'),
  ]
  return files
    .map((f) => {
      const s = fs.statSync(f)
      return `${f}:${s.mtimeMs}:${s.size}`
    })
    .join('|')
}

function contentType(file: string): string {
  if (file.endsWith('.bin')) return 'application/octet-stream'
  if (file.endsWith('.xml')) return 'application/xml'
  return 'application/json'
}

export function catalogData(repoRoot: string): Plugin {
  return {
    name: 'catalog-data',
    configureServer(server) {
      let cached: { stamp: string; files: CatalogFiles } | undefined
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        if (!url.startsWith('/data/') && url !== '/sitemap.xml') return next()
        try {
          const stamp = sourceStamp(repoRoot)
          if (cached?.stamp !== stamp) cached = { stamp, files: buildCatalogFiles(readCatalogSources(repoRoot)) }
          const body = cached.files.get(url.slice(1))
          if (body === undefined) return next()
          res.setHeader('Content-Type', contentType(url))
          res.end(body)
        } catch (e) {
          next(e)
        }
      })
    },
    generateBundle() {
      for (const [fileName, source] of buildCatalogFiles(readCatalogSources(repoRoot))) {
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
