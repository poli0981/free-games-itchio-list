# Changelog

All notable changes to this project will be documented here.

## [3.5.0] - 2026-05-20 (Charts expansion + game-count history + pipeline cleanup)

### Added

- **Six new charts on `/charts`.**
  - **Game count over time** — a `LineChart` of the catalog size by day, backed by a new `data_game/count_history.json` (date-keyed `{date, total}` series). [`scripts/data_store.py`](scripts/data_store.py) `_append_count_history()` upserts today's total on every catalog write (last-write-wins per UTC day). [`scripts/backfill_count_history.py`](scripts/backfill_count_history.py) is a one-time dev tool that reconstructs the series from git history (`data_game/index.json`, plus the pre-refactor `scripts/game_info.json`). The webapp loads it via `loadCountHistory` / `useCountHistory`.
  - **Genre treemap** — a Recharts `Treemap` with a custom cell renderer that hides labels on rectangles too small to fit them, so it stays legible on mobile.
  - **KPI summary cards** — total games / online / NSFW / deleted / average rating, above the Overview grid.
  - **Deletions over time** (bar, by month), **Deletion reasons** (pie: became-paid vs page-removed), and **Most rated games** (top 10 by `rating_count`).
- **Scroll-to-top button** — a floating bottom-right button that appears after scrolling the main pane. New [`webapp/src/components/scroll-to-top.tsx`](webapp/src/components/scroll-to-top.tsx).
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

---

## [3.4.1] - 2026-05-17 (Hotfix: DataTable column alignment + Discussion-announce auto-discovery)

### Fixed

- **DataTable columns misaligned at desktop widths.** Header used native table-layout (`<table className="w-full">` + `<th style={{width}}>`) while body rows used flex layout (`position: absolute` + `flex w-full`, cells with `flex: 0 0 Npx` / `1 1 0`). Native table-layout stretched the 8 size-less columns to fill the container based on content, but the absolutely-positioned body `<tr>` never participated in table layout — so its flex children stayed at their fixed flex-basis. Result: at the Tauri default 1280×800 window (and any viewport wider than the natural sum of header content widths) header columns drifted off the cells below them. [`webapp/src/components/data-table/data-table.tsx`](webapp/src/components/data-table/data-table.tsx) now renders the header `<tr>` with `flex w-full` and each `<th>` with `flex h-10 items-center` + the same `flex: 0 0 Npx` / `1 1 0` style block as the body `<td>` — header and body now compute width identically. Helper `priorityHeaderClass` (which emitted `table-cell` variants) is gone; the existing `priorityClass` (`flex` variants) now drives both. No change to column definitions in [`columns.tsx`](webapp/src/components/data-table/columns.tsx).
- **`announce-discussion.yml` was a silent no-op since v3.2.0.** Both jobs (`announce-release`, `announce-docs`) gated on three repo variables (`DISCUSSION_REPO_ID`, `DISCUSSION_ANNOUNCEMENTS_CATEGORY_ID`, `DISCUSSION_GENERAL_CATEGORY_ID`) that had never been configured — the validation step printed `::warning::… Skipping.` and `exit 0`, so every release silently failed to post to Discussions without surfacing a failed run. Replaced the two validation steps with a `Discover Discussion IDs` step that queries `gh api graphql` for `repository.id` and looks up the category by slug (`announcements` / `general`). Zero config now — works on any repo with Discussions enabled. Fails loudly with a clear `::error::` message if Discussions isn't enabled or the expected category is missing. Dropped the dependency on `vars.DISCUSSION_*` and removed every `if: steps.validate.outputs.ids_ok == 'true'` gate.

### Changed

- **README + README.vi badges** bumped to `3.4.1`.

### Notes

