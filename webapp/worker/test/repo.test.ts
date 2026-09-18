import { exportPKCS8, generateKeyPair } from 'jose'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { dumps } from '../catalog'
import { resetTokenCache, type GitHubEnv } from '../github'
import { editCatalog, queueForIngest } from '../repo'

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

  it('edits one field and makes no commit when nothing changes', async () => {
    const commits = fakeGitHub(files)
    await editCatalog(env, new Map([['https://dev.itch.io/a', { nsfw: 'Yes' }]]), [])
    expect(Object.keys(commits[0].additions)).toEqual(['data_game/game_info_001.json', 'data_game/index.json'])
    const unchanged = await editCatalog(env, new Map([['https://dev.itch.io/a', { nsfw: 'No' }]]), [])
    expect(unchanged.sha).toBeNull()
    expect(commits).toHaveLength(1)
  })
})

describe('queueForIngest', () => {
  it('appends to temp_link.json and, when unblocking, prunes the deleted log', async () => {
    const commits = fakeGitHub({
      'scripts/temp_link.json': dumps(['https://dev.itch.io/queued']),
      'scripts/deleted_games.json': dumps([{ url: 'https://dev.itch.io/b', name: 'b', reason: 'r', deleted_at: 't' }]),
    })
    const { sha, added } = await queueForIngest(env, ['https://dev.itch.io/queued', 'https://dev.itch.io/b'], ['https://dev.itch.io/b'])
    expect(sha).toBe('new-sha')
    expect(added).toEqual(['https://dev.itch.io/b'])
    expect(JSON.parse(commits[0].additions['scripts/temp_link.json'])).toEqual(['https://dev.itch.io/queued', 'https://dev.itch.io/b'])
    expect(JSON.parse(commits[0].additions['scripts/deleted_games.json'])).toEqual([])
  })

  it('makes no commit when everything is already queued', async () => {
    const commits = fakeGitHub({ 'scripts/temp_link.json': dumps(['https://dev.itch.io/queued']) })
    expect((await queueForIngest(env, ['https://dev.itch.io/queued'], [])).sha).toBeNull()
    expect(commits).toHaveLength(0)
  })
})
