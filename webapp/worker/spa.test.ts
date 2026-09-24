import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDataCache } from './data'
import { handleMiss, type PageGate } from './spa'

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

async function miss(path: string, init: RequestInit = {}, binding = assets(), gate?: PageGate) {
  const url = new URL(path, ORIGIN)
  return handleMiss(new Request(url, init), url, binding, gate)
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

describe('with the verification gate', () => {
  const VERIFY_PAGE = '<!doctype html><title>verify</title>'
  const blocking = () => vi.fn<PageGate>(async () => new Response(VERIFY_PAGE, { headers: { 'cache-control': 'no-store' } }))
  const passing = () => vi.fn<PageGate>(async () => null)

  it('answers app pages with the verification page, without fetching the shell', async () => {
    const binding = assets()
    const res = await miss('/games', { headers: { 'if-none-match': '"shell-etag"' } }, binding, blocking())
    expect(res.status).toBe(200) // never a 304 for a cached shell
    expect(await res.text()).toBe(VERIFY_PAGE)
    expect(binding.fetch).not.toHaveBeenCalled()
  })

  it('does not consult it for missing files, /data (CORS kept), renamed routes or other methods', async () => {
    const gate = blocking()
    expect((await miss('/assets/x-OLD.js', {}, assets(), gate)).status).toBe(404)
    const data = await miss('/data/nope.json', {}, assets(), gate)
    expect([data.status, data.headers.get('access-control-allow-origin')]).toEqual([404, '*'])
    expect((await miss('/deleted', {}, assets(), gate)).status).toBe(301)
    expect((await miss('/games', { method: 'POST' }, assets(), gate)).status).toBe(405)
    expect(gate).not.toHaveBeenCalled()
  })

  it('serves the shell (or the 404 shell) once the request has passed', async () => {
    expect(await (await miss('/charts', {}, assets(), passing())).text()).toBe(SHELL)
    const unknown = await miss('/unknown', {}, assets(), passing())
    expect([unknown.status, await unknown.text()]).toEqual([404, SHELL])
  })
})
