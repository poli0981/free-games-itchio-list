# Changelog — 4.0.x

Release notes for 4.0.0, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [4.0.0] - 2026-09-18 (freeitchgames.win on Cloudflare: read-only site, review queue, new design)

Version 4 moves the website to **https://freeitchgames.win** on Cloudflare, makes it read-only for
everyone (no sign-in), adds a maintainer-only admin with a review queue for new games, replaces the
failing data crawls with a rotating refresh, and splits the licenses (code MIT, data and docs
CC BY 4.0).

### Upgrade notes

- **The web app no longer signs in or edits.** The GitHub-token (PAT) sign-in, in-app editing, the
  Add / Workflows pages and GPG commit signing are gone; on first load the app deletes the
  encrypted token and key it stored before. Suggest games at https://freeitchgames.win/suggest.
- **Old links keep working**: `…github.io/free-games-itchio-list/#/x` redirects to the new site,
  and `#/x` links become `/x`.
- **Desktop and Android apps** are read-only viewers too; they read the catalog from
  freeitchgames.win. Install 4.0.0 over 3.x as usual.
- **New legal terms** (ToS, Privacy Policy, EULA for the apps only, Disclaimer): the site asks you to
  accept them again once.

### New design

- A clean, table-first interface under the name **Free Itch Games**: a top navigation bar with a
  global search (press `/`) and a display menu (theme, language, density, 18+) replaces the
  sidebar, and a **Welcome** page at `/` (catalog status, recently added games) replaces the
  dashboard.
- **Games**: search plus filters for genre, platform, status, tags, language, input, engine,
  minimum rating and "plays in browser", each showing how many games it would match. The search,
  filters, sort and page are kept in the URL, so a filtered list can be bookmarked or shared. Phones
  get a list layout.
- A new game page (cover, key facts, tags that open the matching list, "Report a problem"), a
  searchable removed-games page and a simpler Settings page.
- The first-visit legal gate is now a dialog over the page, so a shared link opens where it
  pointed once the terms are accepted.
- Tailwind CSS 4, the self-hosted Geist typefaces, new icons and social preview image; numbers and
  dates follow the chosen language.

### Website & Worker

- The site is served by a Cloudflare Worker with static assets ([`webapp/wrangler.jsonc`](../../webapp/wrangler.jsonc),
  [`webapp/worker/`](../../webapp/worker)) and the catalog JSON is bundled into every build (`/data/*`,
  plus a sitemap), so each data commit republishes the site; the desktop/Android apps read the same
  files. Real URL paths instead of `#/` routes, per-page canonical URLs, and real 404s for unknown
  pages and missing files (a stale script after a deploy can no longer be cached as HTML).
- **Cover images** are resized once to small WebP copies (Cloudflare Image Transformations + R2)
  and served from `/img/…` — about 4 KB instead of up to 3 MB per cover. Only catalog covers are
  served.
- **18+ games are hidden by default**; a visitor can show them (Settings or the display menu) after
  confirming they are 18 or older (stored only in their browser). The removed-games page is now
  `/removed` (`/deleted` redirects there). Aggregate, cookieless Cloudflare Web Analytics.
- Enforced Content-Security-Policy and security headers; faster first load (~175 KB gzip, charts
  load only when opened); browser floor Safari/iOS 15.4.
- React Router 8, React 19.3, Vite 8 (rolldown), vitest; unused sign-in dependencies (Octokit,
  OpenPGP.js) removed; Tauri drops its HTTP plugin and `Cargo.lock` is committed.

### Adding games: review queue

- **Suggest page** (`/suggest`): anyone can send an itch.io link (+ optional note); protected by
  Cloudflare Turnstile and a rate limit.
- **Browser extension API** (`POST /api/ingest`, Cloudflare Access service token, idempotent) —
  the extension no longer needs a GitHub token.
- **RSS discovery**: every 4 hours the Worker reads one itch.io "new & popular free" feed.
- Everything lands in a **review queue** (Cloudflare D1). The maintainer approves or rejects it in
  the new **admin** (`/admin`, Cloudflare Access), which also edits the three maintainer fields,
  removes games with a public reason (deleting their resized covers) and restores removed games.
  Approved games are committed by a GitHub App (verified commits) and scraped by the pipeline.

### Licenses & legal

- Code stays **MIT** (`LICENSE`, now "2025-2026 poli0981 (SkullMute)"); the catalog data
  ([`data_game/LICENSE.md`](../../data_game/LICENSE.md)) and the documentation are **CC BY 4.0**
  ([`LICENSES/CC-BY-4.0.txt`](../../LICENSES/CC-BY-4.0.txt)); creators' descriptions, cover images and
  trademarks are excluded. [`NOTICE.md`](../../NOTICE.md) sums it up: not affiliated with itch.io.
- Rewritten Terms of Use (with a content-removal process), Privacy Policy (Cloudflare as
  processor, exact browser storage, retention, rights under Vietnam's Law No. 91/2025/QH15 and the
  GDPR), Disclaimer, Security Policy and Code of Conduct, in English and Vietnamese. The EULA now
  covers only the desktop and Android apps. Contact addresses: legal@, privacy@, security@ and
  takedown@freeitchgames.win.
- Issue templates: "Add games" points to the Suggest page, "Remove a game" gained a
  rights-holder section; `CODEOWNERS` added.

### Fixed

- **freeitchgames.win served the unbuilt `webapp/` source tree** (blank page; `/package.json`,
  `/src/*` publicly readable). The Vite web build now goes to `webapp/dist`, which
  [`webapp/wrangler.jsonc`](../../webapp/wrangler.jsonc) deploys (`workers_dev`/`preview_urls` off).
