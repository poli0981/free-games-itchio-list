import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleLegacyData, TAURI_ORIGINS } from './legacy-data'

const ORIGIN = 'https://freeitchgames.win'
const INDEX = JSON.stringify({ total_games: 1 })

function assets() {
  return {
    fetch: vi.fn(async (req: Request) => {
      const { pathname } = new URL(req.url)
      if (pathname !== '/data/index.json') return new Response(null, { status: 404 })
      if (req.headers.get('if-none-match') === '"abc"') return new Response(null, { status: 304, headers: { etag: '"abc"' } })
      return new Response(INDEX, {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'public, max-age=60, stale-while-revalidate=600',
          'access-control-allow-origin': '*',
          etag: '"abc"',
        },
      })
    }),
  }
}

function request(path: string, init: RequestInit & { origin?: string } = {}) {
  const headers = new Headers(init.headers)
  if (init.origin) headers.set('origin', init.origin)
  return new Request(new URL(path, ORIGIN), { method: init.method, headers })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('handleLegacyData', () => {
  it('answers browsers and other sites with 410 and a link to the repository', async () => {
    for (const origin of [undefined, 'https://example.com', 'null']) {
      const a = assets()
      const res = await handleLegacyData(request('/data/game_info_001.json', { origin }), a)
      expect(res.status).toBe(410)
      expect(res.headers.get('access-control-allow-origin')).toBe('*')
      expect(res.headers.get('vary')).toContain('Origin')
      expect(res.headers.get('cache-control')).toBe('no-store')
      expect(await res.json()).toMatchObject({
        error: 'gone',
        data: 'https://github.com/poli0981/free-games-itchio-list/tree/main/data_game',
      })
      expect(a.fetch).not.toHaveBeenCalled()
    }
  })

  it('passes the file through for the apps, with their headers and Vary: Origin', async () => {
    for (const origin of TAURI_ORIGINS) {
      const res = await handleLegacyData(request('/data/index.json', { origin }), assets())
      expect(res.status).toBe(200)
      expect(await res.text()).toBe(INDEX)
      expect(res.headers.get('access-control-allow-origin')).toBe('*')
      expect(res.headers.get('cache-control')).toBe('public, max-age=60, stale-while-revalidate=600')
      expect(res.headers.get('vary')).toContain('Origin')
    }
  })

  it('keeps revalidation working for the apps', async () => {
    const res = await handleLegacyData(
      request('/data/index.json', { origin: 'http://tauri.localhost', headers: { 'if-none-match': '"abc"' } }),
      assets(),
    )
    expect(res.status).toBe(304)
  })

  it('answers a missing file with a JSON 404 the apps can read', async () => {
    const res = await handleLegacyData(request('/data/game_info_999.json', { origin: 'tauri://localhost' }), assets())
    expect(res.status).toBe(404)
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
    expect(await res.json()).toEqual({ error: 'not_found' })
  })

  it('allows only GET and HEAD', async () => {
    const post = await handleLegacyData(request('/data/index.json', { method: 'POST', origin: 'tauri://localhost' }), assets())
    expect(post.status).toBe(405)
    expect(post.headers.get('allow')).toBe('GET, HEAD')
    const head = await handleLegacyData(request('/data/index.json', { method: 'HEAD' }), assets())
    expect(head.status).toBe(410)
  })
})
