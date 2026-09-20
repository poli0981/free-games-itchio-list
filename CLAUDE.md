# Repo notes for Claude

Quick context so future Claude sessions don't have to re-derive it.

## What this repo is

A curated, auto-updating catalog of free itch.io games, published at **https://freeitchgames.win** (read-only for
everyone; the old github.io URL only redirects). Three layers share one JSON catalog:

1. **Python pipeline** — the data layer (GitHub Actions).
   - `data_game/game_info_NNN.json` — chunked records, max 500 per file, 2,681 games as of Sept 2026. Serialization is fixed: `json.dumps(..., ensure_ascii=False, indent=4)`, no trailing newline (`json_io.dumps`) — the Worker port (`webapp/worker/catalog.ts`) emits identical bytes (`tests/fixtures/golden/`).
   - `data_game/index.json` — chunk manifest (total + per-file counts). `data_game/count_history.json` — date-keyed `{date,total}` series ("games over time" chart). `scripts/deleted_games.json` — removal log (public "Removed" page). `scripts/temp_link.json` — ingest queue.
   - `scripts/` — scanners never write the catalog: `update_info.py` (queued URLs) and `refresh.py` (rotating 1/7-per-day check; `--full` re-scrape) emit a URL-keyed **patch** (`patch.py`); `apply_patch.py` applies it to the latest `main` and runs `validate.py`; `bash/commit_push.sh` does fetch → reset → apply → commit → push with retries. Shared: `scraper.py` (session, `Pacer` + 429 back-off, parsing), `data_store.py` (chunks stay in place, rebalance only past thresholds, write-if-changed), `json_io.py`, `canonical.py` (canonical itch.io URL; vectors in `tests/fixtures/url_vectors.json`, shared with the Worker). Pipeline bookkeeping lives in `scripts/state/` (not published). Tests: `pytest` (network blocked). Lint: `ruff check scripts tests webapp/scripts`, `ruff format`, `vulture` (config in root `pyproject.toml`). Local env: `python -m venv .venv && .venv/Scripts/pip install -r requirements-dev.txt` (Windows: run with `PYTHONUTF8=1`).
2. **Cloudflare Worker + static assets** — `webapp/worker/` + `webapp/wrangler.jsonc`, deployed by **Cloudflare Workers Builds** from `main` (root dir `webapp`, build `npm run build`, deploy `npx wrangler deploy`; no deploy workflow). The catalog JSON is bundled into the site at build time (`vite-plugins/catalog-data.ts` → `dist/data/*`, plus `data/urls.json` and `sitemap.xml`), so every data commit rebuilds the site.
3. **Web app + Tauri apps** — `webapp/src/` (React 19.3 + TypeScript 6.0 + Vite 8/rolldown + Tailwind + shadcn/ui + React Router 8), and the **Tauri 2 desktop + Android** read-only viewers in `webapp/src-tauri/` (same code; they fetch `https://freeitchgames.win/data` and load covers straight from img.itch.zone). Plus `webapp/admin/` — the maintainer-only admin app (second Vite entry, served at `/admin/`).

Adding games: the public **Suggest** page (`/suggest`, Turnstile), the maintainer's browser extension (`POST /api/ingest`, Access service token; repo `poli0981/itch-f2p-extension`), and RSS discovery (Worker cron) all feed a **D1 review queue**; approving in `/admin` commits the URLs to `scripts/temp_link.json` as a GitHub App, which triggers `update.yml`.

## How to work in webapp/

```sh
cd webapp
npm ci
npm run dev            # Vite on http://localhost:5173 (proxies /api and /img to wrangler dev on :8787)
npx wrangler dev       # the Worker + built assets (run `npm run build` first); .dev.vars holds local secrets
npm run build          # → webapp/dist/ (public app + /admin/ + /data + sitemap); Tauri builds use the same dir
npm test               # vitest (worker/, src/lib); worker/test/* D1 tests spawn a local workerd via getPlatformProxy
npm run lint && npm run knip && npx tsc -b
npm run cf:types       # after editing wrangler.jsonc (ignores .dev.vars via types.env; CI runs it with --check)
npx wrangler d1 migrations apply freeitchgames --local    # local D1 (use --remote by hand for production)
npm run tauri:dev      # native window; needs Rust toolchain
npm run tauri:build    # native installers
npm run tauri icon -- path/to/source-1024.png   # regenerate src-tauri/icons/
npm run tauri -- android init                    # generate src-tauri/gen/android (gitignored)
npm run tauri -- android build --apk --target aarch64   # arm64-v8a release APK (unsigned; CI post-signs)
```

