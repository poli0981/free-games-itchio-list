/**
 * Worker for freeitchgames.win. Static assets (the app and /data/*) are served
 * by the assets layer without invoking this script; only the paths listed in
 * wrangler.jsonc `assets.run_worker_first` reach it.
 */
import { handleImg } from './img'
import { json } from './http'

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

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
