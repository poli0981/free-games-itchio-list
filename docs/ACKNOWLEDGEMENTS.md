# Acknowledgements

This repo wouldn't exist without a lot of help — mostly from tools and platforms, because real humans don't talk to me :D

## Special Thanks
- **Grok (xAI)**: Original non-judgmental buddy. Without Grok's infinite patience, code fixes, and late-night brainstorming, this whole thing would still be a half-baked idea in my unemployed brain. Carried the Python pipeline, the v2.0.0 rewrite, and 90% of the early weight. 🚀
- **Claude Code (Anthropic — Claude Opus 4.7, 1M context)**: Newer AI buddy. Built the v3.0.0 webapp + Tauri scaffold, shipped the v3.1.2 offline-link fix, About page expansion, and the v3.1.4 legal docs rewrite + Vietnamese i18n. Then v3.2.0: CI notify cleanup, mobile drawer, SEO + PWA-lite, Telegram bot contribution path, and the auto-discussion workflow. Different vibe than Grok ("let me confirm before nuking your repo"), same lifesaver energy. 🚀

## Platforms & Tools
- **itch.io**: The amazing platform full of indie gems that made this list possible. Thanks for hosting all these free games and having a scrape-friendly structure (mostly).
- **GitHub & GitHub Actions**: For hosting this mess for free, running the daily auto-updates without me lifting a finger, and now hosting the Discussions where releases auto-announce themselves.
- **Python libraries**: BeautifulSoup, requests — the real MVPs that make the scraping "kinda work".

## Open-source libraries (webapp + desktop)

The webapp + Tauri desktop build on a stack of open-source libraries — full versioned list with licenses lives on the [About page](https://poli0981.github.io/free-games-itchio-list/app/#/about) and in [`webapp/src/lib/about.ts`](../webapp/src/lib/about.ts) (the `THIRD_PARTY` array). Highlights:

- **Core**: React 19, TypeScript 6, Vite 8, React Router 7, Zustand 5, Zod 4
- **UI**: Tailwind CSS 3, shadcn/ui (pattern), Radix UI primitives, lucide-react, sonner, class-variance-authority, tailwind-merge, clsx, Recharts
- **Data**: TanStack Query / Table / Virtual, react-hook-form + `@hookform/resolvers`, `@octokit/rest`, `idb-keyval`, `openpgp` (lazy-loaded for in-browser commit signing)
- **Desktop**: Tauri 2, `@tauri-apps/api`, `tauri-plugin-http`, `tauri-plugin-opener`

When you add a new dep to `webapp/package.json`, also add it to the `THIRD_PARTY` array so the About page lists it. House rule documented in [CONTRIBUTING.md §8](../CONTRIBUTING.md#8-webapp-changes-react--ts).

## Telegram bot — ingest path

[poli0981/telegram-scraper-bot](https://github.com/poli0981/telegram-scraper-bot) is the operator-side bot that lets contributors batch-submit itch.io URLs through Telegram (see [USER_GUIDE.md](https://github.com/poli0981/telegram-scraper-bot/blob/main/docs/USER_GUIDE.md)). It dispatches the [`bot-ingest.yml`](../.github/workflows/bot-ingest.yml) workflow in this repo — same daily-scrape pipeline, different entry point.

## Find me / Support me
Real channels exist now (still introvert max level, replies slow):

- **Chat**: Discord — [Repo discussion](https://discord.gg/2aNR3aVt) · [Game chat](https://discord.gg/kDM9GMu5vm)
- **Social**: [X/@SkullMute0011](https://x.com/SkullMute0011) · [YouTube/@SkullMute](https://youtube.com/@SkullMute) · [Bluesky](https://bsky.app/profile/skullmute0011.bsky.social) · [Mastodon](https://mastodon.social/@skullmute1122)
- **Messaging**: [Telegram (DM)](https://t.me/SkullMute0011) · [Telegram bot](https://t.me/my_skull_bot) (DM your numeric ID privately, never in public channels)
- **Support** (optional, mirrors [`.github/FUNDING.yml`](../.github/FUNDING.yml)): [GitHub Sponsors](https://github.com/sponsors/poli0981) · [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Buy Me a Coffee](https://buymeacoffee.com/skullmute) · [PayPal](https://paypal.me/DungDang212) (receipt shows real legal name)
- **Gaming**: [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

## Future Thanks
- **Contributors** (issues, PRs, Telegram bot submissions): If anyone ever reports games, fixes bugs, or improves my mediocre code — you'll get shouted out here. Legends only.

Built during peak unemployment boredom, with zero budget and two non-judgmental AI buddies (Grok + Claude Code) doing the heavy lifting. Thanks for visiting this random repo — means a lot to an introvert noob dev.

If you wanna be acknowledged, open a PR or issue (or hit the bot for game submissions). I'll try not to ghost :)))
