# webapp/

React 19 + TypeScript 6 + Vite 8 + Tailwind v3 + shadcn/ui (Radix). Browse / edit
the [free-games-itchio-list](https://github.com/poli0981/free-games-itchio-list)
catalog. Reads come from `raw.githubusercontent.com` (public, no auth); writes
use a fine-grained GitHub PAT held only in memory after passphrase unlock.

A Tauri 2 wrapper in [`src-tauri/`](src-tauri/) ships the same React build as a
native desktop app — see [`TAURI.md`](TAURI.md).

## Local dev

Requires Node 22+ and npm.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # writes ../docs/app/  (NOT ./dist — that path is Tauri-only)
npm run lint     # ESLint
npm run preview  # serve the production build
```

Path alias `@/*` → `src/*`. Vite injects `__BUILD_DATE__` so the About page can
show the build date.

## Routes

| Route | File | Purpose |
|---|---|---|
| `/` | [src/routes/dashboard.tsx](src/routes/dashboard.tsx) | KPI cards (counts, NSFW share, free check status) |
| `/games` | [src/routes/games.tsx](src/routes/games.tsx) | Virtualized DataTable + faceted filters; bulk edit / delete |
| `/games/:slug` | [src/routes/game-detail.tsx](src/routes/game-detail.tsx) | 23-field read view + edit form for `safe_virus` / `notes` / `nsfw` |
| `/add` | [src/routes/add.tsx](src/routes/add.tsx) | Single URL or bulk paste → dispatch scraper workflow |
| `/charts` | [src/routes/charts.tsx](src/routes/charts.tsx) | 16 charts + KPI cards across 4 tabs |
| `/workflows` | [src/routes/workflows.tsx](src/routes/workflows.tsx) | Workflow run history + manual dispatch |
| `/deleted` | [src/routes/deleted.tsx](src/routes/deleted.tsx) | Tombstone log of removed games |
| `/settings` | [src/routes/settings.tsx](src/routes/settings.tsx) | PAT lock/unlock, theme, sidebar prefs |
| `/about` | [src/routes/about.tsx](src/routes/about.tsx) | Dev info, bug-report link, social handles, third-party attribution |

`App.tsx` wires all routes via `react-router-dom` HashRouter. Routes other than
`/` and `/games` are `React.lazy` so the initial bundle stays ~163 KB gzip.

## Auth (PAT)

Edits / deletes / queueing URLs / dispatching workflows require a GitHub
fine-grained PAT scoped to `poli0981/free-games-itchio-list` with:

- `Contents: Read and write`
- `Actions: Read and write`

The token is encrypted at rest with AES-GCM 256 + PBKDF2-SHA256 (100k rounds)
under your passphrase. Decrypted form lives only in memory between unlock and
explicit Lock or tab close. See [`../SECURITY.md`](../SECURITY.md).

## Code-split layout

[`vite.config.ts`](vite.config.ts) `manualChunks` splits node_modules into:

| Chunk | Contents |
|---|---|
| `vendor-react` | React, react-dom, react-router |
| `vendor-query` | TanStack Query / Table / Virtual |
| `vendor-ui` | Radix primitives, shadcn helpers, lucide-react |
| `vendor-charts` | Recharts (~380 KB) |
| `vendor-github` | Octokit (~100 KB) |

## Source layout

| Path | Purpose |
|---|---|
| `src/routes/*.tsx` | One file per route |
| `src/components/data-table/*` | TanStack Table + Virtual + pagination + faceted filter |
| `src/components/ui/*` | shadcn/ui primitives (Button, Card, Dialog, …) |
| `src/components/ext-link.tsx` | Runtime-aware external-link wrapper (web vs Tauri) |
| `src/lib/github/*` | Octokit factory, atomic Git Data commits, single-file `contents` PUT, workflow dispatch + poll |
| `src/lib/crypto.ts` | AES-GCM + PBKDF2 PAT encryption |
| `src/lib/external-link.ts` | `openExternal()` — uses `tauri-plugin-opener` on desktop, `window.open` on web |
| `src/lib/runtime.ts` | `isTauri()` + Tauri `runtime_info` invoke |
| `src/lib/about.ts` | App / dev / social / third-party constants for the About route |
| `src/stores/*` | Zustand stores: `auth`, `theme`, `prefs`, `undo` (20-entry FIFO) |

## Deploy (web)

[`.github/workflows/deploy_webapp.yml`](../.github/workflows/deploy_webapp.yml)
builds on push to `main` that touches `webapp/` and publishes to GitHub Pages.
**One-time setup**: repo Settings → Pages → Source = "GitHub Actions". Live at
<https://poli0981.github.io/free-games-itchio-list/app/>.

## Desktop (Tauri)

See [`TAURI.md`](TAURI.md) for prerequisites (rustup + platform deps),
`npm run tauri:dev` / `npm run tauri:build`, capability scopes, and adding new
Rust commands. Multi-platform installers are built by
[`.github/workflows/release_desktop.yml`](../.github/workflows/release_desktop.yml)
on `v*` tag push.

## House rules

- Don't commit `dist/`, `../docs/app/`, `src-tauri/target/`, `Cargo.lock`, or
  `src-tauri/icon-source.png`.
- Never commit a real PAT.
- New npm dep? Add it to [`src/lib/about.ts`](src/lib/about.ts) `THIRD_PARTY` so
  the About page lists it.
- New external-link site? Use `<ExtLink href="…">` from
  [`src/components/ext-link.tsx`](src/components/ext-link.tsx) — never raw
  `<a href="…" target="_blank">`. Plain anchors work on web but silently break
  on the Tauri desktop build.
