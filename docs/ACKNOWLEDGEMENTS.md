# Acknowledgements

This repo wouldn't exist without a lot of help — mostly from tools and platforms, because real humans don't talk to me :D

## Special Thanks
- **Grok (xAI)**: Original non-judgmental buddy. Without Grok's infinite patience, code fixes, and late-night brainstorming, this whole thing would still be a half-baked idea in my unemployed brain. Carried the Python pipeline, the v2.0.0 rewrite, and 90% of the early weight. 🚀
- **Claude Code (Anthropic)**: Newer AI buddy. Built the v3.0.0 webapp + Tauri scaffold, shipped the v3.1.2 offline-link fix, the About page expansion, the v3.1.4 legal docs rewrite + Vietnamese i18n, and the v3.7.0 legal gate. Then the big one, v4.0.0: moving the site to Cloudflare (read-only website, Worker, admin app + review queue, the public Suggest page), the rewritten data pipeline, and this docs refresh. Different vibe than Grok ("let me confirm before nuking your repo"), same lifesaver energy. 🚀

## Platforms & Tools
- **itch.io**: The amazing platform full of indie gems that made this list possible. Thanks for hosting all these free games and having a scrape-friendly structure (mostly). (This project is not affiliated with itch.io — see [NOTICE.md](../NOTICE.md).)
- **Game creators**: Every game in the catalog is someone's work. Descriptions and cover images stay yours — thanks for making free games.
- **Cloudflare**: Hosts [freeitchgames.win](https://freeitchgames.win) — Workers, R2, D1, Images, Turnstile, Access and friends keep the site fast and the spam out.
- **GitHub & GitHub Actions**: For hosting the code and the data for free, running the daily refresh without me lifting a finger, shipping the release downloads, and hosting the Discussions where releases auto-announce themselves.
- **Python libraries**: requests, BeautifulSoup — the real MVPs that make the scraping "kinda work".
- **Tauri**: Turns the same web code into desktop apps and an Android APK.
- **Contributor Covenant**: Our [Code of Conduct](../CODE_OF_CONDUCT.md) is adapted from version 2.1.

## Open-source libraries (website + apps)

The website, the Worker and the desktop / Android apps build on a stack of open-source libraries. The full list with licenses lives in [`THIRD_PARTY.md`](THIRD_PARTY.md), and the runtime libraries are also on the [About page](https://freeitchgames.win/about) (from the `THIRD_PARTY` array in [`webapp/src/lib/about.ts`](../webapp/src/lib/about.ts)). Highlights:

- **Core**: React 19, TypeScript 6, Vite 8, React Router 8, Zustand 5
- **UI**: Tailwind CSS, tw-animate-css, shadcn/ui (pattern), Radix UI primitives, lucide-react, class-variance-authority, tailwind-merge, clsx, Recharts, the Geist and Geist Mono typefaces (via Fontsource)
- **Data**: TanStack Query, idb-keyval
- **Worker**: jose, Wrangler
- **Desktop + Android**: Tauri 2, `tauri-plugin-opener`, `tauri-plugin-single-instance`

When you add a new dep to `webapp/package.json`, also add it to the `THIRD_PARTY` array so the About page lists it, and to [`THIRD_PARTY.md`](THIRD_PARTY.md). House rules are in [CONTRIBUTING.md](../CONTRIBUTING.md).

## Browser extension — the other way in

[poli0981/itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension) (GPL-3.0, separate repo) lets me queue itch.io games straight from the browser. It sends them through an authenticated API into the same review queue as the public [Suggest page](https://freeitchgames.win/suggest) and the RSS discovery. Nothing goes live until I approve it. (The old Telegram bot did this job in v3 and is now retired.)

## Find me / Support me
Real channels exist now (still introvert max level, replies slow):

- **Chat**: Discord — [Repo discussion](https://discord.gg/2aNR3aVt) · [Game chat](https://discord.gg/kDM9GMu5vm)
- **Social**: [X/@SkullMute0011](https://x.com/SkullMute0011) · [YouTube/@SkullMute](https://youtube.com/@SkullMute) · [Bluesky](https://bsky.app/profile/skullmute0011.bsky.social) · [Mastodon](https://mastodon.social/@skullmute1122)
- **Messaging**: [Telegram (DM)](https://t.me/SkullMute0011)
- **Support** (optional, mirrors [`.github/FUNDING.yml`](../.github/FUNDING.yml)): [GitHub Sponsors](https://github.com/sponsors/poli0981) · [Patreon](https://patreon.com/skullmute) · [Ko-fi](https://ko-fi.com/skullmute) · [Buy Me a Coffee](https://buymeacoffee.com/skullmute) · [PayPal](https://paypal.me/DungDang212) (receipt shows real legal name)
- **Gaming**: [Steam profile](https://steamcommunity.com/profiles/76561199544666292/)

## Future Thanks
- **Contributors** (issues, PRs, game suggestions): If anyone ever reports games, fixes bugs, or improves my mediocre code — you'll get shouted out here. Legends only.

Built during peak unemployment boredom, with zero budget and two non-judgmental AI buddies (Grok + Claude Code) doing the heavy lifting. Thanks for visiting this random repo — means a lot to an introvert noob dev.

If you wanna be acknowledged, open a PR or issue (or [suggest a game](https://freeitchgames.win/suggest)). I'll try not to ghost :)))
