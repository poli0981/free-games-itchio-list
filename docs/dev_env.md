# Development environment

Tooling the Maintainer uses to write and test code in this repo, and how to run each part locally.
You don't need exactly the same setup to contribute — anything compatible with the required
toolchains works. This is for reproducibility.

## IDEs

JetBrains 2026.x (paid lineup):

- **PyCharm** — Python pipeline (`scripts/`, `bash/` wrappers).
- **WebStorm** — `webapp/` (React + TypeScript + Vite, the Cloudflare Worker).
- **RustRover** — `webapp/src-tauri/` (Tauri 2 native shell).

VS Code, Sublime, vim, etc. all work fine; nothing JetBrains-specific is
checked into the repo.

## Language toolchains

| Stack | Required | Used for |
|-------|----------|----------|
| Python | 3.14 (`.python-version`) | Data pipeline (`scripts/`) and its tests |
| Node.js | 22.22+ (CI uses `webapp/.node-version`) | Web app, admin app, Worker, Tauri front end |
| npm | ships with Node.js | Dependencies (`npm ci` from `package-lock.json`) |
| Wrangler | project dependency (`npx wrangler`) | Local Worker, local D1, deploys |
| Rust | stable (via `rustup`) | Tauri desktop / Android builds only |
| Git | recent | Repo history, signed commits and tags |

