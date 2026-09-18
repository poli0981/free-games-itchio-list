/**
 * Cloudflare Access verification for /admin and /api/admin/* (maintainer) and
 * /api/ingest (service tokens, e.g. the browser extension).
 *
 * Access sits in front of those paths, but a Worker with static assets does
 * not receive `ctx.access`, and requests that bypass the zone (workers.dev,
 * previews — both disabled in wrangler.jsonc) would skip Access entirely.
 * So every protected request re-verifies the `Cf-Access-Jwt-Assertion` JWT
 * here: signature against the team's JWKS, issuer, and the application's AUD.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

export interface AccessEnv {
  ACCESS_TEAM_DOMAIN: string // https://<team>.cloudflareaccess.com
  ACCESS_AUD_ADMIN: string
  ACCESS_AUD_INGEST: string
  ADMIN_EMAILS: string // comma-separated; a secret, not in the repo
  SITE_ORIGIN: string
}

export interface Identity {
  kind: 'maintainer' | 'service'
  /** Email for people, service-token client id (common_name) for services. */
  id: string
}

export class AccessError extends Error {}

const jwksByTeam = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function jwks(teamDomain: string) {
  let set = jwksByTeam.get(teamDomain)
  if (!set) {
    set = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`))
    jwksByTeam.set(teamDomain, set)
  }
  return set
}

async function verify(request: Request, env: AccessEnv, audience: string): Promise<JWTPayload> {
  const token = request.headers.get('cf-access-jwt-assertion')
  if (!token) throw new AccessError('missing Access token')
  try {
    const { payload } = await jwtVerify(token, jwks(env.ACCESS_TEAM_DOMAIN), {
      issuer: env.ACCESS_TEAM_DOMAIN,
      audience,
    })
    return payload
  } catch {
    throw new AccessError('invalid Access token')
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** The maintainer, signed in through the "Admin" Access application. */
export async function requireMaintainer(request: Request, env: AccessEnv): Promise<Identity> {
  const payload = await verify(request, env, env.ACCESS_AUD_ADMIN)
  const email = String(payload.email ?? '').toLowerCase()
  const allowed = env.ADMIN_EMAILS.toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!email || !allowed.includes(email)) throw new AccessError('not a maintainer')
  // Cross-site request forgery guard for writes (the Access cookie is sent
  // with top-level cross-site requests too).
  if (!SAFE_METHODS.has(request.method) && request.headers.get('origin') !== env.SITE_ORIGIN) {
    throw new AccessError('bad origin')
  }
  return { kind: 'maintainer', id: email }
}

/** A service token of the "Ingest" Access application (Service Auth policy). */
export async function requireService(request: Request, env: AccessEnv): Promise<Identity> {
  const payload = await verify(request, env, env.ACCESS_AUD_INGEST)
  // Service-token JWTs carry the client id as common_name and no email.
  const id = String(payload.common_name ?? '')
  if (!id || payload.email) throw new AccessError('not a service token')
  return { kind: 'service', id }
}
