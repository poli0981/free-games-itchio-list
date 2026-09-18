# webapp/

One codebase for everything people see of the catalog:

- the website **<https://freeitchgames.win>** — read-only for everyone (no accounts, no sign-in);
- its **Cloudflare Worker** — image proxy, the public Suggest form, the browser-extension ingest API,
  the admin API and the scheduled RSS discovery;
- the **admin** app at `/admin/` — Maintainer only, behind Cloudflare Access;
- the **desktop and Android apps** — the same public app wrapped with Tauri 2 (see [`TAURI.md`](TAURI.md)).

Stack: React 19 + TypeScript 6 + Vite 8 (Rolldown) + Tailwind CSS 4 (`@tailwindcss/vite`, tokens in
[`src/index.css`](src/index.css)) + shadcn/ui (Radix), TanStack Query, React Router 8, Zustand, and the
self-hosted Geist fonts. The Worker is plain TypeScript on Cloudflare Workers
(R2, D1, Images, Turnstile, Rate Limiting, Access).

The v3 features (GitHub PAT sign-in, in-app editing, the Add / Workflows pages, GPG commit signing)
are gone. On first load the app deletes what v3 left in browser storage (the encrypted token and GPG
key entries) and rewrites old `#/…` links to real paths ([`src/lib/legacy.ts`](src/lib/legacy.ts)).

## What's in here

| Path | What |
|---|---|
| [`src/`](src/) | Public app (web + Tauri apps) |
| [`admin/`](admin/) | Admin app, built to `dist/admin/` (web only) |
| [`worker/`](worker/) | Cloudflare Worker ([`worker/index.ts`](worker/index.ts) lists the routes) |
| [`worker/migrations/`](worker/migrations/) | D1 schema for the review queue |
| [`vite-plugins/catalog-data.ts`](vite-plugins/catalog-data.ts) | Bundles the catalog into `dist/data/` + `sitemap.xml` |
| [`public/`](public/) | Static files; [`public/_headers`](public/_headers) sets headers + CSP for them |
| [`src-tauri/`](src-tauri/) | Tauri 2 shell for the desktop and Android apps |
| [`scripts/`](scripts/) | `gen_assets.py` (PWA icons + OG image), `i18n-edit.mjs` (edit `en`/`vi` keys together) |
| [`wrangler.jsonc`](wrangler.jsonc) | Worker config: assets, bindings, vars, cron, `staging` env |

## Local dev

Requires Node.js 22.22+ (CI uses the version in [`.node-version`](.node-version)) and npm. The full
setup, including the Python pipeline, is in [`docs/dev_env.md`](../docs/dev_env.md).

```sh
npm ci
npm run dev        # public app, http://localhost:5173 (serves /data from ../data_game)
npm run build      # tsc -b + vite build → dist/ (app, /admin/, /data, sitemap.xml)
npm run preview    # serve dist/ without the Worker
```

Vite proxies `/api` and `/img` to the Worker on port 8787, so covers, the Suggest form and the
admin API only work while it runs. In a second terminal:

```sh
npm run build                                            # once: the Worker serves dist/ as its assets
npx wrangler d1 migrations apply freeitchgames --local   # once, and after a new migration
npx wrangler dev                                         # Worker, http://localhost:8787 (= npm run cf:dev)
```

Local D1 / R2 state lives in `.wrangler/` (gitignored). Secrets go in `webapp/.dev.vars`
(gitignored); values there also override the `vars` in `wrangler.jsonc` for local runs:

| Key | Needed for |
|---|---|
| `DEV_ADMIN_EMAIL` | Admin without Access. Honoured only on `localhost` / `127.0.0.1` / `[::1]` |
| `ADMIN_EMAILS` | Comma-separated admin emails, checked behind Access (not needed with `DEV_ADMIN_EMAIL`) |
| `TURNSTILE_SECRET` | Suggest form (with the `TURNSTILE_SITEKEY` var) |
| `GH_APP_PRIVATE_KEY` | Admin writes (with the `GH_APP_ID` / `GH_APP_INSTALLATION_ID` vars) |

