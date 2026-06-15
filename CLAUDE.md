# Repo notes for Claude

Quick context so future Claude sessions don't have to re-derive it.

## What this repo is

Two layers stacked on the same JSON catalog of free itch.io games:

1. **Python pipeline** — the data layer.
   - `data_game/game_info_NNN.json` — chunked records, max 500 per file, ~1,470 games as of v3.5.0.
   - `data_game/index.json` — chunk manifest (total + per-file counts). `data_game/count_history.json` — date-keyed `{date,total}` series powering the "games over time" chart.
   - `scripts/` — `scraper.py` (shared session + parsing), `data_store.py` (chunk load/save/rebalance, writes `index.json` + `count_history.json`), `json_io.py` (shared `load_json`/`save_json` + `dedup_deleted`), `update_info.py`, `check_paid.py`, `check_alive.py`, `check_duplicate.py`, `update_reviews.py`, `update_status.py`, `force_update.py`, `generate_md.py`, `log_deleted.py`, `backfill_count_history.py` (one-time count-history seed). Lint: `ruff check scripts/` (config in root `pyproject.toml`).
   - `lists/{genre}.md` — auto-generated, **never edit by hand**.
   - `bash/` — wrappers used by the GitHub Actions workflows.
2. **Webapp** — `webapp/` (React 19 + TypeScript 6 + Vite 8 + Tailwind v3 + shadcn/ui, Tauri 2 desktop **and Android** wrapper in `webapp/src-tauri/`). Reads from `raw.githubusercontent.com`; writes via GitHub API with an encrypted PAT.

## How to work in webapp/

```sh
cd webapp
npm install
npm run dev            # http://localhost:5173
npm run build          # writes to ../docs/app/  (NOT webapp/dist — that path is Tauri-only)
npm run tauri:dev      # native window; needs Rust toolchain
npm run tauri:build    # native installers
npm run tauri icon -- path/to/source-1024.png   # regenerate src-tauri/icons/
npm run tauri -- android init                    # generate src-tauri/gen/android (gitignored)
npm run tauri -- android dev                     # live-reload on device/emulator
npm run tauri -- android build --apk --target aarch64   # arm64-v8a release APK (unsigned; CI post-signs)
```

Android details (env vars, signing, CI secrets, gotchas) live in `webapp/TAURI.md` → **Android APK**.

Path alias: `@/*` → `webapp/src/*`. Vite `define`s `__BUILD_DATE__` so About page shows the build date.

## Code-split layout

`vite.config.ts` `manualChunks` splits node_modules into `vendor-react` / `vendor-query` / `vendor-ui` / `vendor-charts` (Recharts, ~380 KB) / `vendor-github` (Octokit, ~100 KB) / `vendor-openpgp` (OpenPGP.js, ~387 KB — lazy, only touched when Settings → Commit Signing is opened or a commit is being signed). Routes `/charts`, `/add`, `/workflows`, `/settings`, `/about`, `/games/:slug` are `React.lazy` so the initial bundle stays ~163 KB gzip.

## Webapp structure

