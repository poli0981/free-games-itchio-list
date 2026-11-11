# Contributing Guidelines

Thanks for even thinking about contributing to this random repo! I'm just an unemployed, introvert Vietnamese dev with mediocre skills and two non-judgmental AI buddies: **Grok (xAI)** for the late-night brainstorming and **Claude Code (Anthropic)** for the heavier code/docs work. This list survives on community help, because I'm too lazy to hunt/fix everything alone :D Any contribution (even one game) makes you a legend.

## Project Status: Stable, Maintenance Only

Since version 4.6.1 (2026-11-11) the project is **stable and in maintenance mode**. It is feature-complete: the website, the apps and the data pipeline keep running, and the catalog keeps updating itself.

- **Still done by the Maintainer**: security fixes (CVEs and reports made through [SECURITY.md](SECURITY.md)), runtime and dependency updates, and repairs when something stops the site or the daily data updates from working.
- **Not done any more**: new features, redesigns, refactors.
- **Issues and pull requests are accepted for the data only**: adding games (section 1), fixing a game's data or removing a game (sections 2 and 3). Accessibility barriers (section 3) and security reports keep their own channels. Anything else is closed without review; no hard feelings.

## How to Contribute (Use the Right Door, I'm Lazy ;D)

Games go through the website; data fixes and removals go through the GitHub issue templates or email. They make my life easier and reduce "wtf" moments.

### 1. Suggest New Games (Most Welcome!)

