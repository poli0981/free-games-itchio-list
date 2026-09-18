import { DATA_BASE } from '../config'
import { HttpError } from '../http-error'

/**
 * GET one catalog file. `cache: 'no-cache'` always revalidates with the edge
 * (ETag → usually a 304), so a fresh deploy is picked up without waiting for
 * a max-age to expire.
 */
export async function fetchData<T>(file: string): Promise<T> {
  const url = `${DATA_BASE}/${file}`
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) {
    throw new HttpError(res.status, `Failed to fetch ${file}: ${res.status} ${res.statusText}`, url)
  }
  return res.json() as Promise<T>
}
