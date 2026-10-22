# Changelog — 4.4.x

Release notes for 4.4.0 to 4.4.2, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [4.4.2] - 2026-10-22 (Toolchain upgrade, code-scan fixes)

A maintenance release: nothing you would notice changes on the site or in the apps. The project now
builds with TypeScript 7, Node 26 and Python 3.15, and the issues a SonarQube Cloud scan of the
repository reported are fixed — the one that mattered was a path check in the Worker's not-found
handler that a crafted address could make expensive.

### Upgrade notes

- **Nothing to accept again**: no policy changed.
- **Desktop and Android apps**: install 4.4.2 over 4.4.1 as usual.
- **Building or running your own copy?** Use Node 26 for the web app and Python 3.15 for the
  pipeline. The Python dependencies are now pinned with hashes: `pip install -r requirements-dev.txt`
  works as before; to change one, edit `requirements.in` or `requirements-dev.in` and recompile with
  pip-tools (the command is at the top of each file).

### Fixed

- **Worker**: trailing slashes on request paths (not-found handler, admin routes, the Access issuer)
  and the verification cookie's base64 padding are trimmed by a loop instead of a regular expression
  that backtracked — a path with a long run of slashes cost quadratic CPU time on a public route. The
  itch.io feed and collection parsers lost three more expressions of that kind; a collection link's
  attributes are now read by splitting on quotes.
- **Pipeline**: itch.io's two mature-content notices are matched by one CSS selector, so either of
  them still marks a game NSFW (each now has a test). A few checks are written out so the scanner can
  follow them, without a change in behaviour, and the scraper no longer sets up plain-http requests
  (every page it fetches is https).

### Changed

