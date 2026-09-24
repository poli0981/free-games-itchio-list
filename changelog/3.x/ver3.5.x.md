# Changelog — 3.5.x

Release notes for 3.5.0 – 3.5.2, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [3.5.2] - 2026-05-23 (Dead-code cleanup — knip + vulture)

### Added

- **knip** (v6) wired into the webapp as the unused-files / exports /
  dependencies detector — config in [`webapp/knip.json`](../../webapp/knip.json),
  run via `cd webapp && npm run knip`.
- **vulture** configured for the Python pipeline (`[tool.vulture]` in
  [`pyproject.toml`](../../pyproject.toml)) — it catches dead functions, classes, and
  attributes that ruff's `F` rules don't.
- **[`docs/THIRD_PARTY.md`](../../docs/THIRD_PARTY.md)** — a new doc attributing the
  dev-only tooling (knip, vulture, ruff, ESLint, TypeScript), cross-linked from
  [`docs/ACKNOWLEDGEMENTS.md`](../../docs/ACKNOWLEDGEMENTS.md).

### Removed

- **8 unused webapp dependencies**: `react-hook-form`, `@hookform/resolvers`,
  `zod`, `idb-keyval`, `@radix-ui/react-dropdown-menu`,
  `@radix-ui/react-tooltip`, `@tauri-apps/plugin-http`, `@tauri-apps/api`.
- **The unwired Tauri Phase-8b scrape-preview scaffold** —
  `webapp/src/lib/tauri-scrape.ts` and `getRuntimeInfo` / `RuntimeInfo` in
  [`runtime.ts`](../../webapp/src/lib/runtime.ts). It was documented but never wired
  into any UI; [`webapp/TAURI.md`](../../webapp/TAURI.md) was trimmed to match.
- **~20 unused webapp exports / types** — dead helpers (`findChunkFor`,
  `indexByUrl`, `rawUrl`, `useIndex`, `isIdleExpired`, …), the unused
  `EDITABLE_FIELDS` / `READONLY_FIELDS` constants, and 7 unused shadcn/ui
  primitive exports. Exports used only inside their own module were demoted
  from `export` rather than deleted.

### Changed

- `webapp/src/lib/about.ts` `THIRD_PARTY` array trimmed to match the removed
  dependencies.

### Notes

- DX / code-quality only — no runtime behaviour change. `isIdleExpired` was
  already dead (nothing called it), so PAT idle auto-lock is unchanged — still
  not enforced.
- No Tauri / Rust binary boundary change — `Cargo.toml` and `tauri.conf.json`
  stay at `0.1.1`. The Rust `tauri-plugin-http` crate is now unreferenced from
  the front-end — a candidate for a future Rust-side cleanup.
- knip + vulture join `npm run lint`, `ruff check`, and `npm audit` as the
  standing pre-release QA pass.

---

## [3.5.1] - 2026-05-20 (Lint cleanup — zero ESLint problems)

### Changed

- **`npm run lint` now runs clean — 0 errors, 0 warnings** (down from 17 errors + 5 warnings, all pre-existing; v3.5.0 added none).
  - [`webapp/eslint.config.js`](../../webapp/eslint.config.js): `react-refresh/only-export-components` is turned off for `src/components/ui/**` — the vendored shadcn primitives intentionally mix component and variant/constant exports and cannot satisfy the rule without forking upstream. The rule stays on for all other app code.
  - `react-hooks/incompatible-library` is turned off — it only flagged TanStack Table's `useReactTable`, whose API is not React-Compiler-memoizable by design (not actionable).
- **`SortableHeader` extracted** into its own [`webapp/src/components/data-table/sortable-header.tsx`](https://github.com/poli0981/free-games-itchio-list/blob/v3.5.1/webapp/src/components/data-table/sortable-header.tsx); [`columns.tsx`](https://github.com/poli0981/free-games-itchio-list/blob/v3.5.1/webapp/src/components/data-table/columns.tsx) is now a pure column-definition module.

### Fixed

- **`react-hooks/exhaustive-deps`** in [`routes/games.tsx`](../../webapp/src/routes/games.tsx) and [`data-table/faceted-filter.tsx`](https://github.com/poli0981/free-games-itchio-list/blob/v3.5.1/webapp/src/components/data-table/faceted-filter.tsx): values built with `?? []` created a fresh array every render, defeating the `useMemo`s that depended on them. `data` is now wrapped in `useMemo`; the faceted-filter `selected` memo was restructured to depend on a stable value.

### Notes

- DX / code-quality only — no runtime behaviour change. No Tauri / Rust binary change (`Cargo.toml` / `tauri.conf.json` stay `0.1.1`); no `THIRD_PARTY` change.

---

## [3.5.0] - 2026-05-20 (Charts expansion + game-count history + pipeline cleanup)

### Added

- **Six new charts on `/charts`.**
  - **Game count over time** — a `LineChart` of the catalog size by day, backed by a new `data_game/count_history.json` (date-keyed `{date, total}` series). [`scripts/data_store.py`](../../scripts/data_store.py) `_append_count_history()` upserts today's total on every catalog write (last-write-wins per UTC day). `scripts/backfill_count_history.py` is a one-time dev tool that reconstructs the series from git history (`data_game/index.json`, plus the pre-refactor `scripts/game_info.json`). The webapp loads it via `loadCountHistory` / `useCountHistory`.
  - **Genre treemap** — a Recharts `Treemap` with a custom cell renderer that hides labels on rectangles too small to fit them, so it stays legible on mobile.
  - **KPI summary cards** — total games / online / NSFW / deleted / average rating, above the Overview grid.
  - **Deletions over time** (bar, by month), **Deletion reasons** (pie: became-paid vs page-removed), and **Most rated games** (top 10 by `rating_count`).
- **Scroll-to-top button** — a floating bottom-right button that appears after scrolling the main pane. New [`webapp/src/components/scroll-to-top.tsx`](../../webapp/src/components/scroll-to-top.tsx).
- **Python linting** — `ruff` config in a new root `pyproject.toml`; run `ruff check scripts/`.

### Changed

- **`charts.tsx` split into a module.** The monolith is now a `webapp/src/components/charts/` folder — one file per chart, a shared `chart-card.tsx` (`ChartCard` + `PALETTE`), and an `index.ts` barrel. 16 charts across the 4 tabs.
- **`scripts/json_io.py`** — new shared module. `load_json` / `save_json` (previously copy-pasted into both `check_alive.py` and `check_paid.py`) live here now, alongside `dedup_deleted`.
- README + README.vi badges bumped to `3.5.0`.

### Fixed

- **The deleted-games log can no longer accumulate duplicate URLs.** `check_alive.py` and `check_paid.py` appended to `scripts/deleted_games.json` with no guard — a game removed, re-added by the scraper, then removed again would be logged twice. The new `dedup_deleted()` (keyed by URL, keeping the earliest `deleted_at`) runs on every write and inside `log_deleted.py`. Two genuinely different games that share a title but have different urls are kept separate.

### Notes

- No Tauri / Rust binary boundary change — `Cargo.toml` and `tauri.conf.json` stay at `0.1.1`, no `THIRD_PARTY` entries change (Recharts already shipped; `Treemap` / `LineChart` need no new dependency).
- `data_game/count_history.json` is auto-committed by the scrape workflows — the bash wrappers already `git add data_game/` wholesale, so no workflow changes were needed.
- The dead-code sweep found the project already tidy (TS strict mode + ESLint catch unused webapp code). `webapp/src/lib/tauri-scrape.ts` `tauriScrapePreview` was reviewed and intentionally kept as a Phase-8b stub.
