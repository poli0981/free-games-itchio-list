# Changelog

All notable changes to this project will be documented here.

## [3.1.3] - 2026-05-05 (Credit Claude Code as AI co-author)

### Added
- **About page**: new **"AI co-authors"** Card listing both Grok (xAI) and
  Claude Code (Anthropic — Claude Opus 4.7, 1M context) with their roles
  in the repo's history. Each entry is linked + tagged with vendor and model.
- `webapp/src/lib/about.ts`: new `AiTool` interface + `AI_TOOLS` array so the
  AI credit data is structured the same way as `THIRD_PARTY` and `SOCIAL_LINKS`.

### Changed
- **`docs/ACKNOWLEDGEMENTS.md`, `docs/My_Stuff.md`, `CONTRIBUTING.md`**:
  surface Claude Code alongside Grok wherever the existing AI credit lived.
  Grok references stay — both buddies share the workload now (Grok carried the
  Python pipeline + v2.0.0 rewrite; Claude Code drove v3.0.0 webapp/Tauri and
  v3.1.2). `My_Stuff.md` "The Real MVP" is now plural.
- `DEV.blurb` on the About page reflects the two-buddy reality.

---

## [3.1.2] - 2026-05-05 (Offline link fix + About expansion + docs sweep)

### Fixed
- **Tauri desktop**: external links (itch.io, GitHub, third-party home pages) now
  open in the user's default browser instead of doing nothing. Added
  `tauri-plugin-opener` (Rust + JS) and a scoped `opener:allow-open-url`
  capability locked to `https://*` (no `file://` / `javascript:` schemes).

### Added
- **About page**: three new sections — Developer card, "Found a bug?" CTA that
  opens the bug-report issue template, and "Find me elsewhere" with X, YouTube,
  two Discord servers (Repo discussion / Game chat), Patreon, Ko-fi, Steam,
  Bluesky, and Mastodon.
- **`<ExtLink>`** ([`webapp/src/components/ext-link.tsx`](webapp/src/components/ext-link.tsx))
  — runtime-aware external-link wrapper used app-wide so the offline link bug
  can't recur. On web it renders a plain `<a target="_blank">`; on Tauri it
  routes through `tauri-plugin-opener`. All existing external `<a>` tags in
  About, the sidebar footer, and Game Detail now use it.

### Changed
- **`webapp/README.md`**: rewritten from Vite boilerplate to actual webapp docs
  (routes, dev/build commands, code-split layout, deploy, Tauri reference).
- **`CONTRIBUTING.md`, `docs/ACKNOWLEDGEMENTS.md`, `docs/My_Stuff.md`,
  `README.md`**: refreshed contact / social handles. The "if I ever make a
  Discord" line is finally obsolete — both servers exist.

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

---

## [2.0.0] - 2026-03-26 (Major Rewrite 🔧⭐)

### Rewritten
- **`scraper.py`** — new shared module extracted from `update_info.py`. All scraping logic, session management, rate-limiting, and parsing utilities live here. Used by every script that touches itch.io.
- **`update_info.py`** — fully rewritten. Uses `scraper.py` module, `requests.Session` with automatic retry (backoff on 429/5xx), and random delays between requests.
- **`generate_md.py`** — fully rewritten with pipe-character escaping and all new data fields.

### Added
- **Free game detection** — `update_info.py` now checks if a game is free before scraping. Paid games are skipped automatically. Detection logic parses `div.buy_row` for price tags and button text.
- **`check_paid.py`** — new script. Re-checks every game in the list to see if it became paid. Paid games are removed and logged to `deleted_games.json` with reason and timestamp.
- **`check_alive.py`** — new script. Verifies that all game URLs still exist. Pages returning 404 or 410 are removed and logged. Transient errors (403, 5xx, timeouts) are kept.
- **`log_deleted.py`** — new script. Converts `deleted_games.json` → `deleted_games.txt` (human-readable log sorted by date).
- **`deleted_games.json`** — structured log of all removed games with URL, name, reason, and deletion timestamp.
- **New data fields** scraped from itch.io info table: `status`, `platforms`, `publisher`, `release_date`, `made_with`, `rating`, `rating_count`, `average_session`, `languages`, `inputs`. All fields default to `N/A` when not found.
- **Author/Authors handling** — scraper now checks both `Author` and `Authors` keys (itch.io uses either depending on the page).
- **Release date parsing** — extracted from `<abbr title="...">` for full datetime instead of abbreviated text.
- **NSFW detection** expanded — now also checks game description text and adds `sexual` keyword.

