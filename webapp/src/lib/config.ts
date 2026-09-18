import { isTauri } from './runtime'

const SITE_ORIGIN = 'https://freeitchgames.win'

// The catalog JSON is bundled into the site at build time (vite.config.ts →
// catalogData → dist/data/). The web app reads it same-origin; the Tauri apps
// read the live site (served with `Access-Control-Allow-Origin: *`).
export const DATA_BASE = isTauri() ? `${SITE_ORIGIN}/data` : '/data'

export const DATA_FILES = {
  index: 'index.json',
  countHistory: 'count_history.json',
  deleted: 'deleted_games.json',
} as const
