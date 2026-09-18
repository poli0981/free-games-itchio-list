/** Regressions from the Phase 4 review (see the commit that added this file). */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { serveAdminApp, handleAdminApi } from '../admin'
import { applyAdminChange, dumps, upsertCountHistory } from '../catalog'
import type { WorkerEnv } from '../env'
import { readBodyCapped, readJson } from '../http'
import { classify, QueueStore } from '../queue'
import { testDb } from './d1'

describe('request bodies', () => {
  it('stops reading a body without Content-Length once it passes the limit', async () => {
    let pulled = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1024
        controller.enqueue(new Uint8Array(1024))
        if (pulled > 1_000_000) controller.close()
      },
    })
    const request = new Request('https://x/api', { method: 'POST', body, duplex: 'half' } as RequestInit)
    await expect(readBodyCapped(request, 4096)).rejects.toMatchObject({ status: 413 })
    expect(pulled).toBeLessThan(16 * 1024)
  })

  it('accepts only the application/json media type', async () => {
    const post = (type: string) =>
      new Request('https://x/api', { method: 'POST', headers: { 'content-type': type }, body: '{}' })
    await expect(readJson(post('application/json; charset=utf-8'), 100)).resolves.toEqual({})
    await expect(readJson(post('text/plain; application/json'), 100)).rejects.toMatchObject({ status: 415 })
  })
})

describe('local admin bypass', () => {
  const env = { DEV_ADMIN_EMAIL: 'dev@localhost', SITE_ORIGIN: 'https://freeitchgames.win' } as unknown as WorkerEnv

  it('refuses cross-origin writes even on localhost', async () => {
    const url = new URL('http://localhost:8787/api/admin/queue/decide')
    const request = new Request(url, {
      method: 'POST',
      headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'reject', urls: ['https://dev.itch.io/a'] }),
    })
    expect((await handleAdminApi(request, url, env, null)).status).toBe(403)
  })

  it('still serves reads and same-origin writes locally', async () => {
    const shellUrl = new URL('http://localhost:8787/admin/')
    const assets = { fetch: async () => new Response('<html></html>') } as unknown as Fetcher
    expect((await serveAdminApp(new Request(shellUrl), shellUrl, { ...env, ASSETS: assets } as WorkerEnv)).status).toBe(200)
  })
})

describe('count history', () => {
  it('does not change the caller rows and rewrites today when it already has a row', () => {
    const history = [
      { date: '2026-09-17', total: 2 },
      { date: '2026-09-18', total: 3 },
    ]
    const before = JSON.stringify(history)
    const out = upsertCountHistory(history, 2, new Date('2026-09-18T10:00:00Z'))
    expect(JSON.stringify(history)).toBe(before)
    expect(out.at(-1)).toEqual({ date: '2026-09-18', total: 2 })

    const games = ['a', 'b', 'c'].map((s) => ({ url: `https://dev.itch.io/${s}`, name: s }))
    const change = applyAdminChange(
      {
        chunks: [games],
        index: { total_games: 3, max_per_file: 500, last_updated: 'x', files: [{ name: 'game_info_001.json', count: 3 }] },
        history,
        deleted: [],
      },
      new Map(),
      [{ url: 'https://dev.itch.io/a', reason: 'r' }],
      new Date('2026-09-18T10:00:00Z'),
    )
    expect(change.writes.get('data_game/count_history.json')).toBe(
      dumps([
        { date: '2026-09-17', total: 2 },
        { date: '2026-09-18', total: 2 },
      ]),
    )
  })
})

describe('games that come back after being ingested and removed', () => {
  let db: D1Database
  let dispose: () => Promise<void>
  beforeAll(async () => {
    ;({ db, dispose } = await testDb())
  }, 60_000)
  afterAll(() => dispose())

  it('are reviewed again, flagged, instead of being blocked for good', async () => {
    const url = 'https://dev.itch.io/back'
    const deleted = new Map([[url, { reason: 'Game became paid', deleted_at: '2026-09-01T00:00:00Z' }]])
    const [result] = classify([url], { catalog: new Set(), deleted, known: new Map([[url, 'ingested']]) })
    expect(result.outcome).toBe('previously_deleted')
    expect(result.store).toBe(true)
    // Still in the catalog: still a duplicate, not reopened.
    const listed = classify([url], { catalog: new Set([url]), deleted: new Map(), known: new Map([[url, 'ingested']]) })
    expect(listed[0].outcome).toBe('duplicate_catalog')

    const store = new QueueStore(db)
    await store.insert([{ url, source: 'rss' }])
    await store.setStatus([url], 'ingested', 'reconcile')
    await store.insert([{ url, source: 'rss', flags: ['previously_deleted'] }])
    const [row] = await store.get([url])
    expect(row.status).toBe('pending')
    expect(JSON.parse(row.flags)).toEqual(['previously_deleted'])
  })
})
