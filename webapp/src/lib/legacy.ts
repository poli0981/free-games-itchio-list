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
 * v3 used hash routing (`/#/games/x`). Rewrite such links to real paths
 * before the router mounts, so shared links and bookmarks keep working.
 */
export function redirectLegacyHashRoute(): void {
  const { hash } = window.location
  if (!hash.startsWith('#/')) return
  const target = hash.slice(1)
  const pathname = target.split(/[?#]/)[0]
  window.history.replaceState(null, '', RETIRED_ROUTES.has(pathname) ? '/' : target)
}
