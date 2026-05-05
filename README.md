# Free Itch.io Games List

[![Version](https://img.shields.io/badge/version-3.1.2-blue.svg)](https://github.com/poli0981/free-games-itchio-list/)
[![Stars](https://img.shields.io/github/stars/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/stargazers)
[![Forks](https://img.shields.io/github/forks/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/network/members)
[![Last Updated](https://img.shields.io/github/last-commit/poli0981/free-games-itchio-list?label=last%20updated)](https://github.com/poli0981/free-games-itchio-list/commits/main)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A curated, auto-updating catalog of free games on [itch.io](https://itch.io). Games are scraped, validated, and
organized into browsable markdown tables — updated daily via GitHub Actions.

## Table of contents

- [Browse by genre](#browse-by-genre)
- [Webapp (browse + edit + analytics)](#webapp-browse--edit--analytics)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Automation (GitHub Actions)](#automation-github-actions)
- [Data fields](#data-fields)
- [Contributing](#contributing)
- [Legal](#legal)

## Browse by genre

Tables are auto-generated and split by primary genre (max 300 games per file). New genres appear automatically as games
are added.

- [Action](lists/action.md)
- [Adventure](lists/adventure.md)
- [Puzzle](lists/puzzle.md)
- [Horror](lists/horror.md)
- [Visual Novel](lists/visual_novel.md)
- [Simulation](lists/simulation.md)
- [Platformer](lists/platformer.md)
- [Other](lists/other.md)
- *(more genres auto-create as needed)*

## Webapp (browse + edit + analytics)

A React + TypeScript SPA in [`webapp/`](webapp/) provides a browsable UI on top of the same JSON
catalog: virtualized DataTable for all 500+ games, faceted filters (genre / status / platforms /
NSFW), 9 charts (Recharts), bulk edit/delete via the GitHub Git Data API, and a one-click "add"
flow that dispatches the scraper workflow with a URL input.

- **Web build**: deployed to GitHub Pages by [`.github/workflows/deploy_webapp.yml`](.github/workflows/deploy_webapp.yml)
  — pushes to `main` that touch `webapp/` ship automatically. (One-time setup: repo
  Settings → Pages → Source = "GitHub Actions".)
- **Desktop build (optional)**: same React code wraps as a Tauri 2 native app for Windows / macOS
  / Linux. See [`webapp/TAURI.md`](webapp/TAURI.md) for prerequisites and `npm run tauri:dev`.
  Multi-platform installers are built by [`.github/workflows/release_desktop.yml`](.github/workflows/release_desktop.yml)
  on tag push (`v*`).
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
npm run build        # writes to docs/app/
npm run tauri:dev    # native desktop (requires Rust)
```

## How it works

```
temp_link.json          →   update_info.py        →   data_game/
(new URLs added here)       (scrape + free check)     game_info_001.json
                                                      game_info_002.json ...
                                                          │
                ┌─────────────────────────────────────────┘
                ▼                                        ▼
        generate_md.py                           check_paid.py
        (MD tables)                              check_alive.py
                                                 (cleanup)
```

1. **Add links** — paste itch.io URLs into `scripts/temp_link.json` (manually, via PR, or via the companion browser
   extension).
2. **Daily scrape** — GitHub Actions runs `update_info.py` at 03:00 UTC. Each link is fetched, checked for free status,
   and scraped for metadata. Paid games are automatically skipped.
3. **Generate tables** — `generate_md.py` groups games by primary genre and outputs markdown tables into `/lists/`.
4. **Periodic cleanup** — every 2 days, `check_paid.py` re-checks if any game in the list became paid, and
   `check_alive.py` verifies that game pages still exist. Removed games are logged with a reason.

## Project structure

```
data_game/              # Game database (chunked JSON, max 500 per file)
├── game_info_001.json
├── game_info_002.json
└── ...

scripts/
├── scraper.py          # Shared module: session, rate-limiting, free detection, parsing
├── data_store.py       # Shared module: multi-file load/save/rebalance
├── update_info.py      # Scrape new games from temp_link.json → data_game/
├── check_paid.py       # Re-check existing games for paid status
├── check_alive.py      # Verify game URLs still exist (404/410 → remove)
├── generate_md.py      # Generate per-genre markdown tables
├── log_deleted.py      # Export deleted_games.json → deleted_games.txt
├── temp_link.json      # Input queue for new URLs
└── deleted_games.json  # Log of removed games with reasons

bash/
├── test.sh             # Wrapper: scrape + reset temp_link
├── table.sh            # Wrapper: generate MD tables
├── check_paid.sh       # Wrapper: check paid status
├── check_alive.sh      # Wrapper: check dead links
└── log_deleted.sh      # Wrapper: export deletion log

lists/                  # Auto-generated markdown tables (one per genre)

.github/workflows/
├── update.yml             # Daily 03:00 UTC — scrape new games
│                          # (also accepts an optional `url` input from webapp)
├── generate_table.yml     # Runs after update/check workflows
├── check_paid.yml         # Every 2 days 04:00 UTC
├── check_alive.yml        # Every 2 days 07:00 UTC
├── log_deleted.yml        # Runs after check workflows
├── deploy_webapp.yml      # Build webapp/ → GitHub Pages on push to main
└── release_desktop.yml    # Build Tauri installers (Win/macOS/Linux) on v* tag

webapp/                 # React + TS SPA + Tauri desktop wrapper
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
| Update game info   | Daily 03:00 UTC        | Scrape new links from `temp_link.json` (+ optional `url` input from webapp), skip paid |
| Generate tables    | After update/checks    | Rebuild markdown tables in `/lists/`                        |
| Check paid games   | Every 2 days 04:00 UTC | Remove games that became paid                               |
| Check dead links   | Every 2 days 07:00 UTC | Remove 404/410 game pages                                   |
| Log deleted games  | After check workflows  | Export deletion log to `deleted_games.txt`                  |
| Deploy webapp      | On push to main        | Build `webapp/` → GitHub Pages (`docs/app/`)                |
| Release desktop    | On `v*` tag push       | Build Tauri installers (Win/macOS/Linux) → draft Release    |

All workflows include rate-limiting (random delays, batch pauses) to avoid being blocked by itch.io. Network errors are
treated as transient — games are only removed on confirmed 404/410 or confirmed paid status.

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
- **Report bugs** — use the "Bug Report" template.
- **Request features** — open an issue or submit a PR.

Contributors are credited in [ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md).

## Connect / support

Two Discord servers exist now (the "if I ever make one" disclaimer is officially obsolete):

- **Chat**: Discord — [Repo discussion](https://discord.gg/2aNR3aVt) · [Game chat](https://discord.gg/kDM9GMu5vm)
- **Social**: [X/@SkullMute0011](https://x.com/SkullMute0011) · [YouTube/@SkullMute](https://youtube.com/@SkullMute) · [Bluesky](https://bsky.app/profile/skullmute0011.bsky.social) · [Mastodon](https://mastodon.social/@skullmute1122)
- **Support** (totally optional): [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Buy Me a Coffee](https://buymeacoffee.com/skullmute)
- **Gaming**: [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

DMs are open everywhere — replies slow, introvert max level. The About page in the [webapp](https://poli0981.github.io/free-games-itchio-list/app/#/about) has the same list with one-click buttons.

## Legal

- [Disclaimer](docs/DISCLAIMER.md)
- [Privacy Policy](docs/PrivacyPolicy.md)
- [Terms of Service](docs/ToS.md)
- [EULA](docs/EULA.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security](./SECURITY.md)

Licensed under [MIT](LICENSE).