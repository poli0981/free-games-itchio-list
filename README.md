# Free Itch.io Games List

[![Version](https://img.shields.io/badge/version-3.6.1-blue.svg)](https://github.com/poli0981/free-games-itchio-list/)
[![Stars](https://img.shields.io/github/stars/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/stargazers)
[![Forks](https://img.shields.io/github/forks/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/network/members)
[![Last Updated](https://img.shields.io/github/last-commit/poli0981/free-games-itchio-list?label=last%20updated)](https://github.com/poli0981/free-games-itchio-list/commits/main)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](README.vi.md)

> 🇻🇳 Tiếng Việt: see [`README.vi.md`](README.vi.md). Vietnamese translations of the policy docs live in [`docs/i18n/vi/`](docs/i18n/vi/). The English versions in this repo remain controlling for legal interpretation.

A curated, auto-updating catalog of free games on [itch.io](https://itch.io). Games are scraped, validated, and
published as a browsable, filterable website — **<https://freeitchgames.win>** — refreshed daily via GitHub Actions.

## Table of contents

- [Browse the catalog](#browse-the-catalog)
- [Webapp (browse + edit + analytics)](#webapp-browse--edit--analytics)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Automation (GitHub Actions)](#automation-github-actions)
- [Data fields](#data-fields)
- [Contributing](#contributing)
- [Legal](#legal)

## Browse the catalog

The catalog lives on the website: **<https://freeitchgames.win>** — search, filter by genre / platform /
status, sort, and open any game on itch.io. (The per-genre markdown tables under `lists/` were retired in
favour of the site.) The raw data is plain JSON in [`data_game/`](data_game/).

## Webapp (browse + edit + analytics)

A React + TypeScript SPA in [`webapp/`](webapp/) provides a browsable UI on top of the same JSON
catalog: virtualized DataTable for all 2,600+ games, faceted filters (genre / status / platforms /
NSFW), 16 charts (Recharts), bulk edit/delete via the GitHub Git Data API, and a one-click "add"
flow that dispatches the scraper workflow with a URL input.

- **Web build**: deployed to **<https://freeitchgames.win>** by Cloudflare Workers Builds from
  [`webapp/wrangler.jsonc`](webapp/wrangler.jsonc) — every push to `main` ships automatically (no
  GitHub Actions deploy). The old GitHub Pages address only redirects there.
- **Desktop build (optional)**: same React code wraps as a Tauri 2 native app for Windows / macOS
  / Linux. See [`webapp/TAURI.md`](webapp/TAURI.md) for prerequisites and `npm run tauri:dev`.
  Multi-platform installers are built by [`.github/workflows/release_desktop.yml`](.github/workflows/release_desktop.yml)
  on tag push (`v*`).
- **Android build (optional)**: the same app also ships as a sideloadable `.apk` (arm64-v8a) via
  Tauri mobile. A signed APK is built by [`.github/workflows/release_android.yml`](.github/workflows/release_android.yml)
  and attached to the same draft Release. See [Android (download & install)](#android-download--install)
  below and the Android section of [`webapp/TAURI.md`](webapp/TAURI.md).
- **Auth**: a fine-grained PAT with `contents:write` + `workflow:write` is encrypted in
  localStorage with a passphrase (AES-GCM, PBKDF2-SHA256). Decrypted token only lives in memory.
  Reads are public (no auth needed).
- **Edits commit as `chore(webapp): …`** so they're easy to filter from the daily scraper
  commits.

Local dev:

```sh
cd webapp
npm install
npm run dev          # http://localhost:5173
npm run build        # writes to webapp/dist/
npm run tauri:dev    # native desktop (requires Rust)
```

## Android (download & install)

No Play Store — just grab the `.apk` and sideload it (Android is fine with this, it just
asks nicely first):

1. Open the latest [Release](https://github.com/poli0981/free-games-itchio-list/releases) and
   download `FreeGamesItchio_<version>_arm64-v8a.apk`.
2. Tap it. Android will ask to **allow installs from this source** (browser / file manager) —
   turn it on (Settings → *Apps* → *Special access* → *Install unknown apps*).
3. Accept the "not from Play Store" warning and install. It's the same app as the web/desktop
   build, just signed by me instead of Google.

Notes: **arm64-v8a only** (every phone since ~2017 — 32-bit-only devices aren't supported), and
Android **11+** (API 30). Older versions can't install it — that's deliberate: it keeps the floor
at a release that still gets security hardening and that we actually test on (≈87% of active
devices; [why](webapp/TAURI.md#why-android-11-api-30)). Building it yourself is in the Android
section of [`webapp/TAURI.md`](webapp/TAURI.md).

## How it works

```
temp_link.json ─→ update_info.py ─┐                     ┌─→ data_game/*.json ─→ freeitchgames.win
(queued URLs)     (scrape, free?) ├─→ patch.json ─→ apply_patch.py
data_game/     ─→ refresh.py    ──┘   (URL-keyed)    (validate + push)
(1/7 per day)     (alive / paid / rating / status)
```

1. **Add links** — itch.io URLs are queued in `scripts/temp_link.json` (by the companion browser extension, or
   manually / via PR).
2. **Ingest** — `update.yml` runs `update_info.py` as soon as the queue changes (and daily as a fallback). Each
   link is canonicalized, fetched, checked for free status and scraped; paid, dead, duplicate and previously
   removed games are skipped. Transient failures stay queued and are retried (up to 3 runs).
3. **Refresh** — `refresh.yml` checks one seventh of the catalog every day (one request per game), so every
   game is re-checked weekly: dead links (404/410), games that became paid, rating and status. A game is only
   removed when the same problem is seen on two different days; removals are logged with a reason.
4. **Commit safely** — both steps emit a URL-keyed patch; `apply_patch.py` applies it to the latest `main`,
   validates every data file (`validate.py`) and only then pushes, retrying if another writer got there first.

## Project structure

```
data_game/              # Game database (chunked JSON, max 500 per file)
├── game_info_001.json
├── game_info_002.json
└── ...

scripts/
├── scraper.py          # Shared: HTTP session, pacing / 429 back-off, free detection, parsing
├── data_store.py       # Shared: chunked load/save (minimal diffs), index.json, count_history.json
├── canonical.py        # One canonical form for itch.io game URLs
├── update_info.py      # Queued URLs → patch (new games)
├── refresh.py          # Rotating health check → patch (alive / paid / rating / status); --full re-scrape
├── apply_patch.py      # Apply a patch to the latest main, then validate
├── validate.py         # Schema + consistency checks for every data file
├── temp_link.json      # Input queue for new URLs
├── deleted_games.json  # Log of removed games with reasons
└── state/              # Pipeline bookkeeping (last check, strikes, retries) — not published

bash/commit_push.sh     # fetch main → apply patch → validate → commit → push (with retries)
tests/                  # pytest suite (no network) + fixtures shared with the web Worker

.github/workflows/
├── update.yml             # Ingest queued games (on queue change + daily)
├── refresh.yml            # Daily rotating catalog check
├── force_update.yml       # Manual full re-scrape (one URL or the next batch)
├── python-ci.yml          # Lint, tests, data validation
├── webapp-ci.yml          # Lint, type-check, build (no deploy)
├── release_desktop.yml    # Build Tauri installers (Win/macOS/Linux) on v* tag
└── release_android.yml    # Build signed Android APK (arm64-v8a) on v* tag

webapp/                 # React + TS SPA + Tauri desktop & Android wrapper
├── src/                # React app (routes, components, hooks, stores)
├── src-tauri/          # Rust + Tauri 2 config (icons, capabilities, main.rs)
├── TAURI.md            # Desktop build prerequisites and instructions
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## Automation (GitHub Actions)

| Workflow           | Schedule               | Purpose                                                     |
|--------------------|------------------------|-------------------------------------------------------------|
| Ingest queued games | On queue change + daily 01:23 UTC | Scrape links from `temp_link.json` (+ optional `url` input), skip paid / dead / removed |
| Refresh catalog    | Daily 02:47 UTC        | Check 1/7 of the catalog: dead links, now-paid games, rating, status |
| Force update       | Manual                 | Re-scrape every field (one URL or the next batch); keeps `safe_virus` / `notes` / `nsfw` |
| Python CI / Webapp CI | Pull requests       | Lint, tests, data validation / type-check and build         |
| Deploy webapp      | On push to main        | Cloudflare Workers Builds (`webapp/wrangler.jsonc`) → freeitchgames.win |
| Release desktop    | On `v*` tag push       | Build Tauri installers (Win/macOS/Linux) → draft Release    |
| Release Android    | On `v*` tag push       | Build signed APK (arm64-v8a) → draft Release                |

Scrapers identify themselves (`FreeItchGamesBot`), pace requests (random delays, batch pauses) and back off on
HTTP 429. Network errors are treated as transient; a game is removed only after the same 404/410 or paid status is
seen on two different days. Failures, cancellations and rate limits are reported to Discord.

## Data fields

Each game entry in `data_game/game_info_NNN.json` contains:

| Field             | Description                                                |
|-------------------|------------------------------------------------------------|
| `url`             | Game page URL                                              |
| `name`            | Game title                                                 |
| `dev`             | Developer / author name(s)                                 |
| `description`     | Short description (first sentence, max 200 chars)          |
| `genre`           | Genre(s) from itch.io                                      |
| `tags`            | All tags                                                   |
| `status`          | Release status                                             |
| `platforms`       | Available platforms (Windows, macOS, Linux, Web)           |
| `publisher`       | Publisher (if different from author)                       |
| `release_date`    | Full release date from page metadata                       |
| `made_with`       | Engine / tools used                                        |
| `rating`          | Average rating (from itch.io aggregate)                    |
| `rating_count`    | Number of ratings                                          |
| `average_session` | Typical play session length                                |
| `languages`       | Supported languages                                        |
| `inputs`          | Input methods (keyboard, mouse, gamepad)                   |
| `nsfw`            | NSFW flag (auto-detected from tags, warnings, description) |
| `safe_virus`      | Manual safety note (default: `?`)                          |
| `notes`           | Manual notes                                               |
| `thumbnail`       | Thumbnail image URL                                        |

All fields default to `N/A` when not available on the game page.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

- **Add games** — use the "Add New Games" issue template (max 50 links per issue).
- **Add games via Telegram bot** — alternative path for batch submissions through
  [@my_skull_bot](https://t.me/my_skull_bot); DM the owner to be whitelisted.
  Full flow + privacy notes: [CONTRIBUTING §1b](CONTRIBUTING.md#1b-add-games-via-telegram-bot-my_skull_bot--alternative-to-issues)
  · Bot repo: [poli0981/telegram-scraper-bot](https://github.com/poli0981/telegram-scraper-bot)
  ([USER_GUIDE.md](https://github.com/poli0981/telegram-scraper-bot/blob/main/docs/USER_GUIDE.md)).
- **Report bugs** — use the "Bug Report" template.
- **Request features** — open an issue or submit a PR.

Contributors are credited in [ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md).
Maintainer hardware + dev environment: [`docs/pc_spec.md`](docs/pc_spec.md), [`docs/dev_env.md`](docs/dev_env.md).

## Connect / support

Two Discord servers exist now (the "if I ever make one" disclaimer is officially obsolete):

- **Chat**: Discord — [Repo discussion](https://discord.gg/2aNR3aVt) · [Game chat](https://discord.gg/kDM9GMu5vm)
- **Social**: [X/@SkullMute0011](https://x.com/SkullMute0011) · [YouTube/@SkullMute](https://youtube.com/@SkullMute) · [Bluesky](https://bsky.app/profile/skullmute0011.bsky.social) · [Mastodon](https://mastodon.social/@skullmute1122)
- **Messaging**: [Telegram (DM)](https://t.me/SkullMute0011) · [Telegram bot — game submission](https://t.me/my_skull_bot) (DM your numeric ID privately, never in public channels)
- **Support** (totally optional, mirrors [`.github/FUNDING.yml`](.github/FUNDING.yml)): [GitHub Sponsors](https://github.com/sponsors/poli0981) · [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Buy Me a Coffee](https://buymeacoffee.com/skullmute) · [PayPal](https://paypal.me/DungDang212)
- **Gaming**: [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

DMs are open everywhere — replies slow, introvert max level. The About page in the [webapp](https://freeitchgames.win/#/about) has the same list with one-click buttons.

## Legal

- [Disclaimer](docs/DISCLAIMER.md)
- [Privacy Policy](docs/PrivacyPolicy.md)
- [Terms of Service](docs/ToS.md)
- [EULA](docs/EULA.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security](./SECURITY.md)

Licensed under [MIT](LICENSE).