### Added (GitHub Actions)
- **`check_paid.yml`** — runs every 2 days at 04:00 UTC. Removes games that became paid.
- **`check_alive.yml`** — runs every 2 days at 07:00 UTC (staggered 3h after check_paid). Removes dead links.
- **`log_deleted.yml`** — runs after check_paid or check_alive completes. Exports deletion log.
- **`generate_table.yml`** — now triggers after update, check_paid, and check_alive workflows (not just update).
- **`update_csv.yml`** — now triggers after table generation (chained workflow).

### Improved
- **Rate limiting** — random delays (2.5–5s between requests, 15–30s batch pause every 20 requests) to avoid itch.io IP bans. Lighter delays (1–2.5s) for HEAD/status checks.
- **Retry logic** — `requests.Session` with `HTTPAdapter` + `Retry` (3 attempts, exponential backoff 2→4→8s) on 429/500/502/503/504.
- **Network error safety** — games are never deleted on transient network failures. Only confirmed 404/410 or confirmed paid status triggers removal.
- **Markdown table integrity** — pipe characters (`|`) in game data are escaped to prevent table breakage.
- **All fields use `N/A` consistently** — replaced mixed `""`, `"Unknown"`, `"No description"` with uniform `N/A` fallback.

### Changed
- Markdown table columns expanded: added Genre, Tags, Status, Platforms, Publisher, Release Date, Made With, Rating, Session, Languages, Inputs.
- README rewritten with updated architecture diagram, project structure, field documentation.
- Workflow action versions updated to `actions/checkout@v6` and `actions/setup-python@v6` with Python 3.14.

---

## [1.0.5] - 2026-01-12 (Hotfix 🔧)
### Fixed
- UTF-8 decode issue when running `scripts/update_info.py`. See [#16](https://github.com/poli0981/free-games-itchio-list/issues/16).

## [1.0.4] - 2026-01-11 (Added Games + New Features ⭐)

### Added Games
Added 33 games. See [#22](https://github.com/poli0981/free-games-itchio-list/issues/22) and [#23](https://github.com/poli0981/free-games-itchio-list/issues/23).

### New Features
- Delete game with correct link in [`delete_game.py`](/scripts/delete_game.py). See [#20](https://github.com/poli0981/free-games-itchio-list/issues/20).
- Export JSON → `.csv`/`.xlsx` in [`export_csv.py`](/scripts/export_csv.py). See [#21](https://github.com/poli0981/free-games-itchio-list/issues/21).
- Check duplicate data in JSON file in [`check_duplicate.py`](/scripts/check_duplicate.py). See [#19](https://github.com/poli0981/free-games-itchio-list/issues/19).

## [1.0.3] - Date unknown (Improvements ⚙️)

### Improved
- Optimized workflow scheduling.

## [1.0.2] - Date unknown (Hotfix 🔧)

### Fixed
- `temp_link.json` not resetting to `[]` after GitHub Actions run.

## [1.0.1] - 2025-12-31 (Hotfix 🔧)

### Fixed
- Rewrote and added 2 issue templates.
- Updated [CONTRIBUTING](CONTRIBUTING.md).

## [1.0.0] - 2025-12-28 (Initial Release 🚀)

### Added
- Full curated list of free itch.io games with auto-daily updates via GitHub Actions.
- Scraping script ([`update_info.py`](scripts/update_info.py)): add links → scrape title, dev, genre, description, NSFW flag, thumbnail.
- MD table generator ([`generate_md.py`](scripts/generate_md.py)): split by genre, 300 max per file, in `/lists/`.
- Columns: No | Thumb | Name | Dev | Short Desc | Link | Safe | Notes | NSFW.
- [`temp_link.json`](/scripts/temp_link.json) for easy manual adds (Actions process daily).
- Full docs: [DISCLAIMER](/docs/DISCLAIMER.md), [PRIVACY](/docs/PrivacyPolicy.md), [TERMS](/docs/ToS.md), [EULA](/docs/EULA.md), [SECURITY](SECURITY.md), [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md), [CONTRIBUTING](CONTRIBUTING.md), [ACKNOWLEDGEMENTS](/docs/ACKNOWLEDGEMENTS.md).
- Issue and PR templates for bugs, features, and game submissions.
- Badges, TOC, and example table in [README](README.md).

### Fixed
- Multiple scrape bugs (itch.io HTML structure changes).
- Description length overflow → truncated to first sentence + "(see more on itch.io)".
- Table numbering resets per file, primary genre used for grouping.