/**
 * Worker for freeitchgames.win. Existing static assets (the app, /data/*) are
 * served by the assets layer without invoking this script. It runs for the
 * paths in wrangler.jsonc `assets.run_worker_first`, and for every request
 * that matches no asset (`not_found_handling: "none"`, see spa.ts).
 */
import { handleImg } from './img'
import { json } from './http'
import { handleMiss } from './spa'

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/img/')) {
      return handleImg(request, url, {
        assets: env.ASSETS,
        bucket: env.THUMBS,
        cache: caches.default,
        fetch: (input, init) => fetch(input, init),
        waitUntil: (p) => ctx.waitUntil(p),
      })
    }

    if (url.pathname === '/api/health') return json({ ok: true })
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404)

    return handleMiss(request, url, env.ASSETS)
  },
} satisfies ExportedHandler<Env>
