/**
 * Catalog facts the Worker needs, read from the site's own static assets
 * (the build bundles them under /data, see vite-plugins/catalog-data.ts).
 * Cached per isolate: every deploy starts fresh isolates, and a deploy is
 * the only way these files change.
 */

export interface DataSource {
  assets: Pick<Fetcher, 'fetch'>
  origin: string
}

let urlMap: Map<string, string> | undefined

export function resetDataCache(): void {
  urlMap = undefined
}

async function fetchJson<T>(src: DataSource, file: string): Promise<T> {
  const res = await src.assets.fetch(new Request(`${src.origin}/data/${file}`))
  if (!res.ok) throw new Error(`${file}: ${res.status}`)
  return res.json() as Promise<T>
}

/**
 * Only the loaded value is shared, never an in-flight promise: a pending
 * subrequest belongs to the request that started it, and if that request is
 * cancelled (client disconnect) the promise never settles — every other
 * request awaiting it would hang. Concurrent cold requests each load; a
 * failure is not cached, so the next request retries.
 */
async function cachedLoad<T>(get: () => T | undefined, set: (v: T) => void, load: () => Promise<T>): Promise<T> {
  const hit = get()
  if (hit !== undefined) return hit
  const value = await load()
  set(value)
  return value
}

/** Catalog game URL → thumbnail URL. */
export function catalogUrls(src: DataSource): Promise<Map<string, string>> {
  return cachedLoad(
    () => urlMap,
    (v) => (urlMap = v),
    async () => new Map(Object.entries(await fetchJson<Record<string, string>>(src, 'urls.json'))),
  )
}

