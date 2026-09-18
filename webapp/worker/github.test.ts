import { exportPKCS8, generateKeyPair, jwtVerify } from 'jose'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConflictError,
  commit,
  commitWithRetry,
  readFile,
  resetTokenCache,
  utf8ToBase64,
  type GitHubEnv,
} from './github'

let env: GitHubEnv
let publicKey: CryptoKey

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { extractable: true })
  publicKey = pair.publicKey
  env = {
    GITHUB_REPO: 'owner/repo',
    GH_APP_ID: '12345',
    GH_APP_INSTALLATION_ID: '678',
    GH_APP_PRIVATE_KEY: await exportPKCS8(pair.privateKey),
  }
})

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>

function mockFetch(handler: Handler) {
  const calls: { url: string; init: RequestInit }[] = []
  vi.stubGlobal('fetch', async (input: string, init: RequestInit = {}) => {
    calls.push({ url: String(input), init })
    return handler(String(input), init)
  })
  return calls
}

const tokenResponse = () =>
  Response.json({ token: 'inst-token', expires_at: new Date(Date.now() + 3600_000).toISOString() })

beforeEach(() => resetTokenCache())
afterEach(() => vi.unstubAllGlobals())

describe('utf8ToBase64', () => {
  it('encodes non-ASCII text as UTF-8', () => {
    expect(atob(utf8ToBase64('Trò chơi'))).toBe(String.fromCharCode(...new TextEncoder().encode('Trò chơi')))
    expect(utf8ToBase64('x'.repeat(100_000))).toHaveLength(Math.ceil(100_000 / 3) * 4)
  })
})

describe('GitHub App auth + reads', () => {
  it('signs an app JWT, caches the installation token and reads raw files', async () => {
    const calls = mockFetch(async (url) => {
      if (url.endsWith('/access_tokens')) return tokenResponse()
      if (url.includes('/contents/data_game/index.json')) return new Response('{"total_games": 1}')
      return new Response(null, { status: 404 })
    })
    expect(await readFile(env, 'data_game/index.json', 'abc')).toBe('{"total_games": 1}')
    expect(await readFile(env, 'missing.json', 'abc')).toBeNull()

    const tokenCalls = calls.filter((c) => c.url.endsWith('/access_tokens'))
    expect(tokenCalls).toHaveLength(1) // cached for the second read
    const jwt = String((tokenCalls[0].init.headers as Record<string, string>).Authorization).slice(7)
    const { payload } = await jwtVerify(jwt, publicKey)
    expect(payload.iss).toBe('12345')

    const read = calls.find((c) => c.url.includes('index.json'))!
    const headers = read.init.headers as Record<string, string>
    expect(headers.Accept).toBe('application/vnd.github.raw+json')
    expect(headers.Authorization).toBe('Bearer inst-token')
    expect(headers['User-Agent']).toBeTruthy()
    expect(read.url).toContain('ref=abc')
  })
})

describe('commit', () => {
  it('sends createCommitOnBranch with the expected head and base64 contents', async () => {
    const calls = mockFetch(async (url) => {
      if (url.endsWith('/access_tokens')) return tokenResponse()
      return Response.json({ data: { createCommitOnBranch: { commit: { oid: 'new-oid' } } } })
    })
    const oid = await commit(env, {
      expectedHeadOid: 'head1',
      headline: 'admin: test',
      writes: new Map([['scripts/temp_link.json', '[]']]),
      deletes: ['data_game/game_info_009.json'],
    })
    expect(oid).toBe('new-oid')
    const body = JSON.parse(String(calls.at(-1)!.init.body))
    const input = body.variables.input
    expect(input.expectedHeadOid).toBe('head1')
    expect(input.branch).toEqual({ repositoryNameWithOwner: 'owner/repo', branchName: 'main' })
    expect(input.fileChanges.additions).toEqual([{ path: 'scripts/temp_link.json', contents: btoa('[]') }])
    expect(input.fileChanges.deletions).toEqual([{ path: 'data_game/game_info_009.json' }])
  })

  it('retries on a moved head, then succeeds', async () => {
    let heads = 0
    let commits = 0
    mockFetch(async (url) => {
      if (url.endsWith('/access_tokens')) return tokenResponse()
      if (url.includes('/git/ref/heads/main')) return Response.json({ object: { sha: `head${++heads}` } })
      commits++
      if (commits === 1) {
        return Response.json({ errors: [{ message: 'Expected branch to point to "head1" but it did not.' }] })
      }
      return Response.json({ data: { createCommitOnBranch: { commit: { oid: 'ok' } } } })
    })
    const seen: string[] = []
    const oid = await commitWithRetry(env, async (head) => {
      seen.push(head)
      return { headline: 'x', writes: new Map([['a.json', '{}']]) }
    })
    expect(oid).toBe('ok')
    expect(seen).toEqual(['head1', 'head2'])
  })

  it('gives up after the attempt limit and skips no-op changes', async () => {
    mockFetch(async (url) => {
      if (url.endsWith('/access_tokens')) return tokenResponse()
      if (url.includes('/git/ref/heads/main')) return Response.json({ object: { sha: 'h' } })
      return Response.json({ errors: [{ message: 'expectedHeadOid mismatch' }] })
    })
    await expect(
      commitWithRetry(env, async () => ({ headline: 'x', writes: new Map([['a', 'b']]) }), 2),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(await commitWithRetry(env, async () => null)).toBeNull()
  })
})
