import { isTauri } from './runtime'

export const SITE_ORIGIN = 'https://freeitchgames.win'

// The catalog is bundled into the site at build time as compact packs
// (vite.config.ts → catalogData → dist/data/pack/). The web app reads them
// same-origin; the Tauri apps read the live site (served with
// `Access-Control-Allow-Origin: *`).
export const PACK_BASE = isTauri() ? `${SITE_ORIGIN}/data/pack` : '/data/pack'
