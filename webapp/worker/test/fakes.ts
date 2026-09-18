/** Shared fakes for the Worker handler tests. */
import type { DataSource } from '../data'

export const ORIGIN = 'https://freeitchgames.win'

/** Static assets holding a catalog (/data/urls.json) and a deleted log. */
export function fakeData(
  catalog: string[] = [],
  deleted: { url: string; reason?: string; deleted_at?: string }[] = [],
): DataSource {
  const urls = Object.fromEntries(catalog.map((u) => [u, 'https://img.itch.zone/x/original/y.png']))
  const log = deleted.map((d) => ({
    url: d.url,
    name: 'N',
    reason: d.reason ?? 'Game became paid',
    deleted_at: d.deleted_at ?? '2026-06-19T03:00:00Z',
  }))
  return {
    origin: ORIGIN,
    assets: {
      fetch: async (input: RequestInfo | URL) => {
        const path = new URL(input instanceof Request ? input.url : String(input)).pathname
        if (path === '/data/urls.json') return Response.json(urls)
        if (path === '/data/deleted_games.json') return Response.json(log)
        return new Response(null, { status: 404 })
      },
    } as unknown as Fetcher,
  }
}

/** A rate limiter that allows `allowed` calls, then refuses. */
export function fakeLimiter(allowed = Infinity) {
  let calls = 0
  const keys: string[] = []
  return {
    keys,
    limit: async ({ key }: { key: string }) => {
      keys.push(key)
      calls += 1
      return { success: calls <= allowed }
    },
  }
}