- This is a webapp + CI hotfix. No Python pipeline changes, no Tauri / Rust binary boundary change — `Cargo.toml` and `tauri.conf.json` stay at `0.1.1`, no THIRD_PARTY entries change.
- The leftover `DISCUSSION_REPO_ID` / `DISCUSSION_ANNOUNCEMENTS_CATEGORY_ID` / `DISCUSSION_GENERAL_CATEGORY_ID` repo variables (if you set them earlier) are now unused and can be removed from Settings → Variables.

---

## [3.4.0] - 2026-05-16 (Periodic refresh workflows + UTF-8 round-trip fix)

### Added

- **Update reviews — bi-weekly workflow.** New [`scripts/update_reviews.py`](scripts/update_reviews.py), wrapper [`bash/update_reviews.sh`](bash/update_reviews.sh), and [`.github/workflows/update_reviews.yml`](.github/workflows/update_reviews.yml) re-scrape every existing game's itch.io page on the 1st and 15th of each month (05:00 UTC) and write fresh `rating` + `rating_count`. Network errors / 404 keep the old values. Touches only those two fields — everything else (annotations, metadata) is left alone.
- **Update status — monthly workflow.** New [`scripts/update_status.py`](scripts/update_status.py), [`bash/update_status.sh`](bash/update_status.sh), and [`.github/workflows/update_status.yml`](.github/workflows/update_status.yml) refresh the `status` field on the 1st of each month (06:00 UTC). Same skip-on-error semantics.
- **Force update — manual emergency button.** New [`scripts/force_update.py`](scripts/force_update.py), [`bash/force_update.sh`](bash/force_update.sh), and [`.github/workflows/force_update.yml`](.github/workflows/force_update.yml) accept an optional `url` input. Empty input re-scrapes every game; a single URL targets just that one. `workflow_dispatch` only — no schedule. Every run preserves the three user-editable annotations (`safe_virus`, `notes`, `nsfw`) per the read/write field convention in [CLAUDE.md](CLAUDE.md). Doubles as the canonical repair tool for mojibake left by older webapp commits — re-scrape pulls clean UTF-8 from itch.io.
- **`generate_table.yml` chained on the three new workflows** so `lists/*.md` stay in sync after any data mutation.

### Fixed

- **UTF-8 mojibake on webapp commits.** [`webapp/src/lib/github/contents.ts`](webapp/src/lib/github/contents.ts) `readFileWithSha` and [`webapp/src/lib/github/git-data.ts`](webapp/src/lib/github/git-data.ts) `bulkDeleteGames` were decoding GitHub's base64 content with `atob` alone, producing a Latin-1 binary string. Multi-byte UTF-8 sequences (e.g. Vietnamese `ã` = `0xC3 0xA3`) became two Latin-1 code points (`Ã£`); the next write re-encoded them as UTF-8 bytes, double-corrupting on every edit. Confirmed live damage in `data_game/game_info_002.json` (`BotÃÂÃÂ£o Esquerdo` was originally `Botão Esquerdo`). Extracted a shared helper [`webapp/src/lib/github/encoding.ts`](webapp/src/lib/github/encoding.ts) (`base64ToUtf8` / `utf8ToBase64`) that uses `TextDecoder('utf-8')` / `TextEncoder` and routes both call sites through it. Write path was already correct.

### Notes

- **Repair existing mojibake**: after this release deploys, run `Force update` once via `workflow_dispatch` with no input. It re-scrapes every game (~15–25 min) and writes back clean UTF-8 while preserving manual annotations. `generate_table.yml` will then auto-regenerate the markdown lists.
- **Browser cache**: anyone editing via the webapp should hard-refresh once after the new build lands so they're not using the pre-fix bundle (which would continue to mangle non-Latin chars on the next edit).
- **README + README.vi badges** bumped to `3.4.0`. No Tauri / Rust binary change — `Cargo.toml` and `tauri.conf.json` stay at `0.1.1`.

---

## [3.3.0] - 2026-05-16 (Mobile polish + Settings + in-browser GPG commit signing)

### Added