- **Build tooling** (#149, #154): TypeScript 7.0, the native compiler, runs the type check, with the
  6.0 API installed beside it for typescript-eslint. Node 26 builds the web app and the release apps,
  and npm runs only the install scripts of esbuild and workerd. Python 3.15 runs the pipeline (UTF-8
  mode is now the default); its CI pin moved to `.github/python-version`, out of Dependabot's way.
- **Supply chain**: the pipeline's Python dependencies, indirect ones included, are locked with hashes
  (`requirements.txt`, `requirements-dev.txt`, compiled from `requirements*.in`) and installed from
  wheels only, so a new release of a dependency can no longer slip into the jobs that commit to the
  catalog. CI and the release builds install npm packages with `--ignore-scripts`, and the Workers
  config check runs the project's own wrangler (`npm run cf:check`).
- **Code scanning**: `.sonarcloud.properties` keeps the saved itch.io test pages out of the scan;
  the maintainer's `i18n-edit` script reads its operations from stdin instead of a file path.
- **Dependencies**: React 19.3.1 (#141), TanStack Query 5.104.4 (#142, #150), Radix UI primitives
  (#143), `@tauri-apps/api` 2.12.4, CLI 2.12.3 and `plugin-opener` 2.7.2 (#144) with the matching
  crates `tauri-build` 2.7.3, `tauri-plugin-opener` 2.7.2 and `tauri-plugin-single-instance` 2.5.4
  (#146), lucide-react 1.59.0 (#152), Vitest 5.0.5 (#153), Ruff 0.17.1 and Pillow 13 (#147),
  `actions/setup-java` 6.1.0 and `dtolnay/rust-toolchain` in the release workflows (#148).

## [4.4.1] - 2026-10-16 (Extension and bot retired)

The maintainer's browser extension and the old Telegram bot were hardly used, and both repositories
are now public archives (read-only):
[itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension) and
[telegram-scraper-bot](https://github.com/poli0981/telegram-scraper-bot). This version removes what was
left of them here. Games still come in through the Suggest page, itch.io's RSS feeds and the itch.io
collections the maintainer follows.

### Upgrade notes

- **Nothing to accept again.** The Privacy Policy, Terms of Use, EULA, Disclaimer and Security Policy
  (EN + VI) only lose their mentions of the extension and its API; nothing new is collected, so the
  legal check does not ask again.
- **Desktop and Android apps**: install 4.4.1 over 4.4.0 as usual.
- **Running your own copy of the Worker?** The `RL_INGEST` rate limit and the `ACCESS_AUD_INGEST`
  variable are gone from `wrangler.jsonc`; delete the Access application that protected
  `/api/ingest` and its service token. No D1 migration: the `idempotency` table stays and is no longer
  used.

### Removed

- **The ingest API** (`POST /api/ingest`), which the browser extension used to send links to the review
  queue with an Access service token. It never received a game since 4.0; the address now answers 404
  like any unknown API path.
- **Admin:** the "Browser extension" choice in the auto-approve settings and the "Extension" source in
  the review queue.
- **About page:** the old note asking to send a Telegram numeric ID privately (that was for the bot).
  The Telegram link stays as a way to reach the maintainer.

### Changed

- **Policies** (2026-10-16, EN + VI): the Privacy Policy no longer lists the extension as a source of
  games or its duplicate-submission records (7 days); the Terms of Use, the EULA (also in the
  installers) and the Security Policy no longer name the ingest API; the Disclaimer lists the three
  remaining ways games arrive. The extension and the bot are out of the Security Policy's scope.
- **Docs**: the READMEs, contributing guide, notices, acknowledgements and operations guide describe
  three ways games get in, and mark the extension and the bot as archived.
- **Dependencies**: Vite 8.3.4 (#131); Tauri 2.12.2 with `tauri-build` 2.7.2, `tauri-plugin-opener`
  2.7.1 and `tauri-plugin-single-instance` 2.5.3 (#135); `serde_json` 1.0.154 (#136); Ruff 0.17 for
  the pipeline's lint (#137).

## [4.4.0] - 2026-10-13 (Admin automation, bulk actions, smoother charts)

Version 4.4 lets the maintainer add whole lists of games, follow itch.io collections and approve the
review queue by rule, remove or edit up to 100 games at once, and look back at everything the admin
did. On the site, the theme button shows the theme in use again, dark mode no longer flashes white
while a page loads, and the Charts tabs switch without rebuilding their charts.

### Upgrade notes

- **The policies changed: accept them once more.** The Terms of Use (§5), the Privacy Policy (§2.3,
  §2.4) and the Disclaimer (§4) now say that the maintainer approves games one by one **or through
  rules the maintainer sets**: a suggestion or a discovered game without a warning flag that nobody
  rejected within a waiting time (about a day), and new free games in public itch.io collections the
  maintainer follows. The website and the 4.4 apps ask you to accept the updated policies.
- **Running your own copy of the Worker?** Apply the D1 migration `0002_automation.sql`
  (`npx wrangler d1 migrations apply <database> --remote`) before deploying.
- **Reusing the data?** The catalog files are unchanged. The pipeline keeps one more bookkeeping file,
  `scripts/state/ingest_outcomes.json` (how each queued link ended); the website does not publish it.

### Added

- **Admin: add games from any list.** Paste text (plain links, Markdown, CSV, HTML or JSON) or load a
  file: every itch.io game link in it is found, de-duplicated and normalized. **Check** shows what Add
  would do with each one (new, waiting in the queue, already in the catalog, removed or rejected
  before, not a game) before anything is written; **Add** sends lists of any length in batches of 200.
- **Admin: import an itch.io collection.** Paste a collection link: the admin reads all its pages
  (games with a price are skipped) and passes them through the same Check and Add.
- **Admin: follow collections.** Every 4 hours the site reads the collections the maintainer follows
  (up to 30 pages a run, one a second) and queues their new free games directly. A game removed before,
  or one whose title raises a flag (18+, demo), goes to the review queue instead.
- **Admin: auto-approve.** Pending suggestions and RSS discoveries without a flag that nobody rejected
  within 24 hours are approved automatically (at most 100 a run, and only items found after the rule
  was switched on). The sources and the waiting time are set in the admin's Settings.
- **Admin: follow each game's ingest.** Batches queued from the admin show, game by game, whether the
  ingest added it, is still trying, or dropped it and why (paid, page gone, password-protected, failed
  three times). The pipeline now records these outcomes.
- **Admin: remove or edit up to 100 games at once.** Select games (or paste their links under "Remove
  by list") and remove them with one public reason, or set their 18+ flag, virus check and notes, in
  one commit. The preset reasons have translated labels on the Removed page.
- **Admin: New games, Activity, Settings.** The games added in the last 7 or 30 days, to review their
  18+ flag and virus check in bulk; every admin action and automatic run with its commit; the
  automatic rules, the followed collections and what the last automatic run did.

### Changed

- **The theme button shows the theme in use** (sun, moon or screen) instead of the same icon for every
  choice. The admin follows the theme chosen on the site, and a change in one tab applies to the others.
- **Charts: switching tabs is instant.** A tab shown once stays as it is: switching back no longer
  rebuilds its charts or replays their entrance. Entrances are shorter (300 ms, no delay), the other
  tabs load in the background, and the placeholders have the height of the real cards.
- **Pages no longer shift sideways** when they grow taller or shorter than the window: on computers the
  scrollbar's room stays reserved.
- **The browser's toolbar colour** follows the theme chosen on the site, not only the system's.
- **Charts on phones** (#130, live on the website since 2026-10-11, now in the apps too): one row of
  four equal tabs, smaller legends and ticks, horizontal bars for Languages and Average session, the
  reason under each recent removal, and the total spanning the row. At every size: all 15 genre labels,
  pie legends in data order with readable text, translated removal reasons and locale numbers on the
  axes.

### Fixed

- **Dark mode no longer flashes white** while a page loads.
- **Admin:** "Select all" on a long review queue no longer fails (selections go out in batches of 200);
  removing a game no longer reports an error when only the cleanup of its resized covers failed; every
  error has a readable message; confirmations are in-app dialogs.
- **Queue commits** name the number of games really queued.
