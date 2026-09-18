# Free Itch.io Games List

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/poli0981/free-games-itchio-list/releases/latest)
[![Website](https://img.shields.io/badge/website-freeitchgames.win-purple.svg)](https://freeitchgames.win)
[![Stars](https://img.shields.io/github/stars/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/stargazers)
[![Forks](https://img.shields.io/github/forks/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/network/members)
[![Last Updated](https://img.shields.io/github/last-commit/poli0981/free-games-itchio-list?label=last%20updated)](https://github.com/poli0981/free-games-itchio-list/commits/main)
[![Code: MIT](https://img.shields.io/badge/code-MIT-yellow.svg)](LICENSE)
[![Data & docs: CC BY 4.0](https://img.shields.io/badge/data%20%26%20docs-CC%20BY%204.0-lightgrey.svg)](data_game/LICENSE.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](README.vi.md)

> 🇻🇳 Tiếng Việt: see [`README.vi.md`](README.vi.md). Vietnamese translations of the policy docs live in [`docs/i18n/vi/`](docs/i18n/vi/). The English versions in this repo remain controlling for legal interpretation.

A curated, auto-updating catalog of **2,600+ free games on [itch.io](https://itch.io)**. Browse it at
**<https://freeitchgames.win>**: search, filter, sort, and jump to any game's itch.io page. The site is
read-only for everyone: no accounts, no sign-in, no comments, no ads, no payments.

## Table of contents

- [Browse the catalog](#browse-the-catalog)
- [Desktop and Android apps](#desktop-and-android-apps)
- [Add a game](#add-a-game)
- [How the data stays fresh](#how-the-data-stays-fresh)
- [Under the hood](#under-the-hood)
- [Project structure](#project-structure)
- [Automation](#automation)
- [Data fields](#data-fields)
- [Contributing](#contributing)
- [Connect / support](#connect--support)
- [License](#license)
- [Legal](#legal)

## Browse the catalog

Everything lives on the website, **<https://freeitchgames.win>**:

- **Games**: the whole catalog in one fast table (cards on phones), with filters for genre, platform,
  status and more, plus a detail page for every game.
- **Charts**: how the catalog breaks down, and how it has grown over time.
- **Removed**: every game dropped from the catalog, with the reason
  (<https://freeitchgames.win/removed>).
- **18+ content is hidden by default.** Games flagged `nsfw: Yes` stay hidden (covers included) unless
  you opt in under Settings after confirming you are 18 or older. That choice is stored only in your
  browser.

Every link goes to the game's own page on itch.io. Cover images on the website are resized copies served
by freeitchgames.win, so your browser does not contact itch.io until you click a link.

Want the raw data? It is plain JSON, in [`data_game/`](data_game/) in this repo and at
<https://freeitchgames.win/data/index.json> (plus the files it lists). Please use those files instead of
scraping the website; see [License](#license) for how you may reuse them.

(The old address, `poli0981.github.io/free-games-itchio-list`, only redirects to the new site. The
per-genre markdown tables under `lists/` and `deleted_games.txt` are gone: the catalog is web-only.)

## Desktop and Android apps

The same app also ships as native **read-only viewers**, built with Tauri 2 from the same code. Grab them
from the latest [GitHub Release](https://github.com/poli0981/free-games-itchio-list/releases/latest):

| Platform | Files |
|---|---|
| Windows | `.msi` or `.exe` installer |
| macOS | `.dmg`, `.pkg` or `.app.tar.gz` (needs Safari/WebKit 16.4 or newer) |
| Linux | `.deb` or `.AppImage` |
| Android 11+ (arm64-v8a) | `.apk` (sideloaded, see below) |

The apps download the catalog JSON from <https://freeitchgames.win/data> and load cover images directly
from itch.io's image CDN (`img.itch.zone`); clicking a game opens itch.io in your browser. No telemetry.
Updates are manual: download a new release when one comes out. Installing an app means accepting the
[EULA](docs/EULA.md).

### Android (download & install)

No Play Store: just grab the `.apk` and sideload it (Android is fine with this, it just asks nicely first):

1. Open the latest [Release](https://github.com/poli0981/free-games-itchio-list/releases/latest) and
   download `FreeGamesItchio_<version>_arm64-v8a.apk`. Only install the APK from that page: it is signed
   with the project's key.
2. Tap it. Android will ask to **allow installs from this source** (browser / file manager). Turn it on
   (Settings → *Apps* → *Special access* → *Install unknown apps*).
3. Accept the "not from Play Store" warning and install. It's the same app as the web/desktop build.

Notes: **arm64-v8a only** (every phone since ~2017; 32-bit-only devices aren't supported), and Android
**11+** (API 30). Older versions can't install it. That's deliberate: it keeps the floor at a release that
still gets security hardening and that we actually test on (≈87% of active devices;
[why](webapp/TAURI.md#why-android-11-api-30)). Building it yourself is in the Android section of
[`webapp/TAURI.md`](webapp/TAURI.md).

## Add a game

There are three ways a game gets into the catalog. **All three go through a review queue**: nothing is
added until the Maintainer approves it.

1. **Suggest page**: <https://freeitchgames.win/suggest>. Paste an itch.io game link and, if you like, a
   short note (up to 500 characters; notes are deleted after 180 days). A Cloudflare Turnstile check and a
   rate limit keep spam out. Please don't put personal data in the note.
2. **Browser extension**: the Maintainer's own
   [itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension) (separate repo, GPL-3.0) sends
   links through an authenticated API while browsing itch.io.
3. **Automatic discovery**: every 4 hours the site reads one of itch.io's public RSS feeds of new and
   popular free games (one feed per run) and queues what it finds.

The Maintainer reviews the queue in a private admin area (protected by Cloudflare Access). Approved links
are handed to the data pipeline, which scrapes each game page; paid games are dropped.

Prefer GitHub, or have a long list? The "Add Games (bulk list)" issue template works too; those links go
through the same review. See [CONTRIBUTING.md](CONTRIBUTING.md#1-suggest-new-games-most-welcome).

Want a game **removed**, or its data corrected (game creators especially)? Email
**takedown@freeitchgames.win** or open a
["Remove a game" issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml).
Include the game URL, who you are (creator / rights holder, or authorized by them) and the reason.
Details: [Terms of Use](docs/ToS.md) and [Disclaimer](docs/DISCLAIMER.md).

## How the data stays fresh

```
Suggest page ──┐
Extension    ──┼─→ review queue ─→ Maintainer approves ─→ scripts/temp_link.json
RSS feeds    ──┘                     (admin)                  │
                                                              ▼
                         update.yml → update_info.py (new games) ──┐
                         refresh.yml → refresh.py (1/7 per day)  ──┴─→ patch ─→ apply_patch.py
                                                                          (validate + push)
                                                                                 │
                                          freeitchgames.win/data ←── data_game/*.json
```

1. **Queue**: approved links are committed to `scripts/temp_link.json` by the project's GitHub App
   (verified commits).
2. **Ingest**: `update.yml` runs `update_info.py` as soon as the queue changes (and daily as a fallback).
   Each link is canonicalized, fetched, checked for free status and scraped; paid, dead, duplicate and
   previously removed games are skipped. Transient failures stay queued and are retried (up to 3 runs).
3. **Refresh**: `refresh.yml` re-checks one seventh of the catalog every day (one request per game), so
   every game is re-checked weekly: dead links (404/410), games that became paid, rating and status. A
   game is only removed when the same problem is seen again at least 20 hours later. Removals are logged
   with a reason in [`scripts/deleted_games.json`](scripts/deleted_games.json), and a run that would
   remove an implausible number of games holds them back and alerts instead.
4. **Commit safely**: both steps emit a URL-keyed patch; `apply_patch.py` applies it to the latest `main`,
   validates every data file (`validate.py`) and only then pushes, retrying if another writer got there
   first.
5. **Publish**: every push to `main` rebuilds the website, which bundles the catalog under
   <https://freeitchgames.win/data>.

The pipeline is polite to itch.io: it identifies itself as
`FreeItchGamesBot/4.0 (+https://freeitchgames.win/about)`, paces its requests and honours HTTP 429 /
`Retry-After`. Only public itch.io pages and feeds are read.

## Under the hood

- **Web app** ([`webapp/src/`](webapp/src/)): React + TypeScript + Vite + Tailwind CSS, TanStack
  Query / Table / Virtual, React Router, Zustand. English and Vietnamese UI.
- **Cloudflare Worker** ([`webapp/worker/`](webapp/worker/)): serves the site and `/data`, the image proxy
  (`/img`, resized WebP covers stored on Cloudflare R2), the Suggest and ingest APIs, the review queue
  (Cloudflare D1), the admin API and the RSS discovery schedule. Config:
  [`webapp/wrangler.jsonc`](webapp/wrangler.jsonc).
- **Admin app** ([`webapp/admin/`](webapp/admin/)): the Maintainer-only review screen at `/admin`, behind
  Cloudflare Access. It writes to this repo as a GitHub App.
- **Native shell** ([`webapp/src-tauri/`](webapp/src-tauri/)): Tauri 2 for Windows, macOS, Linux and
  Android. See [`webapp/TAURI.md`](webapp/TAURI.md).
- **Data pipeline** ([`scripts/`](scripts/), Python 3.14): scraper, refresh, patch/apply and validation,
  run by GitHub Actions.

Deploys happen through Cloudflare Workers Builds (root dir `webapp`, `npm run build`, then
`npx wrangler deploy`): every push to `main` ships automatically.

Quick local dev (full setup, including the Worker, secrets and tests, is in
[`docs/dev_env.md`](docs/dev_env.md)):

```sh
cd webapp
npm ci
npm run dev          # http://localhost:5173 (Vite)
npm run build        # writes to webapp/dist/ (the Worker serves it as its assets)
npx wrangler dev     # second terminal: Worker on :8787; Vite proxies /api and /img to it
npm run tauri:dev    # native desktop window (requires Rust)
```

## Project structure

```
data_game/              # Catalog (chunked JSON, max 500 per file) + LICENSE.md (CC BY 4.0)
├── game_info_001.json
├── ...
├── index.json          # Chunk manifest (total + per-file counts)
└── count_history.json  # Daily totals for the "games over time" chart

scripts/
├── scraper.py          # Shared: HTTP session, pacing / 429 back-off, free detection, parsing
├── data_store.py       # Shared: chunked load/save (minimal diffs), index.json, count_history.json
├── canonical.py        # One canonical form for itch.io game URLs
├── update_info.py      # Queued URLs → patch (new games)
├── refresh.py          # Rotating health check → patch (alive / paid / rating / status); --full re-scrape
├── apply_patch.py      # Apply a patch to the latest main, then validate
├── validate.py         # Schema + consistency checks for every data file
├── temp_link.json      # Ingest queue (approved links)
├── deleted_games.json  # Log of removed games with reasons (public)
└── state/              # Pipeline bookkeeping (last check, strikes, retries), not published

bash/commit_push.sh     # fetch main → apply patch → validate → commit → push (with retries)
tests/                  # pytest suite (no network) + fixtures shared with the Worker

webapp/
├── src/                # React app (routes, components, stores, i18n)
├── admin/              # Maintainer-only admin app (/admin)
├── worker/             # Cloudflare Worker (data, image proxy, APIs, review queue, RSS discovery)
├── src-tauri/          # Tauri 2 shell (desktop + Android)
├── wrangler.jsonc      # Cloudflare config
└── TAURI.md            # Desktop / Android build notes

LICENSE                 # MIT (code)
LICENSES/CC-BY-4.0.txt  # Full CC BY 4.0 legal code (data + docs)
NOTICE.md               # License map, non-affiliation, attributions
docs/                   # Policies, dev environment, third-party list (+ Vietnamese mirrors in docs/i18n/vi/)
```

## Automation

| Job | Schedule | Purpose |
|---|---|---|
| Ingest (`update.yml`) | On queue change + daily 01:23 UTC | Scrape approved links from `temp_link.json`, skip paid / dead / removed |
| Refresh (`refresh.yml`) | Daily 02:47 UTC | Re-check 1/7 of the catalog: dead links, now-paid games, rating, status |
| Force update (`force_update.yml`) | Manual | Re-scrape every field (one URL or the next batch); keeps `safe_virus` / `notes` / `nsfw` |
| RSS discovery (Cloudflare Worker) | Every 4 hours | Poll one itch.io feed per run; new games go to the review queue |
| Python CI / Webapp CI | Pull requests | Lint, tests, data validation / type-check, tests, build |
| Deploy website | On push to `main` | Cloudflare Workers Builds (`webapp/wrangler.jsonc`) → freeitchgames.win |
| Release desktop / Android | On `v*` tag push | Tauri installers (Win/macOS/Linux) and signed APK → draft Release |

Network errors are treated as transient; a game is removed only after the same 404/410 or paid status is
seen again at least 20 hours after the first sighting. Failures, cancellations, rate limits and suspicious
mass changes are reported to the project's Discord as automated notifications.

## Data fields

Each game in `data_game/game_info_NNN.json` has these 20 fields (plus optional `added_at` / `updated_at`
timestamps added by the pipeline). Only `safe_virus`, `notes` and `nsfw` are maintained by the Maintainer;
everything else is scraped from the game's public itch.io page, and no re-scrape ever overwrites those three.

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
| `nsfw`            | 18+ flag, `Yes` / `No` (suggested from tags, warnings and description when a game is added; maintained by the Maintainer) |
| `safe_virus`      | Manual safety note: `?` (default), `Yes`, `No`, `Caution`. A note, not a guarantee: downloads are not scanned |
| `notes`           | Manual notes                                               |
| `thumbnail`       | Cover image URL (on itch.io)                               |

Scraped fields default to `N/A` when not available on the game page.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

- **Add games**: use the [Suggest page](https://freeitchgames.win/suggest).
- **Remove a game / fix its data**: email takedown@freeitchgames.win or open a
  ["Remove a game" issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml).
- **Report bugs**: use the "Bug Report" issue template.
- **Request features**: use the "Feature Request / Improvement" template, or send a PR.
- **Security issues**: report them privately, never in a public issue. See [SECURITY.md](SECURITY.md).
- **Privacy questions**: see the [Privacy Policy](docs/PrivacyPolicy.md) or email privacy@freeitchgames.win.
- Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Contributors are credited in [ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md).
Maintainer hardware + dev environment: [`docs/pc_spec.md`](docs/pc_spec.md), [`docs/dev_env.md`](docs/dev_env.md).

## Connect / support

Two Discord servers exist now (the "if I ever make one" disclaimer is officially obsolete):

- **Chat**: Discord: [Repo discussion](https://discord.gg/2aNR3aVt) · [Game chat](https://discord.gg/kDM9GMu5vm)
- **Social**: [X/@SkullMute0011](https://x.com/SkullMute0011) · [YouTube/@SkullMute](https://youtube.com/@SkullMute) · [Bluesky](https://bsky.app/profile/skullmute0011.bsky.social) · [Mastodon](https://mastodon.social/@skullmute1122)
- **Messaging**: [Telegram (DM)](https://t.me/SkullMute0011)
- **Support** (totally optional, mirrors [`.github/FUNDING.yml`](.github/FUNDING.yml)): [GitHub Sponsors](https://github.com/sponsors/poli0981) · [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Buy Me a Coffee](https://buymeacoffee.com/skullmute) · [PayPal](https://paypal.me/DungDang212)
- **Gaming**: [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

DMs are open everywhere; replies are slow (introvert max level). The site's
[About page](https://freeitchgames.win/about) has the same list with one-click buttons.

## License

This repo uses three licenses (full map in [NOTICE.md](NOTICE.md)):

| What | License | File |
|---|---|---|
| **Code**: `scripts/`, `webapp/`, `bash/`, workflows, tests, everything not listed below | MIT, Copyright (c) 2025-2026 poli0981 (SkullMute) | [`LICENSE`](LICENSE) |
| **Catalog data**: `data_game/`, `scripts/deleted_games.json` and the derived files at <https://freeitchgames.win/data> | CC BY 4.0, for the Maintainer's contribution (see below) | [`data_game/LICENSE.md`](data_game/LICENSE.md) |
| **Documentation**: the `*.md` files in the repo root and `docs/` (this README, the policies) | CC BY 4.0 | [`LICENSES/CC-BY-4.0.txt`](LICENSES/CC-BY-4.0.txt) |

**What the data license covers:** the selection and arrangement of the collection, the three
Maintainer-written fields (`safe_virus`, `notes`, `nsfw`), the removal records, and the structure and
derived statistics.

**What it does not cover** (owned by others, not licensed by this project): game descriptions and any other
text written by game creators, cover images / thumbnails and other media, game names, logos and trademarks,
and itch.io's trademarks. Plain facts such as URLs, prices and ratings are not copyrightable anyway.

When you reuse the data, please credit it like this:

```
Free itch.io games catalog by poli0981 (SkullMute) — https://freeitchgames.win — CC BY 4.0
```

Third-party components keep their own licenses: see [`docs/THIRD_PARTY.md`](docs/THIRD_PARTY.md) and the
site's About page. The browser extension is a separate repo under GPL-3.0. Contributions are accepted under
the same license as the part they change (inbound = outbound): MIT for code, CC BY 4.0 for data and docs.

**Not affiliated with itch.io.** This is an independent fan project. It is not affiliated with, endorsed by,
or sponsored by itch.io, Leaf Corcoran or itch corp. "itch.io" and all game names, logos and trademarks
belong to their respective owners.

## Legal

- [Terms of Use](docs/ToS.md): covers the website and everything on it
- [Privacy Policy](docs/PrivacyPolicy.md)
- [Disclaimer](docs/DISCLAIMER.md)
- [EULA](docs/EULA.md): covers the desktop and Android apps only
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [NOTICE](NOTICE.md)

Contact (forwarded to the Maintainer):

- Privacy: **privacy@freeitchgames.win**
- Content removal / copyright: **takedown@freeitchgames.win**
- Security vulnerabilities: **security@freeitchgames.win** (or GitHub private vulnerability reporting)
- Anything else legal: **legal@freeitchgames.win**
