// The inline scripts of the HTML entries (the pre-paint theme script) run only
// if their sha256 is in every CSP that serves them: public/_headers (the site),
// src-tauri/tauri.conf.json (the apps) and worker/admin.ts (the admin shell).
// Change a script and this test prints the new hash to paste in all three.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

/** 'sha256-…' of every <script> without attributes (inline, classic) in an HTML file. */
function inlineScriptHashes(html) {
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
    (m) => `'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`,
  )
}

const POLICIES = {
  'public/_headers': read('public/_headers').match(/Content-Security-Policy: (.*)/)[1],
  'src-tauri/tauri.conf.json': JSON.parse(read('src-tauri/tauri.conf.json')).app.security.csp,
  'worker/admin.ts': read('worker/admin.ts').match(/const THEME_SCRIPT_HASH = "([^"]+)"/)[1],
}

describe('inline script hashes', () => {
  for (const html of ['index.html', 'admin/index.html']) {
    it(`${html}: every inline script is allowed by the CSPs`, () => {
      const hashes = inlineScriptHashes(read(html))
      expect(hashes.length).toBeGreaterThan(0)
      for (const hash of hashes) {
        for (const [file, policy] of Object.entries(POLICIES)) {
          expect(policy, `${file} lacks ${hash}`).toContain(hash)
        }
      }
    })
  }
})
