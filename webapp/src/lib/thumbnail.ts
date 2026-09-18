import { isTauri } from './runtime'

const ITCH_IMG = 'https://img.itch.zone/'

/** Widths the Worker's /img proxy renders (see worker/img.ts). */
export type ThumbWidth = 160 | 640

/**
 * Covers are stored as full-size itch.io originals (often 1–3 MB). On the web
 * they go through the Worker, which serves a resized WebP cached in R2; the
 * browser never contacts itch.io. The Tauri apps load the original directly.
 */
export function thumbUrl(src: string, width: ThumbWidth): string {
  if (isTauri() || !src.startsWith(ITCH_IMG)) return src
  // Keep the path verbatim: itch.zone file names contain %2F / %2B.
  return `/img/${width}/${src.slice(ITCH_IMG.length)}`
}
