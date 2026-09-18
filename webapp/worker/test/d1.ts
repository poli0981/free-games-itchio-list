/**
 * A real (local, in-memory) D1 database with the migrations applied, for
 * tests of the SQL in queue.ts. Runs workerd through wrangler's platform proxy.
 */
import { getPlatformProxy } from 'wrangler'
import init from '../migrations/0001_init.sql?raw'

export async function testDb(): Promise<{ db: D1Database; dispose: () => Promise<void> }> {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: new URL('./wrangler.test.jsonc', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
    persist: false,
  })
  const statements = init
    .replace(/--.*$/gm, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const sql of statements) await proxy.env.DB.prepare(sql).run()
  return { db: proxy.env.DB, dispose: proxy.dispose }
}
