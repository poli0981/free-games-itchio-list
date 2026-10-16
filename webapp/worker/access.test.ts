import { SignJWT, exportJWK, generateKeyPair } from 'jose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { AccessError, requireMaintainer, type AccessEnv } from './access'

const TEAM = 'https://example.cloudflareaccess.com'
const env: AccessEnv = {
  ACCESS_TEAM_DOMAIN: TEAM,
  ACCESS_AUD_ADMIN: 'aud-admin',
  ADMIN_EMAILS: 'Owner@Example.com, second@example.com',
  SITE_ORIGIN: 'https://freeitchgames.win',
}

let privateKey: CryptoKey

beforeAll(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' }
  vi.stubGlobal('fetch', async (url: string) => {
    if (String(url) === `${TEAM}/cdn-cgi/access/certs`) return Response.json({ keys: [jwk] })
    return new Response(null, { status: 404 })
  })
})
afterAll(() => vi.unstubAllGlobals())

async function token(claims: Record<string, unknown>, aud: string, iss = TEAM) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(iss)
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey)
}

function request(jwt: string | null, method = 'GET', origin?: string) {
  const headers: Record<string, string> = {}
  if (jwt) headers['cf-access-jwt-assertion'] = jwt
  if (origin) headers.origin = origin
  return new Request('https://freeitchgames.win/api/admin/me', { method, headers })
}

describe('requireMaintainer', () => {
  it('accepts a listed email (case-insensitive)', async () => {
    const jwt = await token({ email: 'owner@example.com' }, 'aud-admin')
    await expect(requireMaintainer(request(jwt), env)).resolves.toEqual({
      kind: 'maintainer',
      id: 'owner@example.com',
    })
  })

  it('rejects missing, forged, wrong-audience and wrong-issuer tokens', async () => {
    await expect(requireMaintainer(request(null), env)).rejects.toBeInstanceOf(AccessError)
    const other = await generateKeyPair('RS256')
    const forged = await new SignJWT({ email: 'owner@example.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(TEAM)
      .setAudience('aud-admin')
      .setExpirationTime('5m')
      .sign(other.privateKey)
    await expect(requireMaintainer(request(forged), env)).rejects.toThrow('invalid')
    const wrongAud = await token({ email: 'owner@example.com' }, 'aud-other')
    await expect(requireMaintainer(request(wrongAud), env)).rejects.toThrow('invalid')
    const wrongIss = await token({ email: 'owner@example.com' }, 'aud-admin', 'https://evil.example')
    await expect(requireMaintainer(request(wrongIss), env)).rejects.toThrow('invalid')
  })

  it('accepts a team domain written with a trailing slash', async () => {
    const jwt = await token({ email: 'owner@example.com' }, 'aud-admin')
    const slashed = { ...env, ACCESS_TEAM_DOMAIN: `${TEAM}/` }
    await expect(requireMaintainer(request(jwt), slashed)).resolves.toMatchObject({ id: 'owner@example.com' })
  })

  it('rejects emails that are not maintainers', async () => {
    const jwt = await token({ email: 'someone@example.com' }, 'aud-admin')
    await expect(requireMaintainer(request(jwt), env)).rejects.toThrow('not a maintainer')
  })

  it('requires the site origin on writes', async () => {
    const jwt = await token({ email: 'owner@example.com' }, 'aud-admin')
    await expect(requireMaintainer(request(jwt, 'POST'), env)).rejects.toThrow('bad origin')
    await expect(requireMaintainer(request(jwt, 'POST', 'https://evil.example'), env)).rejects.toThrow('bad origin')
    await expect(requireMaintainer(request(jwt, 'POST', env.SITE_ORIGIN), env)).resolves.toBeTruthy()
  })
})
