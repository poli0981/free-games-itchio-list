import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDataCache } from './data'
import { handleMiss } from './spa'

const ORIGIN = 'https://freeitchgames.win'
const SHELL = '<!doctype html><div id="root"></div>'

function assets(urls: Record<string, string> | 'down' = { 'https://dev.itch.io/cookies': 'https://img.itch.zone/a/b/c.png' }) {
  return {
    fetch: vi.fn(async (req: Request) => {
      const { pathname } = new URL(req.url)
      if (pathname === '/') return new Response(SHELL, { headers: { 'content-type': 'text/html' } })
      if (pathname === '/data/urls.json') {
        return urls === 'down' ? new Response(null, { status: 500 }) : Response.json(urls)
      }
      return new Response(null, { status: 404 })
    }),
  } as unknown as Fetcher
}

async function miss(path: string, init: RequestInit = {}, binding = assets()) {
  const url = new URL(path, ORIGIN)
  return handleMiss(new Request(url, init), url, binding)
}

beforeEach(() => resetDataCache())

describe('handleMiss', () => {
  it.each(['/assets/charts-OLDHASH.js', '/data/game_info_999.json', '/nope.png', '/games/x.json'])(
    'answers a missing file %s with a real 404, never the app shell',
    async (path) => {
      const res = await miss(path)
      expect(res.status).toBe(404)
      expect(res.headers.get('content-type')).toContain('application/json')
      expect(res.headers.get('cache-control')).toBe('no-store')
    },
  )

  it('keeps CORS on /data misses for the desktop and Android apps', async () => {
    const res = await miss('/data/nope.json')
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })

  it.each(['/', '/games', '/games/', '/charts', '/about', '/errors/404', '/games/dev-itch-io-cookies'])(
    'serves the app shell for route %s',
    async (path) => {
      const res = await miss(path)
      expect(res.status).toBe(200)
      expect(await res.text()).toBe(SHELL)
    },
  )

  it.each(['/unknown', '/games/not-in-catalog', '/add'])('serves the shell with 404 for %s', async (path) => {
    const res = await miss(path)
    expect(res.status).toBe(404)
    expect(await res.text()).toBe(SHELL)
  })

  it('does not turn game pages into 404s when the catalog cannot be read', async () => {
    expect((await miss('/games/whatever', {}, assets('down'))).status).toBe(200)
  })

  it('rejects other methods', async () => {
    expect((await miss('/games', { method: 'POST' })).status).toBe(405)
  })
})

describe('renamed routes', () => {
  it('permanently redirects /deleted to /removed', async () => {
    const res = await miss('/deleted?x=1')
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe(`${ORIGIN}/removed?x=1`)
    expect((await miss('/removed')).status).toBe(200)
  })
})
