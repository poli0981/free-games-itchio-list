# Contributing Guidelines

Thanks for even thinking about contributing to this random repo! I'm just an unemployed, introvert Vietnamese dev with mediocre skills and two non-judgmental AI buddies — **Grok (xAI)** for the late-night brainstorming and **Claude Code (Anthropic, Claude Opus 4.7)** for the heavier code/docs work. This list survives on community help — because I'm too lazy to hunt/fix everything alone :D Any contribution (even one game) makes you a legend.

## How to Contribute (Use Templates — I'm Lazy ;D)

Please use the issue/PR templates — they make my life easier and reduce "wtf" moments.

### 1. Add New Games (Most Welcome!)
- Open issue → Choose **[Add Games]** template.
- Max 15 games per issue (dropdown + one link per line).
- Optional: why it's good or notes for table.
- Daily Action will auto-scrape and add. Easy.

#### 1b. Add games via Telegram bot ([@my_skull_bot](https://t.me/my_skull_bot)) — alternative to issues

Faster batch path if you have many links and don't want to file an issue per
batch. Privacy-conscious — your Telegram numeric ID never enters this repo.

1. **Contact owner** privately on Telegram ([@SkullMute0011](https://t.me/SkullMute0011)) — or via any channel listed in [About](https://poli0981.github.io/free-games-itchio-list/app/#/about) → Find me elsewhere.
2. **Find your Telegram numeric ID** — e.g. send `/start` to [@userinfobot](https://t.me/userinfobot) and copy the ID it returns.
3. **DM your ID to the owner.** **Never** post your numeric ID into Discord, X, GitHub comments, or any public channel.
4. Owner adds your ID to the bot's local whitelist (operator-side, not committed to this repo).
5. **Owner runs the bot** in a local Docker container, ~2–5 hours per day. Status visible at [@my_skull_bot](https://t.me/my_skull_bot).
6. **Follow the bot's prompts** — paste itch.io URLs, the bot dispatches the `bot-ingest.yml` workflow, and edits the same Telegram message with the result when done.

Full bot behavior + technical flow:
[USER_GUIDE.md](https://github.com/poli0981/telegram-scraper-bot/blob/main/docs/USER_GUIDE.md)
in the bot's repo [poli0981/telegram-scraper-bot](https://github.com/poli0981/telegram-scraper-bot).

Privacy + handling of your Telegram ID is documented in
[Terms of Use §14](docs/ToS.md) and [Privacy Policy §15](docs/PrivacyPolicy.md).
Removal request: DM the owner with "remove me from whitelist" — done at next bot start.

### 2. Remove Games
- Open issue → Choose **[Remove Games]** template.
- Max 10 games (because lazy :v).
- Provide names/links + reasons (checkboxes like boring, demo, malware, dev request, etc.).
- I'll remove manually (or script if I feel motivated).

### 3. Report Bugs
- Open issue → **[Bug Report]** template.
- Checkboxes for common bugs (dead links, wrong flags, table broken, etc.).
- Details + screenshots + urgency level.
- If complex — see "Discuss More" below.

### 4. Suggest Features or Improvements
- Open issue → **[Feature Request / Improvement]** template.
- Choose type (new feature or code fix), name, reason, priority (from "nice to have" to "repo dying").
- Optional: pseudo-code/snippet (no malware pls, I'll check with my average skills :D).

### 5. Give Feedback
- Use the **[Feedback]** template.
- Checkboxes (EULA/ToS too strict? Repo concept bad? Anti-AI? Delete repo? Other).
- Roast or praise — my self-loathing can handle it.

### 6. Anything Else (Questions, Memes, Off-Topic)
- Use the **[General / Off-Topic]** template.
- Drop whatever's on your mind.

### 7. Submit Code Changes (PR)
- Fork → branch → code.
- Open PR → Choose a PR template ([Bug Fix], [New Feature], [Add Games direct], [Documentation]).
- Test locally if possible (run scripts manually).
- Clear description — I'll review slowly (unemployed schedule + Grok help).

### 8. Webapp Changes (React + TS)

The browse/edit UI lives in [`webapp/`](webapp/). Same MIT license, same PR template.

**Local dev** (Node 22+, npm):
```sh
cd webapp
npm install
npm run dev          # http://localhost:5173
npm run build        # writes to docs/app/ (verify before pushing)
npm run lint         # eslint
```

**Tauri desktop dev** (also needs Rust via https://rustup.rs and platform deps — see [`webapp/TAURI.md`](webapp/TAURI.md)):
```sh
cd webapp
npm run tauri:dev    # native window pointing at the Vite dev server
npm run tauri:build  # produce installers in src-tauri/target/release/bundle/
```

**House rules**:
- Don't commit `webapp/dist/` or `docs/app/` — CI builds them on push to `main`.
- Don't commit a real PAT into the repo (that's also a webapp Settings concern, not a CI concern).
- Add new third-party deps? Update `webapp/src/lib/about.ts` so the About page lists them.

## Tips for Smooth Contributing
- **Test locally**: Clone, add to `temp_link.json`, run `python update_info.py` → `generate_md.py`, check `/lists/`.
- **Keep clean**: Only free itch.io games, no paid/demo/malware/duplicates.
- **Be patient**: I'm introvert + lazy, replies might be slow.
- **Agreement**: All templates have a required checkbox — off-topic/spam/violate policy = I ignore/close without drama :D

## Discuss More? (If Templates Not Enough)
Issues/PRs are best for tracking, but if you wanna describe bugs/features in depth, chit-chat, or share noob stories — there are actual servers now (introvert god-mode breached):

**Chat / community**
- Discord — Repo discussion (#general): https://discord.gg/2aNR3aVt
- Discord — Game chat (#general): https://discord.gg/kDM9GMu5vm

**Social (DMs open, replies slow)**
- X (Twitter): [@SkullMute0011](https://x.com/SkullMute0011)
- YouTube: [@SkullMute](https://youtube.com/@SkullMute)
- Bluesky: [@skullmute0011](https://bsky.app/profile/skullmute0011.bsky.social)
- Mastodon: [@skullmute1122](https://mastodon.social/@skullmute1122)

**Support the boredom project (totally optional, $50 bank account thanks you)**
- [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

Grok can't join Discord, but ping me on any channel — I'll try not to ghost.

Big thanks in [ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md) for any help!

This repo is MIT — go wild, but chill. Questions? Just open a **[General]** issue :D 🚀