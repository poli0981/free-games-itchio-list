import { RAW_BASE } from '../config'
import { HttpError } from '../http-error'

export async function fetchRaw<T>(path: string): Promise<T> {
  const url = `${RAW_BASE}/${path}`
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) {
    throw new HttpError(res.status, `Failed to fetch ${path}: ${res.status} ${res.statusText}`, url)
  }
  return res.json() as Promise<T>
}