- `src/routes/*.tsx` — one file per route; `App.tsx` wires `react-router-dom` HashRouter.
- `src/components/data-table/*` — `DataTable` (TanStack Table + Virtual + pagination), `data-table-toolbar`, `data-table-pagination`, `faceted-filter`, `columns`. Row keys are URL-based (`getRowId: g => g.url`) so selection survives sort/filter/page changes.
- `src/components/ui/*` — shadcn primitives (Button, Card, Input, Label, Badge, Skeleton, Separator, Tabs, Popover, Checkbox, Select, Switch, Textarea, Dialog).
- `src/components/charts/` — chart module (one file per chart, shared `chart-card.tsx` with `ChartCard` + `PALETTE`). 16 charts across 4 tabs. Each tab is a `React.lazy` default export under `charts/tabs/{overview,reach,quality,discovery}-tab.tsx`, wrapped in `<Suspense>` from `routes/charts.tsx`. **Tabs import chart components directly (no `index.ts` barrel — it was removed in v3.7.0)** so the bundler keeps each tab's components in its own chunk; a barrel re-exporting all 16 would collapse them into one shared chunk and defeat the split. Radix unmounts inactive `TabsContent`, so a non-default tab's component code downloads only on first activation. Recharts (`vendor-charts`) still loads with the default Overview tab.
- `src/components/legal-gate.tsx` — full-screen, non-dismissible first-launch legal-acceptance gate (raw Radix Dialog, no close-X, Esc/outside-click disabled). Wraps the shell in `App.tsx`; renders instead of the shell until `prefs.acceptedLegalVersion === LEGAL_VERSION`. Reuses `LEGAL_LINKS` from `about.ts`; persists via `prefs.acceptLegal()`.
- `src/lib/github/` — `client.ts` (Octokit factory), `data-store.ts` (TS port of `scripts/data_store.py`), `contents.ts` (single-file commits — routed through Git Data API so they can be signed), `git-data.ts` (atomic multi-file commit; optional signer for GPG), `signer.ts` (builds a `CommitSigner` from gpg store + auth + prefs), `workflow.ts` (dispatch + poll).
- `src/lib/gpg/` — `canonicalize.ts` (pure: builds the byte string Git would hash for a commit), `sign.ts` (lazy-imports `openpgp`, exports `loadPrivateKey` / `signCommit` / `verifyDetached`), `storage.ts` (encrypted-key + metadata in localStorage).
- `src/lib/crypto.ts` — AES-GCM 256 + PBKDF2-SHA256 100k rounds. **Uint8Array generic must be `<ArrayBuffer>`** under TS 6, not `<ArrayBufferLike>` — Web Crypto rejects the latter.
- `src/lib/use-is-mobile.ts` — `useIsMobile()` hook based on `matchMedia('(max-width: 767px)')`. Use it for branches that need a distinct mobile layout (e.g. card view instead of a wide table).
- `src/lib/i18n/` — minimal typed i18n. `en.ts` is the source of truth (`MessageKey = keyof typeof en`); `vi.ts` must **never** be static-imported — it stays a lazy chunk via `import('./vi')` in `index.ts` only. `t()` imperative, `useT()` reactive hook; language pref lives in the `prefs` store.
- `src/main.tsx` — react-query cache persisted to IndexedDB via `idb-keyval` (`PersistQueryClientProvider`). Only public catalog queries (`db` / `deleted` / `count-history`) are dehydrated, never PAT-gated data. `buster = APP.version`, so bumping `about.ts` invalidates the cache. **`gcTime` must stay >= persist `maxAge`** or restored queries are garbage-collected right after hydration.
- Error handling — `src/lib/http-error.ts` (`HttpError`), `src/components/error-page.tsx` + `route-error.tsx` + `error-boundary.tsx`. Hidden preview route `/errors/:code` (not linked from nav). `webapp/public/404.html` serves as the GitHub Pages custom 404.
- `src/stores/` — Zustand stores: `auth` (in-memory PAT + GitHub user; idle timeout pulled from `prefs`), `theme`, `prefs` (sidebar collapsed + density + idle timeout + author override + notification settings + language + `acceptedLegalVersion` — re-prompts the legal gate when the exported `LEGAL_VERSION` constant bumps), `gpg` (in-memory PrivateKey + fingerprint + uid + enabled), `undo` (20-entry FIFO of reverse ops).
- `src/lib/about.ts` — keep the `THIRD_PARTY` array up to date when adding npm deps; About page reads it.

## Editable vs read-only fields

Of the 23 fields per game, only **3** are user-editable: `safe_virus`, `notes`, `nsfw`. The other 17 are scraper output and rendered as read-only badges.

## GitHub Actions

