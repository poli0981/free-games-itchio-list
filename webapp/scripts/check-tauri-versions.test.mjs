import { describe, expect, it } from 'vitest'
import { crateVersions, mismatches, npmPackageFor } from './check-tauri-versions.mjs'

const CARGO_LOCK = `
[[package]]
name = "serde"
version = "1.0.228"

[[package]]
name = "tauri"
version = "2.12.0"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "tauri-build"
version = "2.7.1"

[[package]]
name = "tauri-plugin-opener"
version = "2.6.0"

[[package]]
name = "tauri-plugin-single-instance"
version = "2.5.0"
`

const lock = (versions) => ({
  packages: Object.fromEntries(Object.entries(versions).map(([name, version]) => [`node_modules/${name}`, { version }])),
})

describe('check-tauri-versions', () => {
  it('reads tauri and tauri-plugin-* crates only', () => {
    expect([...crateVersions(CARGO_LOCK)]).toEqual([
      ['tauri', '2.12.0'],
      ['tauri-plugin-opener', '2.6.0'],
      ['tauri-plugin-single-instance', '2.5.0'],
    ])
    expect(npmPackageFor('tauri')).toBe('@tauri-apps/api')
    expect(npmPackageFor('tauri-plugin-opener')).toBe('@tauri-apps/plugin-opener')
  })

  it('reports a pair on different major.minor (the v4.3.0 release failure)', () => {
    const packageLock = lock({ '@tauri-apps/api': '2.12.1', '@tauri-apps/plugin-opener': '2.7.0' })
    expect(mismatches(CARGO_LOCK, packageLock)).toEqual([
      { crate: 'tauri-plugin-opener', version: '2.6.0', pkg: '@tauri-apps/plugin-opener', npm: '2.7.0' },
    ])
  })

  it('accepts patch differences and crates without an npm package', () => {
    const packageLock = lock({ '@tauri-apps/api': '2.12.9', '@tauri-apps/plugin-opener': '2.6.3' })
    expect(mismatches(CARGO_LOCK, packageLock)).toEqual([])
  })
})
