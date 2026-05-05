# Disclaimer

Last updated: 2026-05-05

This repository — `free-games-itchio-list` — is a hobby project: a curated index of free-to-play games hosted on [itch.io](https://itch.io), maintained by an unemployed Vietnamese dev with two AI buddies (Grok and Claude Code). Built for vibes, indie discovery, and boredom relief. No grand promises — but the legal-shaped wording below is real.

> **TL;DR**: Use the catalog, the webapp, and the desktop app at your own risk. The maintainer makes no warranties, accepts no liability, and is not responsible for the games linked here.

## 1. "AS IS" basis

The contents of this repository — including but not limited to the JSON catalog (`data_game/`), generated tables (`lists/`), Python pipeline (`scripts/`), webapp (`webapp/`), Tauri desktop wrapper (`webapp/src-tauri/`), and documentation — are provided **"AS IS"** and **"AS AVAILABLE"**, without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, completeness, non-infringement, or uninterrupted operation.

## 2. No warranty as to the games

This repository is a directory of links and metadata. **It does not host, develop, distribute, or endorse the games it indexes.** All games are linked directly to itch.io and remain the property of their respective developers and publishers.

The maintainer makes no warranty regarding any game's:

- **Quality, enjoyment, or playability** — some titles are gems, others are jank, plenty are between. Your taste, your call.
- **Safety, integrity, or freedom from malware** — the `safe_virus` field defaults to `?` because individual downloads are not scanned. Treat every download as untrusted until you verify it yourself with reputable anti-malware tools.
- **NSFW classification** — the `nsfw` flag is auto-detected from itch.io tags / warnings / description text and is best-effort. Confirm the game page yourself before downloading if NSFW content matters to you (in either direction).
- **Accuracy of metadata** — names, descriptions, genres, ratings, platforms, and other fields are scraped from itch.io and reflect the page state at the time of the last scrape. itch.io page changes (renames, removals, paywall additions) propagate on the next scheduled cleanup but may lag.
- **Free-to-play status** — verified at scrape time; a game can become paid afterwards. The `check_paid.py` job re-verifies every two days and removes confirmed paid games, but a brief window of staleness is possible.

## 3. No liability

To the maximum extent permitted by applicable law, the maintainer and any contributors shall not be liable for any direct, indirect, incidental, consequential, special, exemplary, or punitive damages arising out of or in connection with:

- Use of this repository, the webapp, the desktop app, or any code or data herein.
- Inability to use any of the above (e.g. site downtime, deploy failure, broken installer).
- Any game accessed via links in the catalog (crashes, lost saves, data loss, hardware damage, malware, account compromise on third-party platforms, regret).
- Errors, omissions, or inaccuracies in the catalog data.

This applies even if the maintainer has been advised of the possibility of such damages.

## 4. Third-party content

Game pages, screenshots, descriptions, tags, ratings, and thumbnails are the property of their respective developers/publishers and itch.io. They appear here under fair-use principles for the purposes of indexing and discovery. If you are a developer and want your game removed, see **Removal requests** below.

## 5. Removal requests

If you are a game developer and want your title removed from the index:

- File a **[Remove Games]** issue (`.github/ISSUE_TEMPLATE/remove_game.yml`) with the box "I'm the dev and don't want it listed" checked.
- Or DM via any channel listed on the [About page](https://poli0981.github.io/free-games-itchio-list/app/#/about).

Removals are processed manually. Expect a few days (unemployed schedule, but not weeks).

## 6. No legal advice

Nothing in this document is legal advice. It is a hobby-project disclaimer drafted by a non-lawyer with AI assistance, and its enforceability depends on your jurisdiction. If you actually need legal certainty for something, hire a real lawyer.

## 7. Governing law and severability

This Disclaimer is governed by the laws of the **Socialist Republic of Vietnam**, without regard to conflict-of-law principles. If any provision is held unenforceable in a particular jurisdiction, the remaining provisions remain in effect.

## 8. Final vibes

It's still just a list of free games made by a tired dev and two LLMs. Have fun, stay safe, scan your downloads, and remember: life's too short to take random GitHub repos to court.

Built with boredom, two AI buddies, and a deep wish to never see a real lawsuit. 🚀