| Workflow | Trigger | Notes |
|---|---|---|
| `update.yml` | Daily 03:00 UTC + `workflow_dispatch` (with optional `url` input) | Reads `INPUT_URL` env var; falls back to `scripts/temp_link.json`. |
| `check_paid.yml` | Every 2 days 04:00 UTC | |
| `update_reviews.yml` | 1st + 15th of each month, 05:00 UTC + `workflow_dispatch` | Refresh `rating` + `rating_count`. Skip-on-error keeps old values. |
| `update_status.yml` | 1st of each month, 06:00 UTC + `workflow_dispatch` | Refresh `status` only. Same skip semantics. |
| `check_alive.yml` | Every 2 days 07:00 UTC | |
| `force_update.yml` | `workflow_dispatch` ONLY (optional `url` input) | Emergency re-scrape. Empty input = re-scrape all. Always preserves `safe_virus` / `notes` / `nsfw`. Canonical tool for repairing mojibake. |
| `generate_table.yml` | After update / check / refresh workflows succeed | Rebuilds `lists/*.md`. Chain list lives in this file under `workflow_run.workflows` — keep in sync when adding scrape workflows. |
| `log_deleted.yml` | After check workflows | Exports `deleted_games.txt`. |
| `deploy_webapp.yml` | Push to `main` touching `webapp/`, or manual | Builds → `docs/app/` → GitHub Pages. Requires repo Settings → Pages → Source = "GitHub Actions". |
| `release_desktop.yml` | Tag `v*` push, or manual | Tauri build for Win + macOS aarch64 + macOS x86_64 (cross-compile) + Linux. Uploads `.dmg` / `.app.tar.gz` / `.pkg` (macOS), `.msi` / `.exe` (Windows), `.deb` / `.AppImage` (Linux). macOS `.pkg` `--identifier` reads `tauri.conf.json` so it never drifts from the bundle ID. |
| `release_android.yml` | Tag `v*` push, or manual | Tauri **Android** build → arm64-v8a APK, **post-signed** with `zipalign`+`apksigner` (gen/ stays gitignored). Tag → attaches to the same draft Release; manual dispatch → uploads as a workflow artifact. Secrets: `ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS`. |

## Release / tag process

```sh
git fetch origin
git tag -s vX.Y.Z origin/main -m "summary"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "..." --notes "..." --verify-tag
```

Tag from `main` only (forking from a feature branch and force-moving on rebase makes a mess). GPG signing is wired through gpg-agent; user's signing key is `03F965C2E2DB5C6B` (EDDSA) and `commit.gpgsign=true` is on, so `git tag -s` and `git commit` both sign.

## Required PAT permissions for the webapp

Fine-grained PAT scoped to **only this repo** with:

- **Contents: Read and write** — edits, deletes, queueing URLs.
- **Actions: Read and write** — dispatching the scraper workflow.

`workflow:write` is **not** what we need (that's for editing `.github/workflows/*.yml` files, which the webapp doesn't do). Classic PATs with the `workflow` scope happen to cover both.

## Known gotchas (cost a release each — don't relearn)

