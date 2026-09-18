import { SignJWT, exportJWK, generateKeyPair } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ADMIN_CSP, handleAdminApi, serveAdminApp } from '../admin'
import type { WorkerEnv } from '../env'
import { ORIGIN } from './fakes'

const TEAM = 'https://team.cloudflareaccess.com'
let privateKey: CryptoKey

const ADMIN_SHELL = '<!doctype html><title>admin</title>'
const env = {
  SITE_ORIGIN: ORIGIN,
  ACCESS_TEAM_DOMAIN: TEAM,
  ACCESS_AUD_ADMIN: 'aud-admin',
  ACCESS_AUD_INGEST: 'aud-ingest',
  ADMIN_EMAILS: 'owner@example.com',
  ASSETS: {
    fetch: async (req: Request) =>
      new URL(req.url).pathname === '/admin/'
        ? new Response(ADMIN_SHELL, { headers: { 'content-type': 'text/html', 'content-security-policy': "default-src 'self'; script-src https://static.cloudflareinsights.com" } })
        : new Response(null, { status: 404 }),
  },
} as unknown as WorkerEnv

beforeAll(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' }
  vi.stubGlobal('fetch', async (url: string) =>
    String(url) === `${TEAM}/cdn-cgi/access/certs` ? Response.json({ keys: [jwk] }) : new Response(null, { status: 404 }),
  )
})
afterAll(() => vi.unstubAllGlobals())

const jwt = (email: string, aud = 'aud-admin') =>
  new SignJWT({ email })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(TEAM)
    .setAudience(aud)
    .setExpirationTime('5m')
    .sign(privateKey)

async function get(path: string, token?: string, e: WorkerEnv = env) {
  const url = new URL(path, ORIGIN)
  const headers: Record<string, string> = token ? { 'cf-access-jwt-assertion': token } : {}
  const request = new Request(url, { headers })
  return path.startsWith('/api/') ? handleAdminApi(request, url, e, null) : serveAdminApp(request, url, e)
}

describe('admin authentication', () => {
  it('serves the admin shell only to the maintainer, with its own CSP', async () => {
    const res = await get('/admin/', await jwt('owner@example.com'))
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(ADMIN_SHELL)
    expect(res.headers.get('content-security-policy')).toBe(ADMIN_CSP)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-robots-tag')).toContain('noindex')
  })

  it.each([
    ['no token', undefined],
    ['someone else', 'stranger@example.com'],
  ])('refuses %s', async (_name, email) => {
    const token = email ? await jwt(email) : undefined
    expect((await get('/admin/', token)).status).toBe(403)
    expect((await get('/api/admin/me', token)).status).toBe(403)
  })

  it('sends the bare /admin to /admin/ (the path Access protects) without serving anything', async () => {
    const res = await get('/admin?x=1')
    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('/admin/?x=1')
    expect(await res.text()).toBe('')
  })

  it('refuses a token minted for the ingest application', async () => {
    expect((await get('/admin/', await jwt('owner@example.com', 'aud-ingest'))).status).toBe(403)
  })

  it('answers 503 until Access is configured, never serving the shell', async () => {
    const bare = { ...env, ACCESS_AUD_ADMIN: '' } as WorkerEnv
    expect((await get('/admin/', await jwt('owner@example.com'), bare)).status).toBe(503)
    expect((await get('/api/admin/me', await jwt('owner@example.com'), bare)).status).toBe(503)
  })

  it('does not serve files from under /admin', async () => {
    expect((await get('/admin/secrets.json', await jwt('owner@example.com'))).status).toBe(404)
  })
})

describe('local development bypass', () => {
  const dev = { ...env, DEV_ADMIN_EMAIL: 'dev@localhost', ACCESS_AUD_ADMIN: '' } as WorkerEnv

  it('lets wrangler dev on localhost in without Access', async () => {
    const url = new URL('http://localhost:8787/admin/')
    const res = await serveAdminApp(new Request(url), url, dev)
    expect(res.status).toBe(200)
  })

  it('is ignored on any other host', async () => {
    expect((await get('/admin/', undefined, dev)).status).toBe(503)
    const withAccess = { ...env, DEV_ADMIN_EMAIL: 'dev@localhost' } as WorkerEnv
    expect((await get('/admin/', undefined, withAccess)).status).toBe(403)
  })
})
