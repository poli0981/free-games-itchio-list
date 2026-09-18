/**
 * One-time migrations for users coming from v3 (GitHub Pages / old apps).
 */

// v3 kept an encrypted GitHub PAT and GPG key in localStorage. The v4 public
// app has no sign-in, so drop them from every origin that still has them
// (the web site, the desktop/Android apps after an upgrade).
const LEGACY_KEYS = [
  'webapp.pat.encrypted',
  'webapp.gpg.encrypted',
  'webapp.gpg.fingerprint',
  'webapp.gpg.uid',
  'webapp.gpg.emails',
  'webapp.gpg.enabled',
]

export function clearLegacyCredentials(): void {
  try {
    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
  } catch {
    // Storage blocked (private mode, policies): nothing to clear.
  }
}

// Routes that existed in v3 but are gone from the public app.
const RETIRED_ROUTES = new Set(['/add', '/workflows'])

/**
 * Where a v3 hash link (`#/games/x`) should land, or null for other hashes.
 * A crafted hash that resolves to another origin (`#//host`, `#/\host`) or
 * does not parse goes to the home page.
 */
export function legacyHashTarget(hash: string, origin: string): string | null {
  if (!hash.startsWith('#/')) return null
  let url: URL
  try {
    url = new URL(hash.slice(1), origin)
  } catch {
    return '/'
  }
  // '#/.//evil.com' normalizes to the pathname '//evil.com': same origin, but
  // no page of ours, and replaceState would read it as another host.
  if (url.origin !== origin || url.pathname.startsWith('//') || RETIRED_ROUTES.has(url.pathname)) {
    return '/'
  }
  return url.href
}

/**
 * v3 used hash routing (`/#/games/x`). Rewrite such links to real paths
 * before the router mounts, so shared links and bookmarks keep working.
 */
export function redirectLegacyHashRoute(): void {
  const target = legacyHashTarget(window.location.hash, window.location.origin)
  if (target === null) return
  try {
    window.history.replaceState(null, '', target)
  } catch {
    // Never let a bad link keep the app from mounting.
    window.history.replaceState(null, '', '/')
  }
}
