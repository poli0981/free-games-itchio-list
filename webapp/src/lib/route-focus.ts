/** The parts of a router location that decide where focus goes after a navigation. */
export interface RouteSpot {
  pathname: string
  search: string
  hash: string
}

export type RouteFocusTarget = { kind: 'heading' } | { kind: 'hash'; id: string } | null

/** The element id a location hash points at ('' when there is none). */
export function hashId(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/**
 * Where keyboard focus should land after an in-app navigation (App.tsx), so a
 * screen reader announces the new page and Tab continues from its top instead
 * of from the link that was used (WCAG 2.4.3):
 *
 * - `null` on the first render (`prev` is null — the browser starts at the
 *   top of the document anyway) and when only the query string changed (the
 *   Games search, filters and pager keep focus where the visitor is);
 * - `hash` when the location points at a section (`/about#support`);
 * - `heading` (the page's h1) whenever the path changed, whatever the
 *   navigation type (a link, back / forward, a redirect).
 */
export function routeFocusTarget(prev: RouteSpot | null, next: RouteSpot): RouteFocusTarget {
  if (!prev) return null
  const id = hashId(next.hash)
  if (id && (next.hash !== prev.hash || next.pathname !== prev.pathname)) return { kind: 'hash', id }
  if (next.pathname !== prev.pathname) return { kind: 'heading' }
  return null
}
