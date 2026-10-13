import { exportPKCS8, generateKeyPair } from 'jose'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { dumps } from '../catalog'
import { resetTokenCache, type GitHubEnv } from '../github'
import { editCatalog, queueForIngest, readIngestView, resetIngestViewCache } from '../repo'

let env: GitHubEnv

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true })
  env = {
    GITHUB_REPO: 'owner/repo',
    GH_APP_ID: '1',
    GH_APP_INSTALLATION_ID: '2',
    GH_APP_PRIVATE_KEY: await exportPKCS8(pair.privateKey),
  }
})

const game = (slug: string, extra: Record<string, unknown> = {}) => ({
  url: `https://dev.itch.io/${slug}`,
  name: slug,
  thumbnail: `https://img.itch.zone/aW1n/original/${slug}.png`,
  nsfw: 'No',
  notes: '',
  safe_virus: '?',
  ...extra,
})

/** A tiny in-memory GitHub: files at one head, captures the commit mutation. */
function fakeGitHub(files: Record<string, string>) {
  const commits: { headline: string; body?: string; additions: Record<string, string>; deletions: string[] }[] = []
  vi.stubGlobal('fetch', async (input: string, init: RequestInit = {}) => {
    const url = new URL(String(input))
    const path = url.pathname
    if (path.endsWith('/access_tokens')) {
      return Response.json({ token: 't', expires_at: new Date(Date.now() + 3_600_000).toISOString() })
    }
    if (path === '/repos/owner/repo/git/ref/heads/main') return Response.json({ object: { sha: 'head1' } })
    if (path === '/graphql') {
      const input = JSON.parse(String(init.body)).variables.input
      const decode = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
      commits.push({
        headline: input.message.headline,
        body: input.message.body,
        additions: Object.fromEntries(input.fileChanges.additions.map((a: { path: string; contents: string }) => [a.path, decode(a.contents)])),
        deletions: input.fileChanges.deletions.map((d: { path: string }) => d.path),
      })
      return Response.json({ data: { createCommitOnBranch: { commit: { oid: 'new-sha' } } } })
    }
    const file = path.replace('/repos/owner/repo/contents/', '')
    if (url.searchParams.get('ref') !== 'head1') return new Response(null, { status: 404 })
    if (file === 'data_game') {
      return Response.json(
        Object.keys(files)
          .filter((f) => f.startsWith('data_game/'))
          .map((f) => ({ name: f.slice('data_game/'.length), type: 'file' })),
      )
    }
    return file in files ? new Response(files[file]) : new Response(null, { status: 404 })
  })
  return commits
}

beforeEach(() => resetTokenCache())
afterEach(() => vi.unstubAllGlobals())

describe('editCatalog', () => {
  const chunk = [game('a'), game('b'), game('c')]
  const files = {
    'data_game/game_info_001.json': dumps(chunk),
    'data_game/index.json': dumps({
      total_games: 3,
      max_per_file: 500,
      last_updated: '2026-09-01T00:00:00Z',
      files: [{ name: 'game_info_001.json', count: 3 }],
    }),
    'data_game/count_history.json': dumps([{ date: '2026-09-01', total: 3 }]),
    'scripts/deleted_games.json': dumps([]),
  }

  it('removes a game in one commit: chunk, index, history, deleted log', async () => {
    const commits = fakeGitHub(files)
    const result = await editCatalog(env, new Map(), [{ url: 'https://dev.itch.io/b', reason: 'Takedown request' }], () => new Date('2026-09-18T12:00:00Z'))
    expect(result).toEqual({
      sha: 'new-sha',
      summary: { edited: 0, removed: 1 },
      edited: [],
      unchanged: [],
      removed: ['https://dev.itch.io/b'],
      missing: [],
      thumbnails: ['https://img.itch.zone/aW1n/original/b.png'],
    })
    const [c] = commits
    expect(Object.keys(c.additions).sort()).toEqual([
      'data_game/count_history.json',
      'data_game/game_info_001.json',
      'data_game/index.json',
      'scripts/deleted_games.json',
    ])
    expect(JSON.parse(c.additions['data_game/game_info_001.json']).map((g: { url: string }) => g.url)).toEqual([
      'https://dev.itch.io/a',
      'https://dev.itch.io/c',
    ])
    expect(JSON.parse(c.additions['scripts/deleted_games.json'])).toEqual([
      { url: 'https://dev.itch.io/b', name: 'b', reason: 'Takedown request', deleted_at: '2026-09-18T12:00:00Z' },
    ])
    expect(`${c.headline}\n${c.body}`).not.toMatch(/@/) // never the maintainer's email
  })

  it('removes several games in one commit and reports the ones not in the catalog', async () => {
    const commits = fakeGitHub(files)
    const result = await editCatalog(env, new Map(), [
      { url: 'https://dev.itch.io/a', reason: 'Not a game' },
      { url: 'https://dev.itch.io/c', reason: 'Not a game' },
      { url: 'https://dev.itch.io/zzz', reason: 'Not a game' },
    ])
    expect([result.removed, result.missing]).toEqual([
      ['https://dev.itch.io/a', 'https://dev.itch.io/c'],
      ['https://dev.itch.io/zzz'],
    ])
    expect(commits).toHaveLength(1)
    expect(commits[0].headline).toBe('Catalog: remove 2 [admin]')
    expect(commits[0].body).not.toContain('zzz')
  })

  it('edits one field and makes no commit when nothing changes', async () => {
    const commits = fakeGitHub(files)
    await editCatalog(env, new Map([['https://dev.itch.io/a', { nsfw: 'Yes' }]]), [])
    expect(Object.keys(commits[0].additions)).toEqual(['data_game/game_info_001.json', 'data_game/index.json'])
    const unchanged = await editCatalog(env, new Map([['https://dev.itch.io/a', { nsfw: 'No' }]]), [])
    expect(unchanged.sha).toBeNull()
    expect(unchanged.unchanged).toEqual(['https://dev.itch.io/a'])
    expect(commits).toHaveLength(1)
  })
})

