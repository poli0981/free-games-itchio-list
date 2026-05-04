import { isTauri } from './runtime'
import type { Game } from '@/types/game'

export interface ScrapeResult {
  partial: Partial<Game>
  raw_html_length: number
}

/**
 * Tauri-only: fetch an itch.io page directly (no CORS) via tauri-plugin-http
 * and extract a partial Game record.
 *
 * The full 23-field extraction lives in Python (scripts/scraper.py); this is
 * a minimal "preview" so the desktop user sees something before dispatching
 * the workflow. Phase 8b can port the rest of scraper.py to Rust.
 */
export async function tauriScrapePreview(url: string): Promise<ScrapeResult> {
  if (!isTauri()) throw new Error('Tauri-only feature (run via npm run tauri dev)')
  const { fetch } = await import('@tauri-apps/plugin-http')
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (free-games-itchio-webapp)' },
  })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
  const html = await res.text()
  return { partial: parsePartial(html, url), raw_html_length: html.length }
}

function pickMeta(html: string, property: string): string | undefined {
  const re = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  const m = html.match(re)
  return m?.[1]
}

function pickJsonLdName(html: string): string | undefined {
  const m = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]+?)<\/script>/i)
  if (!m) return undefined
  try {
    const data = JSON.parse(m[1])
    if (Array.isArray(data)) return data[0]?.name
    return data.name
  } catch {
    return undefined
  }
}

function parsePartial(html: string, url: string): Partial<Game> {
  return {
    url,
    name: pickJsonLdName(html) ?? pickMeta(html, 'og:title') ?? '',
    description: pickMeta(html, 'og:description') ?? '',
    thumbnail: pickMeta(html, 'og:image') ?? '',
  }
}
