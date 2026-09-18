/**
 * GET /img/<width>/<path on img.itch.zone> — resized game covers.
 *
 * Covers are stored in the catalog as full-size itch.io originals (often
 * 1–3 MB, some animated GIFs) but shown at 64–320 px. This route serves a
 * WebP rendered once per (image, width) by Cloudflare Image Transformations
 * and kept in R2, so the monthly unique-transformation quota is spent only
 * on new images. Lookup order: edge cache → R2 → transform (→ R2 + cache).
 *
 * Safety: the upstream host is fixed (no open proxy / SSRF), the path must
 * match a thumbnail that is in the catalog (/data/urls.json), and only two
 * widths exist. When a transform fails (quota error 9422, bad source) the
 * original is streamed through with a short cache instead of being stored.
 */
import { SECURITY_HEADERS } from './http'

const ITCH_IMG = 'https://img.itch.zone/'
const WIDTHS = new Set([160, 640])
const SEGMENT = /^[A-Za-z0-9%+=_.-]{1,200}$/
const YEAR = 'public, max-age=31536000, immutable'
const DAY = 'public, max-age=86400'

export interface ImgDeps {
  /** Static assets (reads /data/urls.json). */
  assets: Pick<Fetcher, 'fetch'>
  bucket: Pick<R2Bucket, 'get' | 'put'>
  /** Edge cache; absent in tests / local dev. */
  cache?: Pick<Cache, 'match' | 'put'>
  fetch: typeof fetch
  waitUntil: (p: Promise<unknown>) => void
}

export interface ParsedImgPath {
  width: number
  upstream: string
}

/** Validate `/img/<w>/<a>/<b>/<file>`; keeps percent-encoding verbatim. */
export function parseImgPath(pathname: string): ParsedImgPath | null {
  const parts = pathname.split('/').slice(2) // ['', 'img', w, ...rest]
  if (parts.length < 2) return null
  const width = Number(parts[0])
  const rest = parts.slice(1)
  if (!WIDTHS.has(width)) return null
  if (rest.length < 2 || rest.length > 4) return null
  if (!rest.every((s) => SEGMENT.test(s) && s !== '.' && s !== '..')) return null
  return { width, upstream: ITCH_IMG + rest.join('/') }
}

export async function r2Key(width: number, upstream: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(upstream))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `w${width}/${hex}.webp`
}

// Catalog thumbnails, loaded once per isolate from the static assets.
let allowList: Promise<Set<string>> | undefined

export function resetAllowList(): void {
  allowList = undefined
}

function loadAllowList(assets: ImgDeps['assets'], origin: string): Promise<Set<string>> {
  allowList ??= assets
    .fetch(new Request(`${origin}/data/urls.json`))
    .then((res) => {
      if (!res.ok) throw new Error(`urls.json: ${res.status}`)
      return res.json() as Promise<Record<string, string>>
    })
    .then((urls) => new Set(Object.values(urls)))
    .catch((e: unknown) => {
      allowList = undefined // retry on the next request
      throw e
    })
  return allowList
}

function imageResponse(body: BodyInit | null, type: string, cacheControl: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': type,
      'Cache-Control': cacheControl,
      'Content-Security-Policy': "default-src 'none'; sandbox",
      ...SECURITY_HEADERS,
    },
  })
}

function plain(status: number, cacheControl = 'public, max-age=300'): Response {
  return new Response(null, { status, headers: { 'Cache-Control': cacheControl, ...SECURITY_HEADERS } })
}

export async function handleImg(request: Request, url: URL, deps: ImgDeps): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return plain(405, 'no-store')
  // Cheap hotlink protection: other sites can't embed our resized copies.
  if (request.headers.get('sec-fetch-site') === 'cross-site') return plain(403, 'no-store')

  const parsed = parseImgPath(url.pathname)
  if (!parsed) return plain(400)
  const { width, upstream } = parsed

  let allowed: Set<string>
  try {
    allowed = await loadAllowList(deps.assets, url.origin)
  } catch {
    return plain(503, 'no-store')
  }
  if (!allowed.has(upstream)) return plain(404)

  const cacheKey = new Request(`${url.origin}${url.pathname}`)
  const cached = await deps.cache?.match(cacheKey)
  if (cached) return cached

  const key = await r2Key(width, upstream)
  const stored = await deps.bucket.get(key)
  if (stored) {
    const res = imageResponse(stored.body, 'image/webp', YEAR)
    if (deps.cache) deps.waitUntil(deps.cache.put(cacheKey, res.clone()))
    return res
  }

  const transformed = await deps.fetch(upstream, {
    cf: { image: { width, fit: 'scale-down', format: 'webp', quality: 78, anim: false } },
  } as RequestInit)
  if (transformed.ok && transformed.headers.get('content-type') === 'image/webp') {
    const bytes = await transformed.arrayBuffer()
    const res = imageResponse(bytes, 'image/webp', YEAR)
    deps.waitUntil(deps.bucket.put(key, bytes, { httpMetadata: { contentType: 'image/webp' } }))
    if (deps.cache) deps.waitUntil(deps.cache.put(cacheKey, res.clone()))
    return res
  }

  // Transformation unavailable (quota 9422, unsupported source…): stream the
  // original, cache it briefly at the edge, do not store it.
  const original = await deps.fetch(upstream, { cf: { cacheEverything: true, cacheTtl: 86400 } } as RequestInit)
  // itch.zone answers 403 for some broken originals: treat like a missing image.
  if ([403, 404, 410].includes(original.status)) return plain(404, DAY)
  const type = original.headers.get('content-type') ?? ''
  if (!original.ok || !type.startsWith('image/') || type.includes('svg')) return plain(502, 'no-store')
  return imageResponse(request.method === 'HEAD' ? null : original.body, type, DAY)
}
