# Repo notes for Claude

Quick context so future Claude sessions don't have to re-derive it.

## What this repo is

Two layers stacked on the same JSON catalog of free itch.io games:

1. **Python pipeline** — the data layer.
   - `data_game/game_info_NNN.json` — chunked records, max 500 per file, ~514 games as of v3.1.1.
   - `scripts/` — `scraper.py` (shared session + parsing), `data_store.py` (chunk load/save/rebalance), `update_info.py`, `check_paid.py`, `check_alive.py`, `generate_md.py`, `log_deleted.py`.
   - `lists/{genre}.md` — auto-generated, **never edit by hand**.
   - `bash/` — wrappers used by the GitHub Actions workflows.
2. **Webapp** — `webapp/` (React 19 + TypeScript 6 + Vite 8 + Tailwind v3 + shadcn/ui, Tauri 2 desktop wrapper in `webapp/src-tauri/`). Reads from `raw.githubusercontent.com`; writes via GitHub API with an encrypted PAT.

## How to work in webapp/

```sh
cd webapp
npm install
npm run dev            # http://localhost:5173
npm run build          # writes to ../docs/app/  (NOT webapp/dist — that path is Tauri-only)
npm run tauri:dev      # native window; needs Rust toolchain
npm run tauri:build    # native installers
npm run tauri icon -- path/to/source-1024.png   # regenerate src-tauri/icons/
```

Path alias: `@/*` → `webapp/src/*`. Vite `define`s `__BUILD_DATE__` so About page shows the build date.

## Code-split layout

`vite.config.ts` `manualChunks` splits node_modules into `vendor-react` / `vendor-query` / `vendor-ui` / `vendor-charts` (Recharts, ~380 KB) / `vendor-github` (Octokit, ~100 KB) / `vendor-openpgp` (OpenPGP.js, ~387 KB — lazy, only touched when Settings → Commit Signing is opened or a commit is being signed). Routes `/charts`, `/add`, `/workflows`, `/settings`, `/about`, `/games/:slug` are `React.lazy` so the initial bundle stays ~163 KB gzip.

## Webapp structure

- `src/routes/*.tsx` — one file per route; `App.tsx` wires `react-router-dom` HashRouter.
- `src/components/data-table/*` — `DataTable` (TanStack Table + Virtual + pagination), `data-table-toolbar`, `data-table-pagination`, `faceted-filter`, `columns`. Row keys are URL-based (`getRowId: g => g.url`) so selection survives sort/filter/page changes.
- `src/components/ui/*` — shadcn primitives (Button, Card, Input, Label, Badge, Skeleton, Separator, Tabs, Popover, Checkbox, Select, Switch, Textarea, Dialog).
- `src/components/charts.tsx` — 9 Recharts charts grouped into 4 tabs.
- `src/lib/github/` — `client.ts` (Octokit factory), `data-store.ts` (TS port of `scripts/data_store.py`), `contents.ts` (single-file commits — routed through Git Data API so they can be signed), `git-data.ts` (atomic multi-file commit; optional signer for GPG), `signer.ts` (builds a `CommitSigner` from gpg store + auth + prefs), `workflow.ts` (dispatch + poll).
- `src/lib/gpg/` — `canonicalize.ts` (pure: builds the byte string Git would hash for a commit), `sign.ts` (lazy-imports `openpgp`, exports `loadPrivateKey` / `signCommit` / `verifyDetached`), `storage.ts` (encrypted-key + metadata in localStorage).
- `src/lib/crypto.ts` — AES-GCM 256 + PBKDF2-SHA256 100k rounds. **Uint8Array generic must be `<ArrayBuffer>`** under TS 6, not `<ArrayBufferLike>` — Web Crypto rejects the latter.
- `src/lib/use-is-mobile.ts` — `useIsMobile()` hook based on `matchMedia('(max-width: 767px)')`. Use it for branches that need a distinct mobile layout (e.g. card view instead of a wide table).
- `src/stores/` — Zustand stores: `auth` (in-memory PAT + GitHub user; idle timeout pulled from `prefs`), `theme`, `prefs` (sidebar collapsed + density + idle timeout + author override + notification settings), `gpg` (in-memory PrivateKey + fingerprint + uid + enabled), `undo` (20-entry FIFO of reverse ops).
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
| `release_desktop.yml` | Tag `v*` push, or manual | Tauri build for Win + macOS aarch64 + macOS x86_64 (cross-compile) + Linux. Uploads `.dmg` / `.app.tar.gz` / `.pkg` (macOS), `.msi` / `.exe` (Windows), `.deb` / `.AppImage` (Linux). |

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

## Safe-edit rules

- Don't edit `lists/*.md` directly — they're regenerated by `generate_md.py`.
- Don't commit `webapp/dist/`, `webapp/src-tauri/target/`, `Cargo.lock`, or `webapp/src-tauri/icon-source.png`.
- Don't commit a real PAT, ever. Settings page handles it client-side; CI uses `secrets.GH_TOKEN`.
- When adding an npm dep, also add it to `webapp/src/lib/about.ts` so the About page lists it.

## Current state (as of v3.1.1)

`main` is the trunk. All feature work has merged. Tags `v3.0.0`, `v3.0.1`, `v3.1.0`, `v3.1.1` exist (all GPG-signed). The webapp is published at `https://poli0981.github.io/free-games-itchio-list/app/` once the user enables Pages → Source = GitHub Actions in repo Settings.
