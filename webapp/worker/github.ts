/**
 * GitHub access for admin writes, as a GitHub App (no personal token).
 *
 * - Installation token: RS256 app JWT → POST /app/installations/:id/access_tokens,
 *   cached per isolate until 5 minutes before expiry.
 * - Reads: the Contents API with the raw media type at an exact commit
 *   (no base64 / UTF-8 mojibake — CLAUDE.md gotcha #8).
 * - Writes: GraphQL `createCommitOnBranch` with `expectedHeadOid`. Commits made
 *   by an app through the API are signed by GitHub ("Verified"), and the
 *   expected head makes a write fail instead of silently overwriting a commit
 *   another writer (pipeline, extension) pushed in between; callers retry.
 */
import { SignJWT, importPKCS8 } from 'jose'

export interface GitHubEnv {
  GITHUB_REPO: string // "owner/name"
  GH_APP_ID: string
  GH_APP_INSTALLATION_ID: string
  GH_APP_PRIVATE_KEY: string // PKCS#8 PEM
}

const API = 'https://api.github.com'
const BRANCH = 'main'
const BASE_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  // GitHub rejects API requests without a User-Agent.
  'User-Agent': 'freeitchgames-admin',
}

export class ConflictError extends Error {}

let cached: { token: string; expiresAt: number } | undefined

export function resetTokenCache(): void {
  cached = undefined
}

async function appJwt(env: GitHubEnv): Promise<string> {
  const key = await importPKCS8(env.GH_APP_PRIVATE_KEY, 'RS256')
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(env.GH_APP_ID)
    .setIssuedAt(now - 60) // clock skew allowance
    .setExpirationTime(now + 9 * 60)
    .sign(key)
}

async function installationToken(env: GitHubEnv): Promise<string> {
  if (cached && cached.expiresAt - Date.now() > 5 * 60_000) return cached.token
  const res = await fetch(`${API}/app/installations/${env.GH_APP_INSTALLATION_ID}/access_tokens`, {
    method: 'POST',
    headers: { ...BASE_HEADERS, Authorization: `Bearer ${await appJwt(env)}` },
  })
  if (!res.ok) throw new Error(`GitHub App token: HTTP ${res.status}`)
  const body = (await res.json()) as { token: string; expires_at: string }
  cached = { token: body.token, expiresAt: Date.parse(body.expires_at) }
  return body.token
}

async function gh(env: GitHubEnv, path: string, init: RequestInit = {}): Promise<Response> {
  const token = await installationToken(env)
  return fetch(`${API}${path}`, {
    ...init,
    headers: { ...BASE_HEADERS, Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  })
}

async function headOid(env: GitHubEnv): Promise<string> {
  const res = await gh(env, `/repos/${env.GITHUB_REPO}/git/ref/heads/${BRANCH}`)
  if (!res.ok) throw new Error(`read ref: HTTP ${res.status}`)
  return ((await res.json()) as { object: { sha: string } }).object.sha
}

/** File text at a commit, or null when it does not exist. */
export async function readFile(env: GitHubEnv, path: string, ref: string): Promise<string | null> {
  const res = await gh(env, `/repos/${env.GITHUB_REPO}/contents/${path}?ref=${ref}`, {
    headers: { Accept: 'application/vnd.github.raw+json' },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`read ${path}: HTTP ${res.status}`)
  return res.text()
}

/** Names of the files directly in a directory at a commit. */
export async function listDir(env: GitHubEnv, path: string, ref: string): Promise<string[]> {
  const res = await gh(env, `/repos/${env.GITHUB_REPO}/contents/${path}?ref=${ref}`)
  if (!res.ok) throw new Error(`list ${path}: HTTP ${res.status}`)
  const items = (await res.json()) as { name: string; type: string }[]
  return items.filter((i) => i.type === 'file').map((i) => i.name)
}

/** Base64 of the UTF-8 bytes of `text` (chunked: large files overflow apply()). */
export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

export interface CommitInput {
  expectedHeadOid: string
  headline: string
  body?: string
  writes: Map<string, string>
  deletes?: string[]
}

/** One atomic, GitHub-signed commit on main. Throws ConflictError if main moved. */
export async function commit(env: GitHubEnv, input: CommitInput): Promise<string> {
  const query = `mutation($input: CreateCommitOnBranchInput!) {
    createCommitOnBranch(input: $input) { commit { oid } }
  }`
  const variables = {
    input: {
      branch: { repositoryNameWithOwner: env.GITHUB_REPO, branchName: BRANCH },
      expectedHeadOid: input.expectedHeadOid,
      message: { headline: input.headline, ...(input.body ? { body: input.body } : {}) },
      fileChanges: {
        additions: [...input.writes].map(([path, text]) => ({ path, contents: utf8ToBase64(text) })),
        deletions: (input.deletes ?? []).map((path) => ({ path })),
      },
    },
  }
  const res = await gh(env, '/graphql', { method: 'POST', body: JSON.stringify({ query, variables }) })
  const body = (await res.json()) as {
    data?: { createCommitOnBranch?: { commit: { oid: string } } }
    errors?: { message: string }[]
  }
  const errors = body.errors ?? []
  if (errors.some((e) => /expected|head|oid/i.test(e.message))) {
    throw new ConflictError(errors.map((e) => e.message).join('; '))
  }
  const oid = body.data?.createCommitOnBranch?.commit.oid
  if (!res.ok || errors.length > 0 || !oid) {
    throw new Error(`commit: HTTP ${res.status} ${errors.map((e) => e.message).join('; ')}`)
  }
  return oid
}

/**
 * Read → change → commit, retried when another writer moved main meanwhile.
 * `build` receives the head it must read from and returns the commit to make
 * (or null when there is nothing to change).
 */
export async function commitWithRetry(
  env: GitHubEnv,
  build: (head: string) => Promise<Omit<CommitInput, 'expectedHeadOid'> | null>,
  attempts = 3,
): Promise<string | null> {
  for (let i = 1; ; i++) {
    const head = await headOid(env)
    const change = await build(head)
    if (!change) return null
    try {
      return await commit(env, { ...change, expectedHeadOid: head })
    } catch (e) {
      if (!(e instanceof ConflictError) || i >= attempts) throw e
    }
  }
}
