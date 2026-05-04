import { RAW_BASE } from '../config'

export async function fetchRaw<T>(path: string): Promise<T> {
  const url = `${RAW_BASE}/${path}`
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function rawUrl(path: string): string {
  return `${RAW_BASE}/${path}`
}