- **In-browser GPG commit signing.** Every write the webapp makes (single-file edits, bulk edit/delete, queueing URLs) can now be GPG-signed client-side. New `webapp/src/lib/gpg/` module: [`canonicalize.ts`](webapp/src/lib/gpg/canonicalize.ts) builds the exact byte string Git would hash, [`sign.ts`](webapp/src/lib/gpg/sign.ts) lazy-imports `openpgp` and exposes `loadPrivateKey` / `signCommit` / `verifyDetached`, [`storage.ts`](webapp/src/lib/gpg/storage.ts) wraps localStorage helpers. Verified byte-for-byte against `git cat-file commit <sha>` so the signed canonical exactly matches what GitHub will recompute (no trailing-newline drift). Private keys are decrypted once at import and re-encrypted with the webapp passphrase (AES-GCM, same scheme as the PAT) — `openpgp` is loaded only when the Commit Signing card is opened or a commit is being signed (`vendor-openpgp` chunk, ~129 KB gz, lazy).
- **Settings → Commit signing card.** New [`webapp/src/components/settings/gpg-card.tsx`](webapp/src/components/settings/gpg-card.tsx) — three states (not configured / locked / unlocked) with Import (paste armored or upload `.asc`), Unlock, Test sign (round-trip verify), Copy public key, Lock, Remove. Shows the imported key's UIDs as badges and flags a clear mismatch warning if the configured commit-author email isn't in the key's UID list (the most common cause of GitHub's "Someone may be trying to trick you" warning). After import, primary UID email auto-populates Commit author so commits Verify on the first try.
- **Settings Phase A — Appearance / Session / Commit author / Notifications cards.** [`webapp/src/routes/settings.tsx`](webapp/src/routes/settings.tsx) gained four new cards backed by extended preferences in [`webapp/src/stores/prefs.ts`](webapp/src/stores/prefs.ts): theme picker (Light / Dark / System), layout density (Normal / Compact), sidebar collapse mirror, idle-timeout slider (5 / 15 / 30 / 60 / 120 min — replaces the hard-coded 30-min constant in [`auth.ts`](webapp/src/stores/auth.ts)), commit-author name/email override, toast enable + duration. Density applies via `html[data-density='compact']` rules in [`index.css`](webapp/src/index.css); toasts are gated through a new [`AppToaster`](webapp/src/components/app-toaster.tsx) wrapper that reads prefs.
- **Mobile card view for the games table.** New [`webapp/src/lib/use-is-mobile.ts`](webapp/src/lib/use-is-mobile.ts) (`matchMedia('(max-width: 767px)')`) and [`webapp/src/components/data-table/mobile-card-list.tsx`](webapp/src/components/data-table/mobile-card-list.tsx). Below the `md` breakpoint, [`DataTable`](webapp/src/components/data-table/data-table.tsx) renders a stacked card list (thumbnail + name + dev + genre/status/NSFW/safe badges, tap-to-detail, selection checkbox) instead of the 9-column virtualized table that overflowed at 430 px. Pagination is shared between both views.
- **Workflows route mobile fallback.** [`workflows.tsx`](webapp/src/routes/workflows.tsx) now dual-renders the action picker — a `<Select>` dropdown below `md`, the existing `TabsList` at `md` and above. Fixes the overflow from five `whitespace-nowrap` triggers in an `inline-flex` TabsList at 430 px viewport.

### Changed

- **All write paths route through the Git Data API.** [`webapp/src/lib/github/contents.ts`](webapp/src/lib/github/contents.ts) `putFile` (`PUT /repos/.../contents/{path}`) is gone — that endpoint authors commits as the PAT and never accepts a `signature` field. Replaced with `commitSingleFile` which delegates to [`atomicCommit`](webapp/src/lib/github/git-data.ts) so single-file edits (game annotations, `temp_link.json` queue) get the same signer plumbing as bulk operations. `atomicCommit` gained an optional `signer` parameter (defaulting to [`getSignerIfEnabled()`](webapp/src/lib/github/signer.ts)) that, when present, builds the canonical commit object, signs detached binary-mode via openpgp, and passes `author` / `committer` / `signature` to `git.createCommit`. Commit author identity falls back through prefs override → imported key's primary UID email → GitHub user.
- **About page** lists `OpenPGP.js` 6.3 under Data dependencies; the [`webapp/vite.config.ts`](webapp/vite.config.ts) `manualChunks` rule emits a dedicated `vendor-openpgp` chunk so the cost is only paid when a user opens the signing card.
- **README + README.vi badges** bumped to `3.3.0`.