Local admin without Access: put `DEV_ADMIN_EMAIL=you@example.com` in `webapp/.dev.vars` — honoured only when the host is localhost. Turnstile test keys work locally (`TURNSTILE_SITEKEY=1x00000000000000000000AA`, `TURNSTILE_SECRET=1x0000000000000000000000000000000AA`, `SITE_ORIGIN=http://localhost:<port>` in `.dev.vars`). Android details live in `webapp/TAURI.md` → **Android APK**. Path alias: `@/*` → `webapp/src/*`.

## Worker (`webapp/worker/`)

- `index.ts` routes: `/img/*` (img.ts), `/api/health`, `/api/suggest` (suggest.ts), `/api/ingest` (ingest.ts), `/api/admin/*` + `/admin*` (admin.ts), everything else that misses an asset → `spa.ts`. `scheduled()` (cron `23 */4 * * *`): `discover.ts` (one itch.io RSS feed per run, 6 h back-off on 429) → `QueueStore.reconcile` (queued → ingested / failed after 3 days) → `purge` (idempotency 7 d, Suggest notes 180 d).
- `img.ts`: `/img/<160|640>/<path on img.itch.zone>` — allow-listed against `data/urls.json`, edge cache → R2 `THUMBS` (`w{w}/<sha256>.webp`) → `cf.image` transform (stored once) → fallback streams the original with a 1-day cache (quota error 9422). Upstream errors → controlled 502.
- `spa.ts`: `not_found_handling` is `"none"`, so misses reach the Worker: `/assets/*`, `/data/*` and file-like paths get a real 404 (`no-store`); app routes get the shell with 200; unknown paths and game slugs not in the catalog get the shell with **404**. Keep its `ROUTES` in sync with `src/App.tsx` and `src/hooks/useSeoHead.ts`.
- `access.ts`: verifies `Cf-Access-Jwt-Assertion` with jose (issuer + AUD). Maintainer = email in secret `ADMIN_EMAILS` + same-origin writes; ingest = service-token `common_name`.
- `admin.ts`: API (queue list / approve / reject / add / edit the 3 fields / delete with reason + R2 cleanup / restore) and the `/admin` shell with its own CSP. The maintainer's email goes only to the D1 audit log, never into a commit (the repo is public).
- `repo.ts` + `github.ts` + `catalog.ts`: writes as a **GitHub App** (installation token, cached per isolate) with GraphQL `createCommitOnBranch` + `expectedHeadOid` (verified commits; `commitWithRetry` rebuilds from the new head on a race). Reads use the raw media type (no base64/UTF-8 mojibake). `catalog.ts` ports `data_store.py` byte-for-byte (golden fixtures).
- `queue.ts`: URL classification (catalog → blocklist → pending → previously deleted) + the D1 store (`worker/migrations/`, additive only — never edit an applied migration). `data.ts`: catalog facts read from the site's own `/data` via `env.ASSETS`, cached per isolate (loaded values only — see gotchas).
- Configuration: non-secret settings are `vars` in `wrangler.jsonc` (empty until setup); secrets (`GH_APP_PRIVATE_KEY` — the PEM GitHub downloads (PKCS#1) or PKCS#8; `github.ts` converts, `ADMIN_EMAILS`, `TURNSTILE_SECRET`) via `wrangler secret put`, typed in `worker/env.ts` as optional. A feature whose settings are missing answers **503**; the public site needs none of them. `env.staging` = Worker `free-games-itchio-list-staging` on `staging.freeitchgames.win` (no cron, own R2/D1/rate-limit namespaces).

## Web app structure (`webapp/src/`)

- `routes/*.tsx` — one file per route (`/`, `/games`, `/games/:slug`, `/charts`, `/removed` (`/deleted` redirects), `/suggest`, `/settings`, `/about`, `/errors/:code`); `App.tsx` wires them; `components/app-router.tsx` picks **BrowserRouter on the web, HashRouter in Tauri**. `lib/legacy.ts` rewrites v3 `#/x` links to `/x` (crafted hashes go home) and deletes v3 PAT/GPG storage keys.
- Data: `lib/config.ts` (`DATA_BASE` = `/data` on the web, `https://freeitchgames.win/data` in Tauri), `lib/data/*`, `hooks/useGames.ts`. react-query cache persisted to IndexedDB (`webapp.query-cache`, 7 days); `CACHE_BUSTER = ${APP.version}:data-v1`. **`gcTime` must stay >= persist `maxAge`.**
- Layout: `components/site/*` (sticky top nav + global search with the `/` shortcut + display menu + phone sheet menu; footer) — the window scrolls, not `<main>`. `/` is the Welcome page (`routes/welcome.tsx`).
- `/games`: search, filters, sort and page live in the URL — `lib/game-filters.ts` (`parseQuery` / `toParams` drop defaults; params `q genre platform status tag lang input engine rating browser sort page`; unit-tested) — rendered by `components/games/*` (filter chips with facet counts that ignore their own filter, a desktop ARIA table / phone list chosen by `useIsMobile`, 100 per page; the detail page's breadcrumb links back to the same list via router state). Counts show the whole catalog ("2,602 of 2,681") because 18+ games are hidden by default.
- `components/charts/` (16 charts, 4 lazy tabs, **no barrel `index.ts`**), `components/game-thumb.tsx` (`lib/thumbnail.ts` → `/img/160|640/...` on the web, the original URL in Tauri), `components/legal-gate.tsx` (a non-dismissable Radix dialog **over** the page, so deep links land where they pointed; links flagged `inGate` in `lib/about.ts`; re-prompts when `LEGAL_VERSION` in `stores/prefs.ts` changes; no "Leave" button in Tauri).
- Styling: **Tailwind v4** via `@tailwindcss/vite` (no PostCSS, no `tailwind.config`); tokens are hex CSS variables in `src/index.css` (`:root` / `.dark`, `@theme inline`; `--brand-soft`, `--thumb`, `--success` besides the shadcn set) and must match the approved mockup. Self-hosted Geist / Geist Mono (`@fontsource-variable/*`, CSP `font-src 'self'`). Numbers and dates go through `lib/format.ts` (`useFormat`: en-GB / vi-VN). `webapp/scripts/gen_assets.py` redraws favicon, PWA icons and `og.png` from the same tokens and the Geist fonts in `node_modules`.
- `hooks/useSeoHead.ts` sets canonical + robots per route (index.html has no static canonical/og:url on purpose).
- `lib/i18n/` — `en.ts` is the source of truth; `vi.ts` is `Record<MessageKey, string>` and must never be static-imported (lazy chunk).
- `stores/` — Zustand: `prefs` (`webapp.prefs`: language, density, legal acceptance…), `theme` (`webapp.theme`).
- `lib/about.ts` — keep `THIRD_PARTY` up to date when adding npm deps; `LEGAL_LINKS`; `APP.version`.
- Code split (`vite.config.ts` rolldown `codeSplitting.groups`): `vendor-react` (priority 100 — must claim React first), `vendor-query`, `vendor-ui`. There is deliberately **no vendor-charts group** (it pulled React/clsx in and put Recharts on the first load); Recharts stays in the lazy chart chunks. Initial load ≈ 173 KB gzip (JS + CSS) plus ~51 KB of Geist woff2. Web build `target` is Safari/iOS 15.4 (Radix class static blocks otherwise break iOS 15); Tauri uses the default.

## Editable vs read-only fields

Each game has **20** fields (plus optional `added_at` / `updated_at`, appended by the pipeline — schema changes are additive only, installed v3 apps may still read the raw JSON). Only **3** are maintainer-editable: `safe_virus` (`?|Yes|No|Caution`), `notes`, `nsfw` (`Yes|No`) — via `/admin`. The other 17 are scraper output; no scrape (not even `--full`) overwrites the 3 editable fields.

## GitHub Actions

| Workflow | Trigger | Notes |
|---|---|---|
| `update.yml` | Push to `main` touching `scripts/temp_link.json` + daily 01:23 UTC + `workflow_dispatch` (`url`) | Ingest queue → patch → `commit_push.sh`. Workflow-level `concurrency: ingest` with **`queue: max`** (the default queue replaces a pending run, which would drop its dispatched `url`). A dispatched `url` is processed first and written to `temp_link.json` (`queue_add`) until it reaches a final outcome. Failed fetches count as an attempt only ≥ 6 h apart (`last_attempt`; 3 → given up), and a 429 counts as none. GitHub-App pushes (extension, admin Worker) trigger it; its own `GITHUB_TOKEN` push does not (no loop). Keep the filename. |
| `refresh.yml` | Daily 02:47 UTC + `workflow_dispatch` (`budget`, `url`, `allow_mass_removal`) + `workflow_call` | scan (read-only, 55-min step timeout, patch artifact uploaded `if: always()`) → apply (`!cancelled()`: a failed / timed-out scan's checkpoint is applied, a cancelled run's is not) → notify. Workflow-level `concurrency: refresh-pipeline` + `queue: max` runs one whole scan → apply at a time (also for force-update's call; the group name must differ from the caller's or GitHub cancels it as a deadlock). Removal needs the same 404/410 or paid strike seen again ≥ 20 h after the first sighting (`strike_at`). Checkpoints never carry removals. **Mass-change guard:** a run whose removals or new strikes exceed max(10, 10 %) of the games it checked withholds all its removals and marks them — and, on a strike spike, all its strikes — `withheld_at`; later runs keep withholding those (they take at most half a run's budget) until a healthy check clears them, and alert (`mass_change`) — that pattern means itch.io markup changed; dispatch with `allow_mass_removal` only after checking on itch.io. `apply_patch.py` re-checks the same per-run limit and max(25, 5 %) of the catalog unless `ALLOW_MASS_REMOVAL=1`. |
| `force_update.yml` | `workflow_dispatch` ONLY (`url`, `budget`, `allow_mass_removal`) | `queue: max`. Calls `refresh.yml` with `full: true`: re-scrapes every scraper field for one URL or the next batch (rotates on `full` timestamps). Always preserves `safe_virus` / `notes` / `nsfw`. Canonical tool for repairing mojibake. |
| `notify-failure.yml` | `workflow_call` | Discord (`DISCORD_CI_WEBHOOK`) on failure / **cancelled** (job-level timeouts end as cancelled) / rate-limited / mass change / failed Cloudflare build. |
| `python-ci.yml` / `webapp-ci.yml` | PRs (+ pushes for Python) | ruff + format + vulture + pytest + `validate.py` / `npm run cf:types -- --check` + lint + knip + vitest + build + `wrangler deploy --dry-run --env=""`. |
| `deploy-status.yml` | Hourly + manual | Not a deploy. `bash/cf_build_status.sh` walks main's first-parent history to the latest finished `Workers Builds: free-games-itchio-list` check run (Cloudflare posts it only when a build ends; branch commits carry preview builds under the same name) and alerts once per failed build (cache key per check-run id, saved after the Discord post). Scheduled because GitHub never starts `check_run` workflows for `GITHUB_TOKEN` pushes (the data commits). |
| `release_desktop.yml` | Tag `v*` push, or manual | `create-release` makes the single draft (id passed to tauri-action v1 `releaseId`); release builds use **no** npm/cargo caches (cache-poisoning). Win + macOS aarch64 + macOS x86_64 (cross-compile) + Linux (`ubuntu-22.04` for a low glibc floor). Uploads `.dmg` / `.app.tar.gz` / `.pkg` (macOS), `.msi` / `.exe` (Windows), `.deb` / `.AppImage` (Linux). macOS `.pkg` `--identifier` reads `tauri.conf.json`. |
| `release_android.yml` | Tag `v*` push, or manual | Tauri **Android** build → arm64-v8a APK, **post-signed** with `zipalign`+`apksigner` (gen/ stays gitignored). Tag → attaches to the same draft Release; manual dispatch → workflow artifact. Secrets: `ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS`. |
| `announce-*.yml`, `notify-release-pipeline.yml` | Release published / pipeline runs | Reusable workflows from `poli0981/.github`, SHA-pinned — but at that pin they still check out their notifier script from that repo's `main`. |

All workflows: `permissions: {}` at the top, per-job grants, actions pinned by commit SHA.

## Release / tag process

```sh
git fetch origin
git tag -s vX.Y.Z origin/main -m "summary"
git push origin vX.Y.Z
# release_desktop.yml's create-release job opens ONE draft; desktop + Android jobs upload into it.
# When every asset is there, edit the notes and publish (this fires the announcements):
gh release edit vX.Y.Z --draft=false
```

Draft-first: **never** `gh release create` by hand before CI — tauri-action v1 refuses to upload into a published release, and announcements would go out before installers exist. Merge PRs into `main` with squash or a merge commit, never by fast-forward pushing a branch: its commits' preview-build check runs would then sit on main's own line and confuse `deploy-status.yml`. Tag from `main` only. Versions live in `webapp/src/lib/about.ts` (`APP.version`), `webapp/package.json`, `webapp/src-tauri/tauri.conf.json` and `Cargo.toml` (+ `Cargo.lock`) — keep them equal. GPG signing is wired through gpg-agent (`commit.gpgsign=true`, so `git tag -s` and `git commit` both sign; the pinentry must be answered — in unattended sessions commits fail rather than going unsigned). The historical key `03F965C2E2DB5C6B` was exposed in the browser extension's storage (Sept 2026) and is being replaced — use the maintainer's current key.

## Licenses & policies

Code **MIT** (`LICENSE`); catalog data **CC BY 4.0** for the maintainer's contribution — excluding creators' descriptions, cover images, names/trademarks (`data_game/LICENSE.md`, `LICENSES/CC-BY-4.0.txt`); docs **CC BY 4.0**; map + non-affiliation in `NOTICE.md`. Policies (EN in `docs/`, VI mirrors in `docs/i18n/vi/`, English controls): ToS (website + data + content removal), EULA (desktop/Android binaries only; also `webapp/src-tauri/installer/EULA.rtf`), Privacy Policy, Disclaimer, `SECURITY.md`, `CODE_OF_CONDUCT.md`. When a policy changes, bump `LEGAL_VERSION` (`webapp/src/stores/prefs.ts`) and the dates in `about.legal.desc` (EN/VI) so the legal gate asks again. Contact addresses `legal@ / privacy@ / security@ / takedown@freeitchgames.win` are Cloudflare Email Routing forwards.

## Known gotchas (cost a release each — don't relearn)

1. **`universal-apple-darwin` + `bundle_dmg.sh` is fragile** in headless CI. Use per-arch (`aarch64-apple-darwin`, `x86_64-apple-darwin`).
2. **`macos-13` is retired** from free GitHub-hosted runners. Cross-compile x86_64 from `macos-latest`.
3. **Tauri icons must exist before build.** `npm run tauri icon -- path/to/source.png`; the 1024×1024 source is gitignored, generated icons are committed.
4. **Tauri doesn't ship `.pkg`.** Built with `pkgbuild` after tauri-action and uploaded via `gh release upload`; the step uses `if: ${{ !cancelled() && … }}` so a DMG flake doesn't drop the PKG while a cancel still stops it.
5. **Vite v8 `base`** only accepts `'./'`, an absolute URL, or an empty string. Web uses `'/'` (BrowserRouter deep links), Tauri `'./'`.
6. **TS 6** deprecates `baseUrl`. Use `paths` alone. Stay on TS 6.0.x until typescript-eslint supports newer.
7. **lucide-react v1+** removed brand icons (`Github`). Use `Library`, `Database`, etc.
8. **`bundle.windows.nsis.license` does NOT exist in `@tauri-apps/cli` 2.11** — use top-level `bundle.licenseFile`, and it must be **RTF** (WiX `.msi` requires it; NSIS auto-detects). File: `webapp/src-tauri/installer/EULA.rtf`.
9. **The bundle `identifier` must be alphanumeric** (`com.poli0981.freegamesitchio`): Android rejects `-`, Tauri's validator rejects `_`; one identifier serves every platform.
10. **Android signing: `zipalign` BEFORE `apksigner`**; never edit the generated Gradle; never lose the keystore. `versionCode = major*1e6 + minor*1e3 + patch` from `tauri.conf.json`. **`minSdkVersion` 30 (Android 11) is the install gate** — change it only in `tauri.conf.json` (`bundle.android.minSdkVersion`); no runtime OS check by design (reach ≈ 86.9 % mid-2026; see `docs/pc_spec.md`). The Android JDK setup must NOT use `cache: gradle` (gen/ doesn't exist at checkout).
11. **`webapp/dist/` is gitignored and `assets.directory` must be `./dist`.** In Sept 2026 a config-less deploy served the raw `webapp/` tree (source exposed).
12. **A Worker with static assets gets no `ctx.access`** — verify the Access JWT yourself (access.ts). **`workers_dev` and `preview_urls` must stay `false`**: those hostnames bypass Access.
13. **`public/_headers` applies only to responses served straight from assets**, not to responses the Worker builds (set headers in `worker/http.ts`). Responses fetched through `env.ASSETS` do carry them.
14. **With `run_worker_first` as an array, the asset layer's SPA fallback answers every miss before the Worker** — a stale hashed chunk got `index.html` + the year-long immutable cache. Hence `not_found_handling: "none"` + `spa.ts`.
15. **Never share an in-flight promise across requests in a Worker** (cache only resolved values): a pending subrequest dies with the request that started it (client disconnect) and every later awaiter hangs.
16. **itch.io cover URLs are signed per size**, so you can't rewrite `/original/` to a smaller variant — resizing goes through Image Transformations (`cf.image`) and R2.
17. **GitHub Actions concurrency keeps at most one *pending* run per group by default** and cancels the older pending one — use `queue: max` where a queued run carries unique input. A called workflow must not request its caller's group (deadlock → cancelled).
18. **Pushes made with `GITHUB_TOKEN` trigger no workflows** (no ingest loop), and GitHub never starts `check_run` workflows for them (hence the scheduled `deploy-status.yml`). Workers Builds posts its check run only when a build ends.
19. **`wrangler types` reads `.dev.vars`** — `npm run cf:types` points it at the empty `types.env` so the committed `worker-configuration.d.ts` never depends on local secrets. Don't use `secrets.required` until every environment has the secrets (deploys fail without them).
20. **D1 migrations are applied by hand** (`npx wrangler d1 migrations apply freeitchgames --remote`), never in the build — and before deploying code that needs them. Production `freeitchgames` was created by command (APAC); its `database_id` is in `wrangler.jsonc` (not a secret). **R2 must be enabled on the account** (dashboard, payment method) before `wrangler r2 bucket create`; a deploy whose bucket is missing fails.
21. **React Router 8 wraps navigations in `startTransition` by default**: `useSearchParams` then returns the previous URL until the transition commits, so URL-driven state (the Games filters) overwrote itself on quick clicks. Both routers in `components/app-router.tsx` pass `useTransitions={false}`.
22. **`window.confirm` / `alert` / `prompt` do nothing in the macOS app** (wry's WebKit answers "Cancel"). Use in-app dialogs (`components/nsfw-dialog.tsx` + `requestNsfw()` in `lib/nsfw.ts`).

## Safe-edit rules

- Don't write `data_game/` from new code paths directly — go through a patch + `apply_patch.py` (or the Worker's `repo.ts`), so concurrent writers never clobber each other and `validate.py` gates every commit.
- Don't commit `webapp/dist/`, `webapp/src-tauri/target/`, `webapp/src-tauri/gen/`, `webapp/src-tauri/icon-source.png`, `.dev.vars`, `username.txt`, `assets/qr/`. `Cargo.lock` **is** committed (since v4).
- Never commit secrets (GitHub App key, admin emails, Turnstile secret, tokens). Data workflows push with the job's `GITHUB_TOKEN`; the Worker writes as the GitHub App.
- When adding an npm dep, also add it to `webapp/src/lib/about.ts` so the About page lists it.

## Current state (Sept 2026)

**v4 is live** (2026-09-18): Phase 0 (#81) and Phase 1 (#82) were squash-merged, then PR **#88** merged branch `v4` (phases 2–5 and the approved Phase 3 redesign) with a merge commit (`a872644`); Workers Builds deployed it and https://freeitchgames.win serves the Worker. D1 `freeitchgames` and R2 `freeitchgames-thumbs` exist, Image Transformations are on for the zone (source `img.itch.zone`). **Still open (owner):** Cloudflare Access apps + the `ACCESS_*` vars, the GitHub App (`GH_APP_*` vars + `GH_APP_PRIVATE_KEY`), Turnstile (`TURNSTILE_SITEKEY` + secret), `ADMIN_EMAILS`, Web Analytics token, Email Routing — admin, ingest and Suggest answer 503 until then (`docs/operations.md` section 1); tagging `v4.0.0` (draft-first release); the legal-text review items; a new GPG signing key (commits are still signed with the exposed `03F965C2E2DB5C6B`).
