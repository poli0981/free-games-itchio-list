# Changelog — 3.6.x

Release notes for 3.6.0 – 3.6.1, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [3.6.1] - 2026-06-12 (Hotfix — desktop build vs broken `time` 0.3.48)

### Fixed

- **v3.6.0's desktop installers never built**: `time` 0.3.48 (released
  2026-06-12, hours before the v3.6.0 tag) fails to compile inside
  `tauri-utils` with `E0119: conflicting implementations of trait From<…>`
  ([time-rs/time#783](https://github.com/time-rs/time/issues/783)). Since no
  `Cargo.lock` is committed, CI resolved the broken release fresh.
  `webapp/src-tauri/Cargo.toml` now pins `time = "=0.3.47"` (the version every
  release through v3.5.2 built with) — remove the pin once the upstream fix
  ships.

### Notes

- Web feature set is identical to v3.6.0; this tag exists to produce the
  desktop installers. `about.ts` version bump also busts the new IndexedDB
  catalog cache, which is harmless.
- No Tauri version bump (`Cargo.toml` / `tauri.conf.json` stay `0.1.1`) — a
  dependency pin to the previously-resolved version changes no binary
  behavior.

---

## [3.6.0] - 2026-06-12 (i18n EN/VI + offline cache + custom error pages)

### Added

- **Bilingual UI (English / Tiếng Việt)** — a minimal typed i18n layer
  ([`webapp/src/lib/i18n/`](../../webapp/src/lib/i18n)) with ~340 keys covering every
  route, dialog, chart, and toast. The Vietnamese dictionary is a **lazy-loaded
  chunk**: it is only downloaded the first time the language is switched to VI
  (or on startup when VI is the persisted preference). Switcher lives in
  Settings → Appearance; the preference persists in `webapp.prefs`.
- **Offline-first catalog cache** — the react-query cache for the public
  catalog queries (`db`, `deleted`, `count-history`) now persists to
  **IndexedDB** (`@tanstack/react-query-persist-client` +
  `@tanstack/query-async-storage-persister` + `idb-keyval`). Revisits paint
  instantly from cache (~2 MB of JSON no longer re-downloaded cold) and
  revalidate in the background. Cache busts automatically on each release
  (`buster = APP.version`, `maxAge` 7 days). PAT-gated data is never persisted.
- **Custom error pages** — a status-aware
  [`ErrorPage`](../../webapp/src/components/error-page.tsx) (400, 401, 403, 404, 408,
  419, 429, 500, 502, 503, 504, offline, unknown) wired into every route's
  error branch with the *real* HTTP status (`fetchRaw` now throws a typed
  `HttpError`), plus:
  - a route-level **ErrorBoundary** that detects stale-chunk failures after a
    redeploy and offers a one-click reload ("New version available"),
  - a hidden `/#/errors/:code` preview route,
  - a static `webapp/public/404.html` served by
    GitHub Pages for bad path URLs (bilingual, dark-mode aware, zero JS).

### Changed

- `ReactQueryDevtools` is now explicitly gated behind `import.meta.env.DEV`.
- Game thumbnails render through a shared
  [`GameThumb`](../../webapp/src/components/game-thumb.tsx) that falls back to the
  muted placeholder when a cover 404s; the Settings avatar is now lazy-loaded.
- `idb-keyval` returns (removed as unused in v3.5.2 — it has a real consumer
  now); `THIRD_PARTY` in `about.ts` lists the three new data-layer deps.

### Notes

- The About page's legal/credits data intentionally stays English (controlling
  language for legal interpretation); Vietnamese policy docs remain under
  [`docs/i18n/vi/`](../../docs/i18n/vi).
- No Tauri / Rust binary boundary change — `Cargo.toml` / `tauri.conf.json`
  stay at `0.1.1`.
