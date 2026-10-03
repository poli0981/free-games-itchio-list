/**
 * The readable catalog JSON under /data (index.json, game_info_NNN.json,
 * count_history.json, deleted_games.json, urls.json), routed here by
 * wrangler.jsonc `run_worker_first`.
 *
 * Since 4.2 the site and the apps read the compact packs under /data/pack/.
 * The JSON files stay in dist/ — the Worker itself reads urls.json and
 * deleted_games.json through env.ASSETS (data.ts), which skips this route —
 * and are served only to the desktop/Android apps 4.0–4.1.1, recognised by
 * their webview's Origin. Everyone else gets a 410 pointing to the GitHub
 * repository, where the data is published (CC BY 4.0). Not a security
 * boundary (the header can be forged; the data is public anyway): it keeps
 * the website from being the place to download it.
 */
import { json } from './http'

/** Webview origins of the Tauri apps: macOS/Linux (custom scheme), Windows/Android. */
export const TAURI_ORIGINS = new Set(['tauri://localhost', 'http://tauri.localhost', 'https://tauri.localhost'])

const REPO = 'https://github.com/poli0981/free-games-itchio-list'
const CORS = { 'Access-Control-Allow-Origin': '*', Vary: 'Origin' }

export async function handleLegacyData(request: Request, assets: Pick<Fetcher, 'fetch'>): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ error: 'method_not_allowed' }, 405, { ...CORS, Allow: 'GET, HEAD' })
  }
  const origin = request.headers.get('Origin')
  if (origin === null || !TAURI_ORIGINS.has(origin)) {
    // Sampled logs show what still asks; an old app with an unexpected Origin would surface here.
    console.info('legacy-data: 410', { path: new URL(request.url).pathname, origin })
    // no-store (json()): a cache that ignores Vary must not hand this to an app.
    return json(
      {
        error: 'gone',
        message: 'The catalog data is published in the GitHub repository (CC BY 4.0). Please download it from there.',
        data: `${REPO}/tree/main/data_game`,
        removed: `${REPO}/blob/main/scripts/deleted_games.json`,
        license: `${REPO}/blob/main/data_game/LICENSE.md`,
      },
      410,
      CORS,
    )
  }
  // The asset's own headers (public/_headers: CORS, short cache) and its
  // ETag / 304 handling come along.
  const res = await assets.fetch(request)
  if (res.status === 404) return json({ error: 'not_found' }, 404, CORS)
  const out = new Response(res.body, res)
  out.headers.append('Vary', 'Origin')
  return out
}
