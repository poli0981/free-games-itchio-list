import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleImg, parseImgPath, r2Key, resetAllowList, type ImgDeps } from './img'

const ORIGIN = 'https://freeitchgames.win'
const PATH = 'aW1nLzI0OTQ3OTQzLnBuZw==/original/3wlrR0.png'
const UPSTREAM = `https://img.itch.zone/${PATH}`

function makeDeps(overrides: Partial<ImgDeps> = {}) {
  const store = new Map<string, ArrayBuffer>()
  const waits: Promise<unknown>[] = []
  const deps: ImgDeps = {
    assets: {
      fetch: vi.fn(async () => Response.json({ 'https://dev.itch.io/game': UPSTREAM })),
    } as unknown as ImgDeps['assets'],
    bucket: {
      get: vi.fn(async (key: string) =>
        store.has(key) ? ({ body: store.get(key) } as unknown as R2ObjectBody) : null,
      ),
      put: vi.fn(async (key: string, value: ArrayBuffer) => {
        store.set(key, value)
        return null
      }),
    } as unknown as ImgDeps['bucket'],
    fetch: vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/webp' } })),
    waitUntil: (p) => void waits.push(p),
    ...overrides,
  }
  return { deps, store, settle: () => Promise.all(waits) }
}

function get(path: string, headers: Record<string, string> = {}) {
  const url = new URL(path, ORIGIN)
  return { request: new Request(url, { headers }), url }
}

beforeEach(() => resetAllowList())

describe('parseImgPath', () => {
  it('accepts catalog-shaped paths and keeps encoding', () => {
    expect(parseImgPath(`/img/160/${PATH}`)).toEqual({ width: 160, upstream: UPSTREAM })
    expect(parseImgPath('/img/640/abc%2Fd==/347x500/x%2By.gif')?.upstream).toBe(
      'https://img.itch.zone/abc%2Fd==/347x500/x%2By.gif',
    )
  })

  it.each([
    '/img/100/a/original/b.png', // width not offered
    '/img/160/a', // too few segments
    '/img/160/../original/b.png',
    '/img/160/a/original/b.png?x',
    '/img/160/a/orig inal/b.png',
    '/img/160/a/b/c/d/e.png', // too many segments
  ])('rejects %s', (path) => {
    expect(parseImgPath(path)).toBeNull()
  })
})

describe('r2Key', () => {
  it('is deterministic per width + upstream', async () => {
    const a = await r2Key(160, UPSTREAM)
    expect(a).toMatch(/^w160\/[0-9a-f]{64}\.webp$/)
    expect(await r2Key(160, UPSTREAM)).toBe(a)
    expect(await r2Key(640, UPSTREAM)).not.toBe(a)
  })
})

describe('handleImg', () => {
  it('rejects bad methods, cross-site embeds and bad paths', async () => {
    const { deps } = makeDeps()
    const post = new Request(`${ORIGIN}/img/160/${PATH}`, { method: 'POST' })
    expect((await handleImg(post, new URL(post.url), deps)).status).toBe(405)
    const cross = get(`/img/160/${PATH}`, { 'sec-fetch-site': 'cross-site' })
    expect((await handleImg(cross.request, cross.url, deps)).status).toBe(403)
    const bad = get('/img/999/a/b/c.png')
    expect((await handleImg(bad.request, bad.url, deps)).status).toBe(400)
  })

  it('only serves images that are in the catalog', async () => {
    const { deps } = makeDeps()
    const other = get('/img/160/other/original/x.png')
    expect((await handleImg(other.request, other.url, deps)).status).toBe(404)
    expect(deps.fetch).not.toHaveBeenCalled()
  })

  it('transforms once, stores in R2, then serves from R2', async () => {
    const { deps, store, settle } = makeDeps()
    const first = get(`/img/160/${PATH}`)
    const res = await handleImg(first.request, first.url, deps)
    await settle()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/webp')
    expect(res.headers.get('cache-control')).toContain('immutable')
    expect(store.has(await r2Key(160, UPSTREAM))).toBe(true)
    const [, init] = vi.mocked(deps.fetch).mock.calls[0]
    expect((init as { cf: { image: { width: number } } }).cf.image.width).toBe(160)

    const again = await handleImg(first.request, first.url, deps)
    expect(again.status).toBe(200)
    expect(deps.fetch).toHaveBeenCalledTimes(1)
  })

  it('falls back to the original when the transform fails, without storing it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('quota', { status: 403 }))
      .mockResolvedValueOnce(new Response('gif', { headers: { 'content-type': 'image/gif' } }))
    const { deps, store } = makeDeps({ fetch: fetchMock as unknown as typeof fetch })
    const req = get(`/img/640/${PATH}`)
    const res = await handleImg(req.request, req.url, deps)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/gif')
    expect(res.headers.get('cache-control')).toBe('public, max-age=86400')
    expect(store.size).toBe(0)
  })

  it('maps a 403 from itch.zone (broken original) to a cacheable 404', async () => {
    const forbidden = vi.fn().mockResolvedValue(new Response(null, { status: 403 }))
    const { deps } = makeDeps({ fetch: forbidden as unknown as typeof fetch })
    const req = get(`/img/160/${PATH}`)
    const res = await handleImg(req.request, req.url, deps)
    expect(res.status).toBe(404)
    expect(res.headers.get('cache-control')).toBe('public, max-age=86400')
  })

  it('passes through upstream 404s and refuses non-images', async () => {
    const notFound = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
    const a = makeDeps({ fetch: notFound as unknown as typeof fetch })
    const req = get(`/img/160/${PATH}`)
    expect((await handleImg(req.request, req.url, a.deps)).status).toBe(404)

    const html = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response('<html>', { headers: { 'content-type': 'text/html' } }))
    const b = makeDeps({ fetch: html as unknown as typeof fetch })
    expect((await handleImg(req.request, req.url, b.deps)).status).toBe(502)
  })

  it('returns 503 when the allow-list is unavailable and retries later', async () => {
    const assetsFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ u: UPSTREAM }))
    const { deps } = makeDeps({ assets: { fetch: assetsFetch } as unknown as ImgDeps['assets'] })
    const req = get(`/img/160/${PATH}`)
    expect((await handleImg(req.request, req.url, deps)).status).toBe(503)
    expect((await handleImg(req.request, req.url, deps)).status).toBe(200)
  })
})