- **All 15 Dependabot alerts / npm audit** — lockfile refreshed in-range (vite 8.3.0,
  react-router-dom 7.18.4, postcss 8.5.28, patched transitive deps); `npm audit` reports 0.
- **Android release workflow** moved off Node 20 actions (setup-java v6, upload-artifact v7,
  setup-android v4, checkout/setup-node v7), SHA-pinned, with a timeout and the tag passed via env.
- **`.gitattributes`** — `* text = auto` / `* eol = lf` were invalid (spaces around `=`); now
  `* text=auto eol=lf` with binary rules, and legal/policy docs ship in source archives again.
- OG image, manifest (`start_url`/`scope`/`id` = `/`), canonical/og URLs, sitemap and robots now
  point at freeitchgames.win; OG title no longer overflows.

### Data pipeline (rewrite)

- **One rotating refresh replaces four failing crawls.** `check_paid` / `check_alive` /
  `update_reviews` / `update_status` each fetched all 2,600+ pages sequentially, overran their
  job timeouts and — saving only at the end — lost every run since late June (with no alert,
  because a timeout ends as *cancelled*). The new [`scripts/refresh.py`](../../scripts/refresh.py)
  (`refresh.yml`, daily) checks one seventh of the catalog with **one request per game**, so every
  game is re-checked weekly (~86% fewer requests to itch.io), and updates alive / paid / rating /
  status (+ backfills release date, thumbnail, `updated_at`) from that single page.
- **Safer removals:** a game is removed only when the same 404/410 or paid status is seen again at
  least 20 hours after it was first seen (single flaky responses no longer delete games). A
  mass-change guard withholds removals — and alerts — when a run would remove or newly strike more
  than max(10, 10%) of the games it checked (the signature of an itch.io markup change rather than
  a real wave of paid games); withheld games stay withheld in later runs until a healthy check or
  an explicit `allow_mass_removal` dispatch, checkpoints of an interrupted scan never remove games,
  and `apply_patch.py` re-checks the limits. Overlapping scans can no longer undo each other's
  newer checks.
- **Scan → patch → apply:** scanners emit a URL-keyed patch; [`apply_patch.py`](../../scripts/apply_patch.py)
  applies it to the latest `main`, validates, and [`bash/commit_push.sh`](../../bash/commit_push.sh)
  retries on push races. Concurrent writers (extension, workflows, future admin) no longer clobber
  each other; checkpoints + an in-script deadline keep partial work.
- **Ingest** (`update.yml`, now runs as soon as the queue changes): canonical URLs, skips games in
  the deleted log (the removed-then-re-added bug), retries transient failures (3 attempts at least
  6 hours apart; rate limiting never counts) instead of dropping them, stamps `added_at`, and never
  wipes links queued meanwhile. A dispatched `url` is processed first and kept in the queue until it
  reaches a final outcome, and queued runs wait in FIFO order (`queue: max`) instead of replacing
  each other.
- `force_update.yml` runs `refresh.py --full` in rotating batches (a full re-scrape no longer times out).
- Honest `FreeItchGamesBot` User-Agent, explicit 429 / Retry-After handling (capped), unbuffered
  logs, run summaries, Discord alerts on failure / cancel / rate limit.
- `data_store.py` keeps games in their chunk and only writes changed bytes; `index.json` /
  `count_history.json` change only when data does — no more no-op commits.
- New [`validate.py`](../../scripts/validate.py) (schema, canonical URLs, duplicates, index consistency)
  gates every pipeline commit and runs in the new Python CI with a network-free pytest suite.
  Normalized one invalid `safe_virus` value (`"y"` → `"Yes"`).

### Removed

- `lists/*.md` genre tables, `generate_md.py`, `generate_table.yml`, `deleted_games.txt`,
  `log_deleted.*` — the catalog is web-only (freeitchgames.win).
- Telegram bot ingest (`bot-ingest.yml`, `game_via_bot` issue template) — retired.
- The web app's sign-in, editing, Add and Workflows pages, GPG signing, and the GitHub Pages
  deployment (`deploy_webapp.yml`, `notify-deploy.yml`, `pages-redirect/`; Pages keeps serving the
  redirect stub it last published).
- `notify-ci-failure.yml` (replaced by in-workflow notifications) and the old per-task bash wrappers.

### CI / security

- All actions SHA-pinned at current majors; `permissions: {}` by default with per-job grants;
  reusable workflows pinned by SHA with only the secrets they need; script-injection patterns in
  `announce-discussion.yml` fixed (and it now posts only for `CHANGELOG.md` changes).
- Release: one `create-release` job makes the draft that desktop (tauri-action v1, `releaseId`) and
  Android upload into; release builds use no dependency caches. Publish with
  `gh release edit vX --draft=false`.
- `.github/dependabot.yml` (npm / pip / actions / cargo), Python and web-app PR checks, and an
  hourly check of main's latest Cloudflare Workers Build that posts each failed build to Discord
  once (a `check_run` relay would miss the pipeline's own data commits).
- One refresh pipeline (scan → apply) runs at a time, so overlapping refresh / force-update runs
  can't undo each other.
- Cancelling a refresh / force-update or a desktop release run now really stops it (`!cancelled()`
  instead of `always()` on the push / build jobs).

### Changed

- The old GitHub Pages address serves a redirect stub that forwards to freeitchgames.win
  (keeping `#/` routes) and deletes the old app's token and key storage on that origin.
- Security headers in [`webapp/public/_headers`](../../webapp/public/_headers) (CSP, Referrer-Policy,
  frame denial, Permissions-Policy, COOP) and immutable caching for hashed `/assets/*`.
- Pipeline logs are unbuffered UTF-8.