1. **`universal-apple-darwin` + `bundle_dmg.sh` is fragile** in headless CI. Use per-arch (`aarch64-apple-darwin`, `x86_64-apple-darwin`) instead.
2. **`macos-13` is retired** from free GitHub-hosted runners (late 2024). Cross-compile x86_64 from `macos-latest` (Apple Silicon).
3. **Tauri icons must exist before build.** Generate via `npm run tauri icon -- path/to/source.png`. The 1024×1024 source is gitignored; generated icons are committed.
4. **Tauri doesn't ship `.pkg`.** We build it with `pkgbuild` after `tauri-action` and upload via `gh release upload`. Step uses `if: always()` so a DMG flake doesn't drop the PKG.
5. **Vite v8 `base`** only accepts `'./'`, an absolute URL, or an empty string. Anything else warns and silently breaks asset paths.
6. **TS 6** deprecates `baseUrl`. Use `paths` alone.
7. **lucide-react v1+** removed/renamed brand icons (`Github` → not available). Use `Library`, `Database`, etc. for repo icons.
8. **`/repos/.../contents` `content` is base64 with newlines AND base64-decoded data is UTF-8.** Strip newlines first, but `atob` alone returns a Latin-1 binary string — multi-byte UTF-8 sequences become mojibake. Go through `TextDecoder('utf-8')` via the `base64ToUtf8` helper in `webapp/src/lib/github/encoding.ts`. The matching `utf8ToBase64` is correct as-is.
9. **`createWorkflowDispatch` returns 204 with no run id.** To track the run, list runs filtered by `event=workflow_dispatch` and a dispatch timestamp from a few seconds before.
10. **`docs/app/` is gitignored.** CI builds it. Don't commit build output.
11. **PUT `/repos/.../contents/{path}` can never be "Verified".** GitHub authors that commit itself from the PAT; there is no `signature` field. All webapp writes must go through the Git Data API (blob → tree → commit → updateRef) to allow GPG signing. `contents.ts` `putFile` was removed for this reason — use `commitSingleFile` (wraps `atomicCommit`).
12. **GPG signing must use binary mode in openpgp.js.** `openpgp.createMessage({ text })` normalizes line endings before hashing → signature won't verify against the LF-only Git commit object. Use `createMessage({ binary: TextEncoder.encode(canonical) })`.
13. **Commit object canonical timestamp must match Octokit's `author.date` exactly.** GitHub re-derives `<unix_ts> <±HHMM>` from the ISO date and recomputes the SHA. Use a single `ts + tzOffsetMin` source for both, derive `author.date` via `isoFromTs(ts, tzOffsetMin)`.
14. **TabsList primitive is `inline-flex` with `whitespace-nowrap` triggers.** Many tabs + narrow viewport → overflow. The fix in `/workflows` is dual-render: `<Select>` on mobile (`md:hidden`), TabsList on desktop (`hidden md:inline-flex`). Charts uses `flex-wrap` defensively but the labels are short enough to fit at 430px.
15. **`bundle.windows.nsis.license` does NOT exist in `@tauri-apps/cli` 2.11.0** (added in a later release) — it fails config validation on *all* platforms at the `Build Tauri app` step (this broke the v3.7.0 desktop build). For installer license/EULA pages on the pinned CLI, use the **top-level `bundle.licenseFile`** instead. It must be **RTF** because this repo builds **both** Windows installers: WiX (`.msi`) requires RTF and NSIS (`.exe`) auto-detects it (a plain `.txt` breaks the `.msi`). File lives at `webapp/src-tauri/installer/EULA.rtf`; path is relative to `src-tauri/`.
16. **The bundle `identifier` must be alphanumeric (no `-`, no `_`).** Android rejects hyphens in the app id (`tauri android init` panics — `NotAsciiAlphanumeric`), while Tauri's own config validator rejects underscores. The only form valid on *both* is alphanumeric segments — ours is `com.poli0981.freegamesitchio` (changed from the old hyphenated `com.poli0981.free-games-itchio-webapp` in v3.8.0). Tauri uses ONE identifier across all platforms, so this also changed the desktop bundle ID (one-time OS-level reinstall). The macOS `.pkg` `pkgbuild --identifier` in `release_desktop.yml` reads it from `tauri.conf.json` so it can't drift.
17. **Android signing: `zipalign` BEFORE `apksigner`.** `gen/android` is gitignored + regenerated by `android init`, so we never edit the generated Gradle — `release_android.yml` builds an *unsigned* APK and post-signs it. Re-aligning a *signed* APK invalidates the signature, so the order is zipalign → apksigner → verify. Pin the CI NDK to match local. Never lose the signing keystore (Android needs a stable signing identity to upgrade an installed APK in place).
18. **Android `versionCode`/`versionName` derive from `tauri.conf.json` version** (`versionCode = major*1e6 + minor*1e3 + patch`). Keep `tauri.conf.json` + `Cargo.toml` versions aligned with the real release line (was a long-standing `0.1.1` vs `3.x` drift — fixed to `3.8.0` in v3.8.0) so the code is sensible and monotonic.
19. **Android `minSdkVersion` is the install gate — change it only in `tauri.conf.json`.** It's **30 (Android 11)** as of v3.9.0 (was 24). Lives in `bundle.android.minSdkVersion`; Tauri injects it into the gitignored generated Gradle on `android init`, so that's the *only* place to set the floor (don't edit `gen/`). Android's package installer refuses any APK whose `minSdkVersion` exceeds the device API level, so **raising `minSdkVersion` IS the "block install on unsupported Android" mechanism** — there is intentionally **no runtime OS-version check** (redundant, and would need `@tauri-apps/plugin-os`). The floor is **not** a JS-feature limit (the System WebView is updatable down to API 24); it's chosen for OS-level security hardening + patch availability (pre-11 is off Google's AOSP Security Bulletins) and our tested range (emulator 11→latest, vivo 1907 / Android 12 — see `docs/pc_spec.md`). Reach trade-off (StatCounter, mid-2026): API 24 ≈ 96.6%, **API 30 ≈ 86.9%**, API 31 ≈ 78.8%, API 33 ≈ 68.9%, API 34 ≈ 54.5%. Don't chase API 34 (Google's oldest still-supported version) — too aggressive for sideloaded reach.