describe('queueForIngest', () => {
  it('appends to temp_link.json and, when unblocking, allow-lists the game (the log entry stays)', async () => {
    const commits = fakeGitHub({
      'scripts/temp_link.json': dumps(['https://dev.itch.io/queued']),
      'scripts/deleted_games.json': dumps([{ url: 'https://dev.itch.io/b', name: 'b', reason: 'r', deleted_at: 't' }]),
    })
    const { sha, added } = await queueForIngest(env, ['https://dev.itch.io/queued', 'https://dev.itch.io/b'], ['https://dev.itch.io/b'])
    expect(sha).toBe('new-sha')
    expect(added).toEqual(['https://dev.itch.io/b'])
    expect(JSON.parse(commits[0].additions['scripts/temp_link.json'])).toEqual(['https://dev.itch.io/queued', 'https://dev.itch.io/b'])
    expect(JSON.parse(commits[0].additions['scripts/state/unblocked.json'])).toEqual(['https://dev.itch.io/b'])
    expect(commits[0].additions['scripts/deleted_games.json']).toBeUndefined()
    // The headline counts what was really queued, and the body lists only that.
    expect(commits[0].headline).toBe('Queue 1 game(s) for ingest [admin]')
    expect(commits[0].body).toBe('Via the admin page.\n\nhttps://dev.itch.io/b')
  })

  it('tags commits made by the automatic rules', async () => {
    const commits = fakeGitHub({ 'scripts/temp_link.json': dumps([]) })
    await queueForIngest(env, ['https://dev.itch.io/x', 'https://dev.itch.io/y'], [], 'auto')
    expect(commits[0].headline).toBe('Queue 2 game(s) for ingest [auto]')
    expect(commits[0].body).toMatch(/^By the admin page's automatic rules/)
  })

  it('names an unblock-only commit for what it does', async () => {
    const commits = fakeGitHub({ 'scripts/temp_link.json': dumps(['https://dev.itch.io/b']) })
    await queueForIngest(env, ['https://dev.itch.io/b'], ['https://dev.itch.io/b'])
    expect(commits[0].headline).toBe('Unblock 1 removed game(s) [admin]')
  })

  it('makes no commit when everything is already queued', async () => {
    const commits = fakeGitHub({ 'scripts/temp_link.json': dumps(['https://dev.itch.io/queued']) })
    expect((await queueForIngest(env, ['https://dev.itch.io/queued'], [])).sha).toBeNull()
    expect(commits).toHaveLength(0)
  })
})

describe('readIngestView', () => {
  it('reads the queue, attempts and outcomes at head, once per head', async () => {
    resetIngestViewCache()
    fakeGitHub({
      'scripts/temp_link.json': dumps(['https://dev.itch.io/q']),
      'scripts/state/ingest_state.json': JSON.stringify({
        'https://dev.itch.io/q': { attempts: 2, last_error: 'error: HTTP 503' },
      }),
      'scripts/state/ingest_outcomes.json': JSON.stringify({
        'https://dev.itch.io/p': { outcome: 'paid', at: '2026-10-01T00:00:00Z' },
      }),
    })
    const calls = vi.spyOn(globalThis, 'fetch')
    const view = await readIngestView(env)
    expect(view.head).toBe('head1')
    expect([...view.queued]).toEqual(['https://dev.itch.io/q'])
    expect(view.attempts.get('https://dev.itch.io/q')).toEqual({ attempts: 2, error: 'error: HTTP 503' })
    expect(view.outcomes.get('https://dev.itch.io/p')).toEqual({ outcome: 'paid', at: '2026-10-01T00:00:00Z' })
    const before = calls.mock.calls.length
    expect(await readIngestView(env)).toBe(view) // same head: only the ref is read
    expect(calls.mock.calls.length - before).toBe(1)
  })
})