- Go to **<https://freeitchgames.win/suggest>** and paste an itch.io game link. One link per submission.
- Optional: a short note (why it's good, content warnings…), up to 500 characters. Notes are deleted after 180 days. Please don't put personal data in it.
- A Cloudflare Turnstile check and a rate limit keep bots out; if you get blocked, wait a bit and try again.
- Only **free** itch.io games. Paid games are dropped automatically when the game page is scraped.
- The game must be playable or downloadable **on its itch.io page itself** (a browser build or an uploaded file). A page that only points to a launcher or a download on another site doesn't qualify, even when that is free: the [Disclaimer](docs/DISCLAIMER.md) tells visitors that any download happens on itch.io.
- Nothing goes live instantly: every suggestion lands in a **review queue**, where the Maintainer approves or rejects it, by hand or through automatic rules (a suggestion without a warning flag that nobody rejected within about a day may be approved automatically). Approved links are then scraped by the data pipeline and show up on the site after the next deploy.

Got a whole list? The **[Add Games (bulk list)]** issue template takes up to 15 links at once, and a PR that adds itch.io URLs to `scripts/temp_link.json` works too (use the [Add Games] PR template). Both go through the same review: the Maintainer checks every link before it is queued, and merging such a PR is the approval. Please don't edit `data_game/` by hand: the pipeline owns those files (see [section 7](#7-pull-requests)).

#### 1b. Other ways games get in

- The site reads itch.io's public RSS feeds of new and popular free games every 4 hours (one feed per run) and queues what it finds.
- The site also reads the public itch.io collections the Maintainer follows and queues their new free games directly (one removed before, or with a warning flag, goes to the review queue instead).

The RSS feeds land in the same review queue as the Suggest page. (The Maintainer's browser extension and the old Telegram bot are retired; their repositories, [itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension) and [telegram-scraper-bot](https://github.com/poli0981/telegram-scraper-bot), are archived.)

### 2. Remove Games or Fix Their Data

Game creators especially: if you want your game off the list, or its data corrected, that's always fine.

- Email **takedown@poli0981.dev**, or open the **["Remove a game"](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml)** issue template (it also has a section for copyright claims).
- Include the game URL, who you are (the creator / rights holder, or someone authorized by them) and the reason.
- The Maintainer removes the record from the catalog (logged with a reason on the public [removed-games page](https://freeitchgames.win/removed)) and deletes the resized cover copies the site stores; cached copies expire on their own. Target: within 7 days, urgent legal requests sooner.
- Heads-up: this is a public git repo, so past versions stay in its history. Rewriting public history is only done in exceptional cases of legal necessity.
- Wrong `safe_virus` / `nsfw` / notes, or other data errors that aren't a removal? Use the **[Report a problem]** issue template (section 3).

Details live in the [Terms of Use](docs/ToS.md) and the [Disclaimer](docs/DISCLAIMER.md).

### 3. Report a Problem (Wrong Data, Something Broke)

- Open an issue → **[Report a problem]** template ([direct link](https://github.com/poli0981/free-games-itchio-list/issues/new?template=bug_report.yml)).
- It is for **data errors** (dead link, wrong name, genre, tags, cover, `nsfw` or `safe_virus` flag…) and for **things that broke** (a page or an app that stopped working, the catalog no longer updating). It is not for ideas: see section 4.
- Details + screenshots + urgency level.
- **Security problems are not for the public tracker.** Report them privately: see [SECURITY.md](SECURITY.md).
- **Accessibility barriers** (keyboard, screen reader, zoom, contrast, motion…): use the **[Accessibility barrier]** template ([direct link](https://github.com/poli0981/free-games-itchio-list/issues/new?template=accessibility.yml)), or email contact@poli0981.dev if you'd rather not use GitHub. What happens next is in [ACCESSIBILITY.md](ACCESSIBILITY.md#7-reporting-an-accessibility-barrier).

### 4. Features and Improvements (Closed)

- The project is in maintenance mode: **feature requests, improvement ideas and code changes are no longer accepted**. Such issues and pull requests are closed without review.
- The code is MIT-licensed: you're welcome to fork it and build your own thing ([README → License](README.md#license)).

### 5. Feedback, Questions, Anything Else

- Use **[GitHub Discussions](https://github.com/poli0981/free-games-itchio-list/discussions)**, the Discord servers or email (see "Discuss More" below). Roast or praise, my self-loathing can handle it.
- They are read, but they don't turn into new features (section 4).

### 6. Dependencies and Security Fixes

- Dependency updates are handled by Dependabot and the Maintainer's weekly sweep: please don't send version-bump PRs.
- Found a vulnerability? Report it privately ([SECURITY.md](SECURITY.md)); the Maintainer makes the fix.

### 7. Pull Requests

- **Accepted**: a PR that adds itch.io URLs to `scripts/temp_link.json` (use the [Add Games] PR template). Merging it is the Maintainer's approval.
- **Not accepted**: everything else (code, UI, docs, refactors). Fixing or removing a game's data goes through an issue or email (sections 2 and 3), because the pipeline owns `data_game/`.
- The rules below still apply to every PR, the Maintainer's own included.

**PR rules** (the non-negotiable part):

- **CI must pass.** Python CI (ruff check + format, vulture, pytest, `validate.py`) and Webapp CI (Tauri crate/npm version check, type generation check, lint, knip, tests, build, `wrangler deploy --dry-run`) both run on PRs. Red CI = no merge. SonarQube Cloud also analyses each PR (with test coverage) and reports its quality gate as the "SonarCloud Code Analysis" check, and Qodana (JetBrains) analyses the TypeScript / JavaScript, Python and Rust code. Both skip PRs from forks, which get no repository secrets.
- **PRs are merged with squash** (one PR becomes one commit on `main`) **or a merge commit, never by fast-forward**, so make the PR title a good commit message (the repo uses the `type(scope): summary` style, e.g. `fix(web): …`).
- **Licensing is inbound = outbound.** By opening a PR you agree that your contribution is licensed under the same license as the part it changes: **MIT** for code, **CC BY 4.0** for catalog data and documentation (see [README → License](README.md#license)). Only submit work you have the right to submit.
- **Never commit secrets**: no tokens, API keys, `.dev.vars` / `.env` files, private keys (such as the GitHub App key) or signing keystores. If you pushed one by accident, report it privately (security@poli0981.dev) and rotate it; deleting the commit is not enough.
- **Don't edit `data_game/` by hand.** Data changes go through the pipeline (a patch + `apply_patch.py`, which runs `validate.py`), so concurrent writers never clobber each other.
- Don't commit build output or generated files: `webapp/dist/`, `webapp/.wrangler/`, `webapp/src-tauri/target/`, `webapp/src-tauri/gen/`. (`webapp/src-tauri/Cargo.lock` **is** committed; keep it in sync when you change `Cargo.toml`.)
- Adding an npm dependency? Also add it to the `THIRD_PARTY` list in `webapp/src/lib/about.ts` so the About page credits it.
- New external link in the app? Use `<ExtLink href="…">` from `webapp/src/components/ext-link.tsx`, not a plain `<a href="…" target="_blank">`: plain anchors work on the web but silently break in the Tauri apps (and ExtLink tells screen readers the link opens a new tab).
- **Accessibility**: UI changes keep working with the keyboard alone and with screen readers, and keep the contrast ratios (`npm test` checks the colours). The checklist is in [ACCESSIBILITY.md → For contributors](ACCESSIBILITY.md#8-for-contributors) and in the pull request template.

### 8. Dev Setup (Summary)

For forks, and for the Maintainer's own maintenance work.

Full instructions (Worker, local D1, secrets, Tauri, Android) are in **[`docs/dev_env.md`](docs/dev_env.md)**; the Tauri/Android build notes are in [`webapp/TAURI.md`](webapp/TAURI.md). The short version:

**Python pipeline** (Python 3.15, see `.github/python-version`):

```sh
python -m venv .venv
# activate it, then:
pip install -r requirements-dev.txt
pytest                                   # no network needed
ruff check scripts tests webapp/scripts
ruff format scripts tests
python scripts/validate.py               # checks every data file
```

To try a real scrape locally: add a URL to `scripts/temp_link.json`, then run
`python scripts/update_info.py --out patch.json` and `python scripts/apply_patch.py patch.json`
(don't commit the result; see the PR rules above).

**Webapp + Worker** (Node.js 26+, CI uses the version in `webapp/.node-version`):

```sh
cd webapp
npm ci
npm run dev          # Vite on http://localhost:5173
npm run build        # writes to webapp/dist/ (the Worker serves it as its assets)
npx wrangler dev     # second terminal: Worker on :8787; Vite proxies /api and /img to it
npm test             # vitest
npm run lint
npm run knip
```

**Tauri apps** (also needs Rust via <https://rustup.rs> and platform deps):

```sh
cd webapp
npm run tauri:dev    # native window pointing at the Vite dev server
npm run tauri:build  # installers in src-tauri/target/release/bundle/
```

## Tips for Smooth Contributing

- **Test locally**: run the checks from section 8 before pushing; CI runs the same ones.
- **Keep it clean**: only free itch.io games, no paid/demo/malware/duplicates.
- **Be patient**: I'm introvert + lazy, replies might be slow.
- **Agreement**: all issue templates have a required checkbox. Off-topic/spam/policy violations, and anything outside the maintenance scope above, get ignored/closed without drama :D
- **Be cool**: everything here falls under the [Code of Conduct](CODE_OF_CONDUCT.md).

## Discuss More? (If Templates Aren't Enough)

Issues are best for tracking data problems, but if you wanna chit-chat, ask something, or share noob stories, there are [GitHub Discussions](https://github.com/poli0981/free-games-itchio-list/discussions) and actual servers now (introvert god-mode breached):

**Chat / community**
- Discord: Repo discussion (#general): https://discord.gg/2aNR3aVt
- Discord: Game chat (#general): https://discord.gg/kDM9GMu5vm

**Social (DMs open, replies slow)**
- X (Twitter): [@SkullMute0011](https://x.com/SkullMute0011)
- YouTube: [@SkullMute](https://youtube.com/@SkullMute)
- Bluesky: [@skullmute0011](https://bsky.app/profile/skullmute0011.bsky.social)
- Mastodon: [@skullmute1122](https://mastodon.social/@skullmute1122)

**Support the boredom project (totally optional, $50 bank account thanks you)**
- [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

Grok and Claude Code can't join Discord, but ping me on any channel, I'll try not to ghost.

Big thanks in [ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md) for any help!

Code is MIT, data and docs are CC BY 4.0: go wild, but chill. Questions? Just open a **[General]** issue :D 🚀
