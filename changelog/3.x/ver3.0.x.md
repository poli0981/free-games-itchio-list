# Changelog — 3.0.x

Release notes for 3.0.0 – 3.0.1, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [3.0.1] - 2026-05-04 (Tauri icons + fine-grained PAT fix)

This release has no changelog entry of its own; its notes are on GitHub: <https://github.com/poli0981/free-games-itchio-list/releases/tag/v3.0.1>.

---

## [3.0.0] - 2026-05-04 (Webapp + Desktop 🖥️📊)

A React + TypeScript SPA on top of the same JSON catalog, plus a Tauri 2 desktop wrapper.
The Python pipeline from 2.0.0 is untouched and still drives the daily data updates.

### Added (Webapp)
- **`webapp/`** — Vite + React 19 + TypeScript 6 + Tailwind v3 + shadcn/ui (Radix primitives).
  Code-split, ~163 KB gzip initial load. Reads from `raw.githubusercontent.com` (public, no auth);
  writes use a fine-grained GitHub PAT held only in memory after passphrase unlock.
- **8 routes**: Dashboard (KPIs), Games (virtualized DataTable + faceted filters), Game Detail
  (23-field read view + edit form for `safe_virus` / `notes` / `nsfw`), Add (single URL +
  bulk), Charts (9 Recharts visualizations in 4 tabs), Workflows (run history + Dispatch),
  Deleted (tombstone log), Settings (PAT + theme), About (license attribution).
- **PAT encryption** — AES-GCM 256-bit, PBKDF2-SHA256 (100k iterations) with per-token salt.
  Encrypted blob in localStorage; decrypted token in memory only.
- **Atomic bulk operations** — Bulk edit / delete via GitHub Git Data API (single commit for N
  files), 20-entry undo stack with one-click revert.
- **Workflow dispatch from UI** — Add a single URL or queue a bulk batch directly to
  `update.yml` via `workflow_dispatch`. Polls run status every 5 s and refreshes the table on
  completion.
- **Sync button + manual refresh** — invalidate all data queries on demand; spinner reflects
  in-flight state.
- **Collapsible sidebar** with rail mode (240 px ↔ 56 px).
- **Dark / Light / System theme** with `prefers-color-scheme` listener.
- **About page** — third-party license attribution by category, app version + build date.

### Added (Desktop wrapper)
- **`webapp/src-tauri/`** — Tauri 2 scaffold (Rust + WebView). Same React build, ~10 MB
  installer.
- **`tauri-plugin-http`** scoped to `*.itch.io`, `img.itch.zone`, `api.github.com`,
  `raw.githubusercontent.com`. Lets the desktop bypass CORS for direct itch.io previews.
- **`webapp/TAURI.md`** — local prerequisites (rustup + platform deps), dev/build commands,
  roadmap to a full Rust scrape (Phase 8b).

### Added (CI)
- **`.github/workflows/deploy_webapp.yml`** — build `webapp/` and publish `docs/app/` to
  GitHub Pages on push to `main` that touches `webapp/`. One-time setup: repo Settings →
  Pages → Source = "GitHub Actions".
- **`.github/workflows/release_desktop.yml`** — multi-platform Tauri build via
  `tauri-apps/tauri-action` on tag `v*`. Uploads `.msi` / `.dmg` / `.AppImage` to a draft
  GitHub Release.

### Changed (Python pipeline)
- **`scripts/update_info.py`** now reads an optional `INPUT_URL` env var (forwarded by
  `update.yml` from `workflow_dispatch.inputs.url`) and appends it to the queue. Backwards
  compatible: the daily cron still processes `temp_link.json` exactly as before.
- **`.github/workflows/update.yml`** gains `workflow_dispatch.inputs.url` so the webapp can
  trigger a single-URL scrape.
