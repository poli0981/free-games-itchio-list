# Changelog — 4.4.x

Release notes for 4.4.0 and 4.4.1, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

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