### Fixed

- **Workflows `/workflows` tabs no longer overflow on mobile.** Pre-fix: five `whitespace-nowrap` triggers in an `inline-flex` TabsList blew past a 430 px viewport.
- **DataTable no longer overflows on mobile.** Pre-fix: nine fixed-width columns minus three responsive-hidden ones still exceeded 430 px.

---

## [3.2.1] - 2026-05-11 (Hotfix: single-instance enforcement on desktop)

### Fixed

- **Desktop app spawned a new process on every launch.** Each double-click of the installed app added another `free-games-itchio-webapp.exe` (Windows) / equivalent on macOS+Linux to the task list instead of focusing the existing window. Added [`tauri-plugin-single-instance`](https://tauri.app/plugin/single-instance/) v2 in [`webapp/src-tauri/src/lib.rs`](webapp/src-tauri/src/lib.rs) — second launch now unminimizes + focuses the running window and exits its own process before creating a duplicate. Plugin registered first in the builder chain per Tauri 2 docs so duplicate processes die before initializing HTTP/opener plugins. Gated by `#[cfg(desktop)]` + matching `cfg(not(android, ios))` in [`Cargo.toml`](webapp/src-tauri/Cargo.toml). Desktop binary boundary change → bumped [`Cargo.toml`](webapp/src-tauri/Cargo.toml) and [`tauri.conf.json`](webapp/src-tauri/tauri.conf.json) from `0.1.0` to `0.1.1` (first time these have moved since v3.0.0).

### Changed

- **README + README.vi badges** bumped to `3.2.1`.
- **About page** lists `tauri-plugin-single-instance` v2 under Desktop dependencies.

---

## [3.2.0] - 2026-05-10 (CI cleanup + mobile + SEO + Telegram bot path + auto-discussion)

### Added

- **Mobile drawer navigation.** New [`webapp/src/components/ui/sheet.tsx`](webapp/src/components/ui/sheet.tsx) (shadcn pattern over the existing `@radix-ui/react-dialog`) and a `MobileTopBar` in [`webapp/src/components/sidebar.tsx`](webapp/src/components/sidebar.tsx). Below `md`, the sidebar collapses behind a hamburger; above, the desktop sidebar behaves as before. Touch targets in the nav now meet the 44pt iOS HIG minimum on small screens.
- **DataTable column priorities.** Each column declares `meta.priority: 1 | 2 | 3` in [`columns.tsx`](webapp/src/components/data-table/columns.tsx). [`data-table.tsx`](webapp/src/components/data-table/data-table.tsx) hides priority 2 below `md` and priority 3 below `lg`, so the table is usable on a phone without horizontal scrolling through every column.
- **PWA manifest + icons.** [`webapp/public/manifest.webmanifest`](webapp/public/manifest.webmanifest), [`icon-192.png`](webapp/public/icon-192.png), [`icon-512.png`](webapp/public/icon-512.png) — Add to Home Screen on iOS without a service worker. Generator script: [`webapp/scripts/gen_assets.py`](webapp/scripts/gen_assets.py).
- **SEO infrastructure.** [`webapp/index.html`](webapp/index.html) now ships description, theme-color (per scheme), Open Graph (title/description/image/url/type/locale), Twitter card (`summary_large_image`), `canonical`, `apple-touch-icon`, `manifest`, and `preconnect` to `img.itch.zone` + `raw.githubusercontent.com`. [`robots.txt`](webapp/public/robots.txt) and [`sitemap.xml`](webapp/public/sitemap.xml) added under `webapp/public/`.
- **OG image.** [`webapp/public/og.png`](webapp/public/og.png) (1200×630) + [`og.webp`](webapp/public/og.webp) generated by `gen_assets.py`. Brand-coloured (`#863bff` purple, cyan accent) with project name, tagline, and URL.
- **Per-route titles.** New [`useDocumentTitle`](webapp/src/hooks/useDocumentTitle.ts) hook (no `react-helmet-async` dependency). Each route now sets a contextual title (`Charts — Itch.io Free Games Database`, etc.); game-detail uses the game name.
- **Hash-anchor scroll.** [`App.tsx`](webapp/src/App.tsx) now wires a `ScrollToHash` listener so links like `/about#support` scroll to the matching element under HashRouter.
- **About page Telegram entries.** New `messaging` social group with **Telegram (DM)** and **Telegram bot (game submission)** plus a privacy reminder to never paste a numeric ID into public channels. About also surfaces all five FUNDING.yml destinations (GitHub Sponsors, Patreon, Ko-fi, Buy Me a Coffee, PayPal) with a footnote on PayPal explaining the legal-name receipt.
- **Sidebar Support link.** Persistent heart-icon link from the sidebar (collapsed and expanded) to `/about#support`.
- **Telegram bot contribution flow.** [`CONTRIBUTING.md §1b`](CONTRIBUTING.md#1b-add-games-via-telegram-bot-my_skull_bot--alternative-to-issues) describes the bot path (DM owner → numeric ID added to local whitelist → bot dispatches `bot-ingest.yml`). Cross-linked from [README.md](README.md), [README.vi.md](README.vi.md), and the new [issue template `game_via_bot.yml`](.github/ISSUE_TEMPLATE/game_via_bot.yml). Vietnamese mirror in [`docs/i18n/vi/CONTRIBUTING.md`](docs/i18n/vi/CONTRIBUTING.md).
- **Privacy + ToS clauses for the bot path.** [`docs/ToS.md §14`](docs/ToS.md) and [`docs/PrivacyPolicy.md §15`](docs/PrivacyPolicy.md) (plus VI mirrors) document Telegram-ID handling: opt-in, operator-side whitelist only, never committed to this repo, removable on DM.
- **`docs/pc_spec.md` + `docs/dev_env.md` (EN + VI).** Maintainer hardware spec, mobile test devices (iPhone 14 Pro / 13 Pro Max, iOS 26.x on Chrome + Brave), and dev-env toolchain (Python 3.12, Node ≥ 22, Rust stable, JetBrains 2026.x). Cross-linked from README and CONTRIBUTING.
- **Auto-create GitHub Discussion workflow.** [`announce-discussion.yml`](.github/workflows/announce-discussion.yml) — on `release: published` posts to the **Announcements** category; on push to `docs/**` / `CHANGELOG.md` / `README*.md` posts to **General**, gated by `[skip-discuss]` in the head-commit message and a quiet skip on `bot-ingest:` commits. Uses `gh api graphql` directly (no third-party action). Setup: configure repo variables `DISCUSSION_REPO_ID`, `DISCUSSION_ANNOUNCEMENTS_CATEGORY_ID`, `DISCUSSION_GENERAL_CATEGORY_ID` (run the GraphQL pre-flight query in the workflow header to fetch them).

### Changed

- **CI notify wrappers.** [`notify-ci-failure.yml`](.github/workflows/notify-ci-failure.yml), [`notify-deploy.yml`](.github/workflows/notify-deploy.yml), and [`notify-release-pipeline.yml`](.github/workflows/notify-release-pipeline.yml) replace `workflows: ["*"]` with explicit allowlists. Every workflow run no longer fans out to all three wrappers; the Actions tab is much quieter and the per-event reusable filtering is what it always should have been.
- **`bot-ingest.yml` cleanup.** Removed a dead final step that referenced a non-existent `${{ secrets.BOT_TOKEN }}` and a `result.txt` file. The Python `success`/`failure` Telegram callback steps above already handle both outcomes.
- **Image hints.** Game thumbnails in [`columns.tsx`](webapp/src/components/data-table/columns.tsx) and the hero in [`game-detail.tsx`](webapp/src/routes/game-detail.tsx) now declare `width`/`height` (CLS), `decoding="async"`, and `fetchPriority` (high for hero, low for table rows). itch.io thumbnails remain external — full WebP recompression is intentionally deferred (would require an image proxy).
- **About support card** mirrors `.github/FUNDING.yml` exactly: 5 entries (GitHub Sponsors, Patreon, Ko-fi, BMC, PayPal).
- **README + README.vi badges** bumped to `3.2.0`.

### Fixed

- **Bot ingest workflow** had a broken final telegram callback step (wrong secret name + missing input file). Removed; the working callback steps above are unaffected.

### Setup notes for maintainers (one-time, post-merge)

To enable the auto-discussion workflow, run once:

```sh
gh api graphql -f query='query{repository(owner:"poli0981",name:"free-games-itchio-list"){
  id
  discussionCategories(first:20){nodes{id slug name}}
}}'
```

Then in repo Settings → Secrets and variables → Actions → Variables, add:

- `DISCUSSION_REPO_ID` — the `repository.id` from the response.
- `DISCUSSION_ANNOUNCEMENTS_CATEGORY_ID` — the `id` of the Announcements category.
- `DISCUSSION_GENERAL_CATEGORY_ID` — the `id` of the General category.

Without these set, the workflow runs but no-ops with a warning (safe default).

---

## [3.1.4] - 2026-05-05 (Legal docs rewrite + Vietnamese i18n + Legal Card + UI polish)

### Added
- **Vietnamese translations** under [`docs/i18n/vi/`](docs/i18n/vi/) — full
  translations of the four legal docs (DISCLAIMER, EULA, ToS, PrivacyPolicy)
  plus CONTRIBUTING, CODE_OF_CONDUCT, and SECURITY. Each file notes that the
  English version is the controlling text for legal interpretation.
- **`README.vi.md`** at repo root — Vietnamese mirror of the main README, with a
  language badge and a link back to the English version.
- **About page → "Legal & policies" Card** — single place to access all policy
  files (Disclaimer, EULA, ToS, Privacy, Code of Conduct, Security, License,
  Changelog) plus a pointer to the Vietnamese translations.
- **`webapp/src/lib/about.ts`**: `LegalLink` interface + `LEGAL_LINKS` array +
  `LEGAL_VI_INDEX_URL`. Same structured pattern as `THIRD_PARTY` and
  `SOCIAL_LINKS`.

### Changed
- **`docs/DISCLAIMER.md`, `docs/EULA.md`, `docs/ToS.md`, `docs/PrivacyPolicy.md`**:
  rewritten to be tighter and more enforceable while keeping the project's voice.
  Each doc now has a TL;DR, numbered sections, definitions, severability,
  governing law (Socialist Republic of Vietnam), explicit "not legal advice"
  notice, and a removal-request path. Privacy Policy adds a per-storage table
  for what the webapp persists locally and a step-by-step PAT lifecycle.
- **`README.md`** version badge → 3.1.4 plus a Vietnamese language badge and a
  short pointer to `README.vi.md` and `docs/i18n/vi/`.

### Optional UI
- **Tauri desktop**: maximize button is now disabled (`maximizable: false` in
  `webapp/src-tauri/tauri.conf.json`). Window is still resizable; only the
  full-window-maximize action is locked.
- **DataTable**: scrollbar hidden via a new `.scrollbar-hide` Tailwind utility
  added to `webapp/src/index.css`. Scrolling still works; the chrome is gone.

---

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