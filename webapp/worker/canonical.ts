/**
 * One canonical form for itch.io game URLs — port of scripts/canonical.py.
 * Both implementations are tested against tests/fixtures/url_vectors.json.
 *
 * Canonical form: https://{creator}.itch.io/{slug}
 *   - https only, host lower-cased, no port / userinfo / query / fragment
 *   - exactly one lower-cased path segment, no trailing slash
 *   - creator must be a *.itch.io subdomain (not itch.io / www.itch.io)
 */
const HOST = /^[a-z0-9][a-z0-9-]*\.itch\.io$/
const SLUG = /^[a-z0-9][a-z0-9_-]*$/
const RESERVED_HOSTS = new Set(['itch.io', 'www.itch.io'])

export function canonicalize(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let text = raw.trim()
  if (!text) return null
  if (!text.includes('://')) text = `https://${text}`
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  const host = url.hostname.toLowerCase()
  if (RESERVED_HOSTS.has(host) || !HOST.test(host)) return null
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length !== 1) return null
  const slug = segments[0].toLowerCase()
  if (!SLUG.test(slug)) return null
  return `https://${host}/${slug}`
}
