/**
 * A real (local, in-memory) D1 database with every migration applied in order,
 * for tests of the SQL in queue.ts. Runs workerd through wrangler's platform proxy.
 */
import { getPlatformProxy } from 'wrangler'

const MIGRATIONS = import.meta.glob<string>('../migrations/*.sql', { query: '?raw', import: 'default', eager: true })

export async function testDb(): Promise<{ db: D1Database; dispose: () => Promise<void> }> {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: new URL('./wrangler.test.jsonc', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
    persist: false,
  })
  for (const name of Object.keys(MIGRATIONS).sort()) {
    const statements = MIGRATIONS[name]
      .replace(/--.*$/gm, '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const sql of statements) await proxy.env.DB.prepare(sql).run()
  }
  return { db: proxy.env.DB, dispose: proxy.dispose }
}