Android builds also need Android Studio, the SDK / NDK and JDK 17 or 21 — see
[`webapp/TAURI.md`](../webapp/TAURI.md#android-apk).

## Python pipeline

### Setup

```sh
python -m venv .venv
# activate it: .venv\Scripts\activate (Windows) · source .venv/bin/activate (macOS / Linux)
pip install -r requirements-dev.txt
```

On Windows, set `PYTHONUTF8=1` (PowerShell: `$env:PYTHONUTF8 = "1"`) so Python reads and writes
the catalog files as UTF-8.

### Checks (same as `python-ci.yml`)

```sh
pytest                                   # tests/ — network access is blocked (tests/conftest.py)
ruff check scripts tests webapp/scripts  # lint (config in the root pyproject.toml)
ruff format --check scripts tests        # formatting (drop --check to apply it)
vulture                                  # dead code
python scripts/validate.py               # checks every catalog data file
```

### Try a real scrape

These make real requests to itch.io:

```sh
# add a game URL to scripts/temp_link.json, then:
python scripts/update_info.py --out patch.json
python scripts/apply_patch.py patch.json

# or re-check a few games already in the catalog:
python scripts/refresh.py --out patch.json --budget 5
python scripts/apply_patch.py patch.json
```

Scanners never write the catalog: they emit a URL-keyed patch, and `apply_patch.py` applies it and
runs `validate.py`. A local run changes `data_game/`, `scripts/*.json` and `scripts/state/` in your
working tree — leave those changes out of code PRs; on `main` the pipeline workflows update the
catalog. See [`CLAUDE.md`](../CLAUDE.md) for the data-layer overview.

## Web app

```sh
cd webapp
npm ci
npm run dev          # public app on http://localhost:5173 with HMR; /data is served from ../data_game
npm run build        # tsc -b + vite build → webapp/dist/ (app, /admin/, /data, sitemap.xml)
npm run preview      # serve the production build (without the Worker)
```

Covers (`/img`), the Suggest form (`/api/suggest`) and the admin API are Worker routes. Vite
proxies `/api` and `/img` to the Worker on port 8787, so start it too (next section); without it
the rest of the app works but covers don't load.

## Worker (local)

In a second terminal:

```sh
cd webapp
npm run build                                            # the Worker serves dist/ as its static assets
npx wrangler d1 migrations apply freeitchgames --local   # creates the local review-queue database
npx wrangler dev                                         # http://localhost:8787 (same as npm run cf:dev)
```

Keep using http://localhost:5173 for the app; http://localhost:8787 serves the last build, so
rebuild when you want it to show your changes. Everything runs locally (workerd); local D1, R2 and
cache data live in `webapp/.wrangler/` (gitignored — delete it to start over). Run the migrations
command again after adding a file to `worker/migrations/` (never edit a migration that has been
applied).

### `.dev.vars`

Local settings go in `webapp/.dev.vars` (dotenv format, gitignored). Values there also override the
`vars` in `wrangler.jsonc` for local runs. A typical file:

```ini
DEV_ADMIN_EMAIL=you@example.com
SITE_ORIGIN=http://localhost:5173
TURNSTILE_SITEKEY=1x00000000000000000000AA
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
# Only to try the verification gate under `npx wrangler dev` (http://localhost:8787):
# GATE_SECRET=<32+ random characters, e.g. `openssl rand -hex 32`>
```

| Key | Kind | What it does |
|---|---|---|
| `DEV_ADMIN_EMAIL` | local only, optional | Lets you into the admin without Cloudflare Access. Honoured only when the host is `localhost`, `127.0.0.1` or `[::1]`; ignored everywhere else |
| `ADMIN_EMAILS` | secret | Comma-separated admin allow-list, checked behind Access. Not needed locally with `DEV_ADMIN_EMAIL` |
| `TURNSTILE_SECRET` | secret | Suggest form and verification gate, together with the `TURNSTILE_SITEKEY` var |
| `GATE_SECRET` | secret | Signs the verification-gate cookie (32+ characters). Without it the gate stays off. Locally, set `SITE_ORIGIN=http://localhost:8787` and open the site through `wrangler dev`; the cookie is `fig_gate` there (no `Secure`) |
| `GATE_BOT_TOKEN` | secret | The value the zone's Transform Rule sends for verified bots (32+ characters). Required in production, not on localhost |
| `GH_APP_PRIVATE_KEY` | secret | GitHub App private key for admin writes — the PEM as GitHub downloads it (PKCS#1) or PKCS#8, together with the `GH_APP_ID` and `GH_APP_INSTALLATION_ID` vars |
| `SITE_ORIGIN` | var override | The Suggest form and the verification gate only accept POSTs whose `Origin` equals it |

A feature whose settings are missing answers `503`; the public site needs none of them. The two
Turnstile values above are Cloudflare's always-pass test keys
([Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)); never use
them in production. `npm run cf:types` ignores `.dev.vars` (it reads the empty `types.env`), so local
secrets never reach the committed `worker-configuration.d.ts`.

### Suggest form

With the file above, the local D1 migrated and both servers running,
http://localhost:5173/suggest submits into the local review queue.

### Admin

With `DEV_ADMIN_EMAIL` set, open http://localhost:5173/admin/ (Vite, hot reload) or
http://localhost:8787/admin/ (the built copy, as in production). Without the GitHub App settings the
admin is read-only: actions that write to the repo answer `503`. With `GH_APP_ID`,
`GH_APP_INSTALLATION_ID` and `GH_APP_PRIVATE_KEY` set, approvals and edits become **real commits** to
the `GITHUB_REPO` repository (by default the public one) — point `GITHUB_REPO` at a fork where your
App is installed.

### Cron (RSS discovery)

```sh
npx wrangler dev --test-scheduled
# then open http://localhost:8787/__scheduled
```

This runs `scheduled()` once: it polls **one real itch.io RSS feed** into the local queue, then does
the queue bookkeeping. Use it sparingly.

## Web app checks (same as `webapp-ci.yml`)

```sh
cd webapp
npm run cf:types -- --check            # worker-configuration.d.ts matches wrangler.jsonc
npm run lint                           # ESLint
npm run knip                           # unused files / exports / dependencies
npm test                               # Vitest: app + Worker; D1 tests start a local workerd
npx tsc -b                             # type-check only (npm run build runs it too)
npm run build
npx wrangler deploy --dry-run --env=""  # validates the Worker config, deploys nothing
```

After editing `wrangler.jsonc`, run `npm run cf:types` and commit the regenerated
`worker-configuration.d.ts`.

## Desktop and Android apps (Tauri)

```sh
cd webapp
npm run tauri:dev    # native window + HMR
npm run tauri:build  # native installers
```

The apps read the live catalog from https://freeitchgames.win/data and load covers from
`img.itch.zone`, so they need internet access but not the local Worker. Platform prerequisites
(WebView2 on Windows 10, Xcode CLT on macOS, `libwebkit2gtk-4.1-dev` on Debian/Ubuntu) and the
Android build are documented in [`webapp/TAURI.md`](../webapp/TAURI.md).

## Mobile testing

Web UI changes that touch responsive layout, navigation or the data table must be smoke-tested on a
real iOS device before tagging a release; the Android APK is signed off on the Android devices. See
[`pc_spec.md`](pc_spec.md) for the test devices.

## Deploying (Maintainer)

Cloudflare Workers Builds deploys every push to `main` (root directory `webapp`, build
`npm run build`, deploy `npx wrangler deploy`). D1 migrations are applied by hand
(`npx wrangler d1 migrations apply freeitchgames --remote`), secrets are set with
`npx wrangler secret put <NAME>`, and `npx wrangler deploy --env staging` deploys the staging Worker.
Details: [`webapp/README.md`](../webapp/README.md#deploy-web).

## Git hygiene

- Tag releases from `origin/main` only (see the
  [release process](../CLAUDE.md#release--tag-process)).
- The Maintainer's commits and release tags are signed locally (`commit.gpgsign=true`, `git tag -s`).
- Never commit `webapp/dist/`, `webapp/.wrangler/`, `webapp/.dev.vars`, `webapp/src-tauri/target/`,
  `webapp/src-tauri/gen/`, Android keystores, or any secret (GitHub App key, Turnstile secret,
  Access tokens). `webapp/src-tauri/Cargo.lock` **is** committed.

## See also

- [`pc_spec.md`](pc_spec.md) — hardware and test devices.
- [`webapp/README.md`](../webapp/README.md) — web app, Worker and admin details.
- [`webapp/TAURI.md`](../webapp/TAURI.md) — Tauri desktop and Android builds.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution flows.
