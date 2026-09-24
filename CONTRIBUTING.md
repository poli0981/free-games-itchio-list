# Contributing Guidelines

Thanks for even thinking about contributing to this random repo! I'm just an unemployed, introvert Vietnamese dev with mediocre skills and two non-judgmental AI buddies: **Grok (xAI)** for the late-night brainstorming and **Claude Code (Anthropic)** for the heavier code/docs work. This list survives on community help, because I'm too lazy to hunt/fix everything alone :D Any contribution (even one game) makes you a legend.

## How to Contribute (Use the Right Door, I'm Lazy ;D)

Games go through the website; everything else goes through the GitHub issue/PR templates. They make my life easier and reduce "wtf" moments.

### 1. Suggest New Games (Most Welcome!)

- Go to **<https://freeitchgames.win/suggest>** and paste an itch.io game link. One link per submission.
- Optional: a short note (why it's good, content warnings…), up to 500 characters. Notes are deleted after 180 days. Please don't put personal data in it.
- A Cloudflare Turnstile check and a rate limit keep bots out; if you get blocked, wait a bit and try again.
- Only **free** itch.io games. Paid games are dropped automatically when the game page is scraped.
- Nothing goes live instantly: every suggestion lands in a **review queue**, and nothing enters the catalog until the Maintainer approves it. Approved links are then scraped by the data pipeline and show up on the site after the next deploy.

Got a whole list? The **[Add Games (bulk list)]** issue template takes up to 15 links at once, and a PR that adds itch.io URLs to `scripts/temp_link.json` works too (use the [Add Games] PR template). Both go through the same review: the Maintainer checks every link before it is queued, and merging such a PR is the approval. Please don't edit `data_game/` by hand: the pipeline owns those files (see [section 7](#7-submit-code-changes-pr)).

#### 1b. Other ways games get in

- The Maintainer's companion browser extension ([itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension), separate repo, GPL-3.0) sends links through an authenticated API while browsing itch.io. It is the Maintainer's own tool, not a public submission channel.
- The site reads itch.io's public RSS feeds of new and popular free games every 4 hours (one feed per run) and queues what it finds.

Both land in the same review queue as the Suggest page. (The old Telegram bot path is retired.)

### 2. Remove Games or Fix Their Data

Game creators especially: if you want your game off the list, or its data corrected, that's always fine.

- Email **takedown@freeitchgames.win**, or open the **["Remove a game"](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml)** issue template (it also has a section for copyright claims).
- Include the game URL, who you are (the creator / rights holder, or someone authorized by them) and the reason.
- The Maintainer removes the record from the catalog (logged with a reason on the public [removed-games page](https://freeitchgames.win/removed)) and deletes the resized cover copies the site stores; cached copies expire on their own. Target: within 7 days, urgent legal requests sooner.
- Heads-up: this is a public git repo, so past versions stay in its history. Rewriting public history is only done in exceptional cases of legal necessity.
- Wrong `safe_virus` / `nsfw` / notes, or other data errors that aren't a removal? A **[Bug Report]** issue is fine too.

Details live in the [Terms of Use](docs/ToS.md) and the [Disclaimer](docs/DISCLAIMER.md).

### 3. Report Bugs

- Open an issue → **[Bug Report]** template.
- Checkboxes for common bugs (dead links, wrong flags, broken page, etc.).
- Details + screenshots + urgency level.
- **Security problems are not bugs for the public tracker.** Report them privately: see [SECURITY.md](SECURITY.md).
- If it's complex, see "Discuss More" below.

### 4. Suggest Features or Improvements

- Open an issue → **[Feature Request / Improvement]** template.
- Choose type (new feature or code fix), name, reason, priority (from "nice to have" to "repo dying").
- Optional: pseudo-code/snippet (no malware pls, I'll check with my average skills :D).

### 5. Give Feedback

- Use the **[Feedback]** template.
- Checkboxes (EULA/ToS too strict? Repo concept bad? Anti-AI? Delete repo? Other).
- Roast or praise, my self-loathing can handle it.

### 6. Anything Else (Questions, Memes, Off-Topic)

- Use the **[General / Off-Topic]** template.
- Drop whatever's on your mind.

### 7. Submit Code Changes (PR)

- Fork → branch → code → open a PR against `main` with the matching PR template ([Bug Fix], [New Feature], [Documentation]…).
- Clear description, please. I'll review slowly (unemployed schedule + AI buddies).

**PR rules** (the non-negotiable part):

- **CI must pass.** Python CI (ruff check + format, vulture, pytest, `validate.py`) and Webapp CI (type generation check, lint, knip, tests, build, `wrangler deploy --dry-run`) both run on PRs. Red CI = no merge.
- **PRs are merged with squash** (one PR becomes one commit on `main`) **or a merge commit, never by fast-forward**, so make the PR title a good commit message (the repo uses the `type(scope): summary` style, e.g. `fix(web): …`).
- **Licensing is inbound = outbound.** By opening a PR you agree that your contribution is licensed under the same license as the part it changes: **MIT** for code, **CC BY 4.0** for catalog data and documentation (see [README → License](README.md#license)). Only submit work you have the right to submit.
- **Never commit secrets**: no tokens, API keys, `.dev.vars` / `.env` files, private keys (such as the GitHub App key) or signing keystores. If you pushed one by accident, report it privately (security@freeitchgames.win) and rotate it; deleting the commit is not enough.
- **Don't edit `data_game/` by hand.** Data changes go through the pipeline (a patch + `apply_patch.py`, which runs `validate.py`), so concurrent writers never clobber each other.
- Don't commit build output or generated files: `webapp/dist/`, `webapp/.wrangler/`, `webapp/src-tauri/target/`, `webapp/src-tauri/gen/`. (`webapp/src-tauri/Cargo.lock` **is** committed; keep it in sync when you change `Cargo.toml`.)
- Adding an npm dependency? Also add it to the `THIRD_PARTY` list in `webapp/src/lib/about.ts` so the About page credits it.
- New external link in the app? Use `<ExtLink href="…">` from `webapp/src/components/ext-link.tsx`, not a plain `<a href="…" target="_blank">`: plain anchors work on the web but silently break in the Tauri apps.

### 8. Dev Setup (Summary)

Full instructions (Worker, local D1, secrets, Tauri, Android) are in **[`docs/dev_env.md`](docs/dev_env.md)**; the Tauri/Android build notes are in [`webapp/TAURI.md`](webapp/TAURI.md). The short version:

**Python pipeline** (Python 3.14, see `.python-version`):

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

**Webapp + Worker** (Node.js 22.22+, CI uses the version in `webapp/.node-version`):

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
- **Agreement**: all issue templates have a required checkbox. Off-topic/spam/policy violations get ignored/closed without drama :D
- **Be cool**: everything here falls under the [Code of Conduct](CODE_OF_CONDUCT.md).

## Discuss More? (If Templates Aren't Enough)

Issues/PRs are best for tracking, but if you wanna describe bugs/features in depth, chit-chat, or share noob stories, there are actual servers now (introvert god-mode breached):

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
