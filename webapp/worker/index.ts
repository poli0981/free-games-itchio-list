/**
 * Worker for freeitchgames.win. Existing static assets (the app, /data/*) are
 * served by the assets layer without invoking this script. It runs for the
 * paths in wrangler.jsonc `assets.run_worker_first`, and for every request
 * that matches no asset (`not_found_handling: "none"`, see spa.ts).
 *
 *   /img/*          resized covers (img.ts)
 *   /api/suggest    public suggestion form (suggest.ts)
 *   /api/ingest     browser extension, Access service token (ingest.ts)
 *   /api/admin/*    maintainer API, Access + JWT check (admin.ts)
 *   /admin, /admin/* admin app shell, maintainer only (admin.ts)
 *
 * Cron: one RSS feed per run into the review queue, then queue bookkeeping.
 */
import { handleAdminApi, serveAdminApp } from './admin'
import { catalogUrls } from './data'
import { discover } from './discover'
import type { WorkerEnv } from './env'
import { json } from './http'
import { handleImg } from './img'
import { accessService, handleIngest } from './ingest'
import { QueueStore } from './queue'
import { handleMiss } from './spa'
import { handleSuggest } from './suggest'

function queueStore(env: WorkerEnv): QueueStore | null {
  return env.DB ? new QueueStore(env.DB) : null
}

export default {
  async fetch(request, env: WorkerEnv, ctx): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const data = { assets: env.ASSETS, origin: url.origin }

    if (path.startsWith('/img/')) {
      return handleImg(request, url, {
        assets: env.ASSETS,
        bucket: env.THUMBS,
        cache: caches.default,
        fetch: (input, init) => fetch(input, init),
        waitUntil: (p) => ctx.waitUntil(p),
      })
    }
    if (path === '/api/health') return json({ ok: true })
    if (path === '/api/suggest') {
      return handleSuggest(request, env, {
        store: queueStore(env),
        data,
        fetch: (input, init) => fetch(input, init),
        limiter: env.RL_SUGGEST,
      })
    }
    if (path === '/api/ingest') {
      return handleIngest(request, {
        store: queueStore(env),
        data,
        limiter: env.RL_INGEST,
        authenticate: accessService(env),
      })
    }
    if (path.startsWith('/api/admin/')) return handleAdminApi(request, url, env, queueStore(env))
    if (path.startsWith('/api/')) return json({ error: 'not_found' }, 404)
    if (path === '/admin' || path.startsWith('/admin/')) return serveAdminApp(request, url, env)

    return handleMiss(request, url, env.ASSETS)
  },

  async scheduled(_controller, env: WorkerEnv): Promise<void> {
    const store = queueStore(env)
    if (!store) return
    const data = { assets: env.ASSETS, origin: env.SITE_ORIGIN }
    const now = new Date()
    try {
      const found = await discover({
        store,
        data,
        fetch: (input, init) => fetch(input, init),
        userAgent: env.BOT_UA,
        now,
      })
      console.log('discover', found)
    } catch (e) {
      console.error('discover failed', e)
    }
    const catalog = new Set((await catalogUrls(data)).keys())
    console.log('reconcile', await store.reconcile(catalog, now))
    await store.purge(now)
  },
} satisfies ExportedHandler<WorkerEnv>
