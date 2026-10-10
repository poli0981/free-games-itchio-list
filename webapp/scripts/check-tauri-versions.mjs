// CI guard: every Tauri crate and its npm package must share major.minor.
// `tauri build` refuses to build otherwise, and only the release workflows run
// it — v4.3.0's first release builds all failed on tauri-plugin-opener 2.6.0
// (Cargo.lock) vs @tauri-apps/plugin-opener 2.7.0 (package-lock.json), after
// Dependabot bumped the npm side alone.
//
//   node scripts/check-tauri-versions.mjs      (from webapp/; npm run check:tauri)
//
// Pairs: tauri ↔ @tauri-apps/api, tauri-plugin-<x> ↔ @tauri-apps/plugin-<x>.
// Reads the lock files only, so no Rust toolchain is needed.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Locked versions of `tauri` and every `tauri-plugin-*` crate in a Cargo.lock text. */
export function crateVersions(cargoLock) {
  const versions = new Map()
  for (const block of cargoLock.split('[[package]]')) {
    const name = /^name = "([^"]+)"/m.exec(block)?.[1]
    const version = /^version = "([^"]+)"/m.exec(block)?.[1]
    if (name && version && (name === 'tauri' || name.startsWith('tauri-plugin-'))) versions.set(name, version)
  }
  return versions
}

export function npmPackageFor(crate) {
  return crate === 'tauri' ? '@tauri-apps/api' : `@tauri-apps/plugin-${crate.slice('tauri-plugin-'.length)}`
}

const majorMinor = (version) => version.split('.').slice(0, 2).join('.')

/** Crate/npm pairs locked on different major.minor versions (crates without an npm side are skipped). */
export function mismatches(cargoLock, packageLock) {
  const out = []
  for (const [crate, version] of crateVersions(cargoLock)) {
    const pkg = npmPackageFor(crate)
    const npm = packageLock.packages?.[`node_modules/${pkg}`]?.version
    if (npm && majorMinor(npm) !== majorMinor(version)) out.push({ crate, version, pkg, npm })
  }
  return out
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const webapp = join(dirname(fileURLToPath(import.meta.url)), '..')
  const cargoLock = readFileSync(join(webapp, 'src-tauri', 'Cargo.lock'), 'utf8')
  const packageLock = JSON.parse(readFileSync(join(webapp, 'package-lock.json'), 'utf8'))
  const bad = mismatches(cargoLock, packageLock)
  for (const m of bad) {
    console.log(
      `::error::${m.crate} ${m.version} (src-tauri/Cargo.lock) and ${m.pkg} ${m.npm} (package-lock.json) ` +
        `differ in major.minor — \`tauri build\` will refuse to build. Align them, e.g. ` +
        `\`cargo update -p ${m.crate}\` in src-tauri/, or merge the matching Dependabot tauri-rs / tauri-js PR.`,
    )
  }
  if (bad.length) process.exit(1)
  const pairs = [...crateVersions(cargoLock)].filter(([crate]) => packageLock.packages?.[`node_modules/${npmPackageFor(crate)}`])
  console.log(`Tauri crates and npm packages agree: ${pairs.map(([crate, v]) => `${crate} ${v}`).join(', ')}`)
}