## Safe-edit rules

- Don't edit `lists/*.md` directly — they're regenerated by `generate_md.py`.
- Don't commit `webapp/dist/`, `webapp/src-tauri/target/`, `webapp/src-tauri/gen/` (the generated Android/iOS projects — regenerated by `tauri android init`; Android signing is post-build, not a Gradle edit), `Cargo.lock`, or `webapp/src-tauri/icon-source.png`.
- Don't commit a real PAT, ever. Settings page handles it client-side; CI uses `secrets.GH_TOKEN`.
- When adding an npm dep, also add it to `webapp/src/lib/about.ts` so the About page lists it.

## Current state (as of v3.9.0)

`main` is the trunk. Tags `v3.0.0` through `v3.8.0` are released (all GPG-signed); **v3.9.0 is implemented but pending release** (awaiting test + authorization). The webapp is published at `https://poli0981.github.io/free-games-itchio-list/app/`. v3.7.0 added the first-launch legal-acceptance gate, the Windows installer EULA page, and per-tab lazy-loading of the charts route; v3.7.1 was a desktop-build hotfix (installer EULA via `bundle.licenseFile` RTF — see gotcha #15). **v3.8.0** added the **Android APK** target: same React + Tauri app shipped as a sideloadable arm64-v8a `.apk` (`release_android.yml`, post-signed), attached to the same draft Release as the desktop installers. It also fixed the bundle `identifier` to be Android-valid (`com.poli0981.freegamesitchio`, gotcha #16) and realigned `tauri.conf.json`/`Cargo.toml`/`about.ts` versions to `3.8.0` (gotcha #18). Mobile UX: Android back button → router history (`useBackButton`), safe-area insets, and a platform-aware sidebar badge ("Desktop app" / "Mobile app"). Added dep: `@tauri-apps/api`. CI note: the Android JDK setup must NOT use `cache: gradle` — `gen/android` is gitignored and generated mid-job, so there are no gradle files at checkout to key on (it hard-fails); rust-cache + npm cache still apply. **v3.9.0** raises the Android APK floor from `minSdkVersion` 24 (Android 7.0) to **30 (Android 11)** — the OS-level install gate, chosen for security hardening + patch availability + our tested range, at ≈86.9% device reach (gotcha #19); docs (`TAURI.md`, both READMEs, `docs/pc_spec.md` + VI mirrors) updated with cited data, and the changelog backfilled the previously-missing `[3.8.0]` entry.