A route whose settings are missing answers `503`; the public site works without any of them.
Details (Suggest from localhost, admin writes, testing the cron) are in
[`docs/dev_env.md`](../docs/dev_env.md#worker-local).

Path alias `@/*` → `src/*`. Vite injects `__BUILD_DATE__` for the About page.

## Checks

The same steps as [`webapp-ci.yml`](../.github/workflows/webapp-ci.yml):

```sh
npm run cf:types -- --check          # worker-configuration.d.ts matches wrangler.jsonc
npm run lint                         # ESLint
npm run knip                         # unused files / exports / deps
npm test                             # Vitest: app + Worker (D1 tests run a local workerd)
npm run build                        # includes tsc -b (or run npx tsc -b on its own)
npx wrangler deploy --dry-run --env=""
```

After editing `wrangler.jsonc`, run `npm run cf:types` and commit the regenerated
`worker-configuration.d.ts`. It reads the empty [`types.env`](types.env), never `.dev.vars`, so your
local secrets can't leak into it. Secrets are typed by hand in [`worker/env.ts`](worker/env.ts).

## Routes (public app)

| Route | File | Purpose |
|---|---|---|
| `/` | [src/routes/welcome.tsx](src/routes/welcome.tsx) | Welcome: catalog status, what the site does, recently added games |
| `/games` | [src/routes/games.tsx](src/routes/games.tsx) | Search, filters and sort kept in the URL ([src/lib/game-filters.ts](src/lib/game-filters.ts)); a table on desktop, a list on phones; 100 per page |
| `/games/:slug` | [src/routes/game-detail.tsx](src/routes/game-detail.tsx) | Read-only detail view of one game |
| `/charts` | [src/routes/charts.tsx](src/routes/charts.tsx) | Charts + KPI cards across 4 tabs |
| `/removed` | [src/routes/deleted.tsx](src/routes/deleted.tsx) | Removed games, with reasons (`/deleted` redirects here) |
| `/suggest` | [src/routes/suggest.tsx](src/routes/suggest.tsx) | Suggest a game (Turnstile, goes to the review queue) |
| `/settings` | [src/routes/settings.tsx](src/routes/settings.tsx) | Theme, language, density, 18+ content opt-in (the header's display menu has the same) |
| `/about` | [src/routes/about.tsx](src/routes/about.tsx) | Project info, legal links, third-party credits |
| `/errors/:code` | [src/routes/error-preview.tsx](src/routes/error-preview.tsx) | Hidden error-page preview (not in the nav) |

[`src/App.tsx`](src/App.tsx) declares them. The website uses real paths (`BrowserRouter`); the
Tauri apps use hash routes (`HashRouter`) on their custom protocol
([`src/components/app-router.tsx`](src/components/app-router.tsx)). The Worker serves the app shell
with `200` for known routes, `404` for anything else and a `301` for renamed routes
(`/deleted` → `/removed`), so [`worker/spa.ts`](worker/spa.ts) must be kept in sync with `App.tsx`.
Every route except `/`, `/games`, `/removed` and the Not Found page is `React.lazy`.

## Admin (`/admin/`)

Maintainer only. Cloudflare Access (the "Admin" application) guards `/admin` and `/api/admin/*`, and
the Worker re-verifies the Access JWT and the `ADMIN_EMAILS` allow-list on every request
([`worker/access.ts`](worker/access.ts), [`worker/admin.ts`](worker/admin.ts)). The app shell is only
served after that check. Pages (hash routes): **Review queue**, **Add games**, **Catalog** (edit
`safe_virus` / `notes` / `nsfw`, remove or restore a game).

Writes go to the repo as a **GitHub App** (GraphQL `createCommitOnBranch`, so commits are
"Verified"; [`worker/github.ts`](worker/github.ts), [`worker/repo.ts`](worker/repo.ts)). Approving a
link commits it to `scripts/temp_link.json`, which starts the `update.yml` ingest workflow. The
Maintainer's email is kept only in the D1 audit log, never in commits.

## Worker

Existing static files (the app, `/data/*`) are served by the assets layer without running the
Worker. It runs for `wrangler.jsonc` `assets.run_worker_first` (`/img/*`, `/api/*`, `/admin`,
`/admin/*`) and for every request that matches no file.

| Path | File | Purpose |
|---|---|---|
| `/img/<160\|640>/<path>` | [worker/img.ts](worker/img.ts) | Resized WebP covers, stored in R2; only thumbnails that are in the catalog (`/data/urls.json`), upstream fixed to `img.itch.zone` |
| `/api/health` | [worker/index.ts](worker/index.ts) | Health check |
| `/api/suggest` | [worker/suggest.ts](worker/suggest.ts) | Suggest form: same-origin POST, per-IP rate limit, Turnstile, canonical itch.io URL, note ≤ 500 chars |
| `/api/ingest` | [worker/ingest.ts](worker/ingest.ts) | Browser extension: Access service token, `Idempotency-Key`, rate limit per token |
| `/api/admin/*` | [worker/admin.ts](worker/admin.ts) | Admin API (queue, add, edit, remove, restore) |
| `/admin`, `/admin/*` | [worker/admin.ts](worker/admin.ts) | Admin app shell, after the Access check |
| anything else | [worker/spa.ts](worker/spa.ts) | App shell for routes, real 404 for missing files |

**Cron** (`23 */4 * * *`, [`worker/discover.ts`](worker/discover.ts)): polls **one** itch.io RSS feed
per run into the review queue, then does queue bookkeeping (queued → ingested / failed) and retention
(idempotency records after 7 days, Suggest notes after 180). Nothing enters the catalog without the
Maintainer's approval.

**Bindings**: `ASSETS`, `THUMBS` (R2 `freeitchgames-thumbs`), `DB` (D1 `freeitchgames`),
`RL_SUGGEST` / `RL_INGEST` (rate limits). **Vars**: `SITE_ORIGIN`, `GITHUB_REPO`, `BOT_UA`, `GH_APP_ID`,
`GH_APP_INSTALLATION_ID`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD_ADMIN`, `ACCESS_AUD_INGEST`,
`TURNSTILE_SITEKEY`. **Secrets**: `GH_APP_PRIVATE_KEY`, `ADMIN_EMAILS`, `TURNSTILE_SECRET`
(`DEV_ADMIN_EMAIL` is for local runs only). Logs: Workers Observability, 10% head sampling.

`canonical.ts` and `catalog.ts` are ports of `scripts/canonical.py` and `scripts/data_store.py` +
`json_io.py`; both sides are tested against `tests/fixtures/url_vectors.json` and
`tests/fixtures/golden/`, so the Worker writes the same bytes as the pipeline.

## Catalog data

[`vite-plugins/catalog-data.ts`](vite-plugins/catalog-data.ts) reads `../data_game/` and
`../scripts/deleted_games.json` at build time and emits `dist/data/` (`index.json`,
`game_info_NNN.json`, `count_history.json`, `deleted_games.json`, `urls.json`) plus `sitemap.xml`.
The build **fails** on invalid JSON or an index/chunk mismatch, so a broken data commit never replaces
a working deployment. In dev, a middleware serves the same files.

- **Web**: reads same-origin `/data/*`; covers go through `/img`, so the visitor's browser never
  contacts itch.io until they click a link.
- **Tauri apps**: read `https://freeitchgames.win/data/*` (served with
  `Access-Control-Allow-Origin: *`) and load covers straight from `img.itch.zone`
  ([`src/lib/config.ts`](src/lib/config.ts), [`src/lib/thumbnail.ts`](src/lib/thumbnail.ts)).

The public catalog queries (`db`, `deleted`, `count-history`) are persisted to IndexedDB
(`webapp.query-cache`, up to 7 days) in [`src/main.tsx`](src/main.tsx). `gcTime` must stay ≥ the
persist `maxAge`, or restored queries are garbage-collected right after hydration.

## Code splitting and targets

[`vite.config.ts`](vite.config.ts) `codeSplitting.groups` makes `vendor-react`, `vendor-query`
(TanStack) and `vendor-ui` (Radix, lucide-react, class helpers). There is deliberately **no** charts group:
Recharts is only reached from the lazy chart tabs, and a group would pull it into the first load.
The chart tabs (`src/components/charts/tabs/*`) import chart components directly (no barrel file), so
each tab stays in its own chunk.

Build targets: the website targets Safari / iOS 15.4 and Chrome / Edge 111+, Firefox 114+
explicitly; the Tauri build keeps Vite's default (`baseline-widely-available`, Safari 16.4+).

## Source layout

| Path | Purpose |
|---|---|
| `src/routes/*.tsx` | One file per route |
| `src/components/site/*` | Header (top nav, global search with `/` shortcut, display menu, phone menu) and footer |
| `src/components/games/*` | Games page pieces: filter chips and menus, the desktop table / phone list, the pager |
| `src/components/charts/*` | One file per chart; `tabs/*` are the lazy tab chunks |
| `src/components/ui/*` | shadcn/ui primitives |
| `src/components/legal-gate.tsx` | First-visit click-to-accept gate (`LEGAL_VERSION` in `src/stores/prefs.ts`) |
| `src/components/ext-link.tsx` | Runtime-aware external link (web vs Tauri) |
| `src/lib/data/*`, `src/lib/config.ts` | Catalog fetching, data base URL |
| `src/lib/thumbnail.ts` | Cover URLs: `/img` on the web, `img.itch.zone` in the apps |
| `src/lib/game-filters.ts`, `src/lib/format.ts`, `src/lib/platforms.ts` | The Games query (URL ⇄ filters, sorting, facet counts), locale-aware numbers and dates, platform labels |
| `src/lib/turnstile.ts` | Loads Turnstile on demand (Suggest page only) |
| `src/lib/i18n/*` | Typed i18n: `en.ts` is the source of truth; `vi.ts` is only ever lazy-imported |
| `src/lib/runtime.ts`, `src/lib/external-link.ts` | `isTauri()`; `openExternal()` (opener plugin in the apps, `window.open` on the web) |
| `src/lib/legacy.ts` | One-time cleanup of v3 storage and routes |
| `src/lib/about.ts` | App / social / third-party constants for the About page |
| `src/stores/*` | Zustand: `prefs` (`webapp.prefs`), `theme` (`webapp.theme`) |
| `src/hooks/*` | Data hooks, SEO head, theme / density effects, Android back button |

## Deploy (web)

Cloudflare **Workers Builds** builds and deploys every push to `main` (no GitHub Actions deploy).
Dashboard settings for the Worker `free-games-itchio-list`: root directory `webapp`, build command
`npm run build`, deploy command `npx wrangler deploy`. `assets.directory` must stay `./dist` — never
a source directory.

- **D1 migrations** are applied by hand, never by the build:
  `npx wrangler d1 migrations apply freeitchgames --remote` (before deploying code that needs them).
- **Secrets**: `npx wrangler secret put <NAME>`.
- **Staging**: `npx wrangler deploy --env staging` → `staging.freeitchgames.win`, the whole host behind
  Access, its own R2 bucket and D1 database, no cron.

The old GitHub Pages address (`https://poli0981.github.io/free-games-itchio-list/`) only redirects to
<https://freeitchgames.win>.

## Desktop and Android (Tauri)

See [`TAURI.md`](TAURI.md): prerequisites, `npm run tauri:dev` / `npm run tauri:build`, the Android
APK build and signing, and adding Rust commands. Installers and the APK are built by
[`release_desktop.yml`](../.github/workflows/release_desktop.yml) and
[`release_android.yml`](../.github/workflows/release_android.yml) on a `v*` tag.

## House rules

- Don't commit `dist/`, `.wrangler/`, `.dev.vars`, `src-tauri/target/`, `src-tauri/gen/` or
  `src-tauri/icon-source.png`.
- Never commit a secret (GitHub App key, Turnstile secret, Access tokens, Android keystore).
  Production secrets live only in Cloudflare (`wrangler secret put`) and GitHub Actions secrets.
- New npm dep? Add it to [`src/lib/about.ts`](src/lib/about.ts) `THIRD_PARTY` so the About page lists
  it.
- New external link? Use `<ExtLink href="…">` from
  [`src/components/ext-link.tsx`](src/components/ext-link.tsx), never a raw
  `<a href="…" target="_blank">`. Plain anchors work on the web but silently break in the Tauri apps.
- New route? Add it to `src/App.tsx` **and** `worker/spa.ts`; if it should be indexed, also to
  `src/hooks/useSeoHead.ts` and `STATIC_PAGES` in `vite-plugins/catalog-data.ts` (sitemap).
