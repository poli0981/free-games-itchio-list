export interface ThirdParty {
  name: string
  version: string
  license: string
  url: string
  category: 'core' | 'ui' | 'data' | 'desktop' | 'dev'
}

export const APP = {
  name: 'Itch.io Free Games DB',
  version: '3.4.1',
  repo: 'https://github.com/poli0981/free-games-itchio-list',
  license: 'MIT',
  buildDate: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'dev',
} as const

declare global {
  // Injected by Vite (define option in vite.config.ts).
  const __BUILD_DATE__: string
}

export const DEV = {
  name: 'SkullMute',
  role: 'Solo maintainer',
  blurb: 'Unemployed introvert Vietnamese dev. Two non-judgmental AI buddies do most of the heavy lifting — see below.',
  githubUrl: 'https://github.com/poli0981',
} as const

export interface AiTool {
  name: string
  vendor: string
  model?: string
  role: string
  url: string
}

export const AI_TOOLS: AiTool[] = [
  {
    name: 'Grok',
    vendor: 'xAI',
    role: 'Original buddy. Late-night brainstorming, the Python pipeline rewrites, the v2.0.0 scraper refactor. Carried the early life of this repo.',
    url: 'https://x.ai',
  },
  {
    name: 'Claude Code',
    vendor: 'Anthropic',
    model: 'Claude Opus 4.7 (1M context)',
    role: 'Newer recruit. Drove the v3.0.0 webapp + Tauri build and the v3.1.2 offline-link fix / About expansion / docs sweep. More cautious vibe — confirms before nuking anything.',
    url: 'https://claude.com/claude-code',
  },
]

export const ERROR_TEMPLATE_URL =
  'https://github.com/poli0981/free-games-itchio-list/issues/new?template=bug_report.yml'

export type SocialGroup = 'social' | 'community' | 'messaging' | 'support' | 'gaming'

export interface SocialLink {
  platform: string
  label: string
  handle: string
  url: string
  group: SocialGroup
}

export const SOCIAL_LINKS: SocialLink[] = [
  // Social
  { platform: 'x', label: 'X (Twitter)', handle: '@SkullMute0011', url: 'https://x.com/SkullMute0011', group: 'social' },
  { platform: 'youtube', label: 'YouTube', handle: '@SkullMute', url: 'https://youtube.com/@SkullMute', group: 'social' },
  { platform: 'bluesky', label: 'Bluesky', handle: '@skullmute0011', url: 'https://bsky.app/profile/skullmute0011.bsky.social', group: 'social' },
  { platform: 'mastodon', label: 'Mastodon', handle: '@skullmute1122', url: 'https://mastodon.social/@skullmute1122', group: 'social' },

  // Community
  { platform: 'discord-repo', label: 'Discord — Repo discussion', handle: '#general', url: 'https://discord.gg/2aNR3aVt', group: 'community' },
  { platform: 'discord-game', label: 'Discord — Game chat', handle: '#general', url: 'https://discord.gg/kDM9GMu5vm', group: 'community' },

  // Messaging — DM only; never post your Telegram numeric ID to public channels.
  { platform: 'telegram-user', label: 'Telegram (DM for bot whitelist)', handle: '@SkullMute0011', url: 'https://t.me/SkullMute0011', group: 'messaging' },
  { platform: 'telegram-bot',  label: 'Telegram bot (game submission)',  handle: '@my_skull_bot',  url: 'https://t.me/my_skull_bot',  group: 'messaging' },

  // Support — mirrors .github/FUNDING.yml (single source of truth on GitHub side).
  { platform: 'github-sponsors', label: 'GitHub Sponsors',  handle: 'poli0981',  url: 'https://github.com/sponsors/poli0981',  group: 'support' },
  { platform: 'patreon',         label: 'Patreon',           handle: 'skullmute', url: 'https://patreon.com/skullmute',         group: 'support' },
  { platform: 'kofi',            label: 'Ko-fi',             handle: 'skullmute', url: 'https://ko-fi.com/skullmute',           group: 'support' },
  { platform: 'bmc',             label: 'Buy Me a Coffee',   handle: 'skullmute', url: 'https://buymeacoffee.com/skullmute',    group: 'support' },
  { platform: 'paypal',          label: 'PayPal',            handle: 'one-time',  url: 'https://paypal.me/DungDang212',         group: 'support' },

  // Gaming
  { platform: 'steam', label: 'Steam', handle: 'profile', url: 'https://steamcommunity.com/profiles/76561199544666292/', group: 'gaming' },
]

export const SOCIAL_GROUP_LABELS: Record<SocialGroup, string> = {
  social: 'Social',
  community: 'Community',
  messaging: 'Messaging',
  support: 'Support',
  gaming: 'Gaming',
}

const REPO_BLOB = 'https://github.com/poli0981/free-games-itchio-list/blob/main'

export type LegalGroup = 'policy' | 'meta'

export interface LegalLink {
  name: string
  description: string
  url: string
  group: LegalGroup
}

export const LEGAL_LINKS: LegalLink[] = [
  // Policy
  { name: 'Disclaimer',      description: 'No warranty, no liability, "as-is" basis.',                              url: `${REPO_BLOB}/docs/DISCLAIMER.md`,     group: 'policy' },
  { name: 'EULA',            description: 'MIT-licensed; what the license does and does not cover.',                url: `${REPO_BLOB}/docs/EULA.md`,           group: 'policy' },
  { name: 'Terms of Use',    description: 'Permitted uses, prohibited activities, contributor obligations, PAT.',   url: `${REPO_BLOB}/docs/ToS.md`,            group: 'policy' },
  { name: 'Privacy Policy',  description: 'Zero server-side data collection. Local-only browser storage detailed.', url: `${REPO_BLOB}/docs/PrivacyPolicy.md`,  group: 'policy' },
  { name: 'Code of Conduct', description: 'Be cool. The full version is on GitHub.',                                url: `${REPO_BLOB}/CODE_OF_CONDUCT.md`,     group: 'policy' },
  { name: 'Security Policy', description: 'Reporting vulnerabilities + PAT handling overview.',                     url: `${REPO_BLOB}/SECURITY.md`,            group: 'policy' },

  // Meta
  { name: 'License (MIT)',   description: 'The canonical license text.',                                            url: `${REPO_BLOB}/LICENSE`,                group: 'meta' },
  { name: 'Changelog',       description: 'What changed when.',                                                     url: `${REPO_BLOB}/CHANGELOG.md`,           group: 'meta' },
]

export const LEGAL_GROUP_LABELS: Record<LegalGroup, string> = {
  policy: 'Policies',
  meta: 'Meta',
}

export const LEGAL_VI_INDEX_URL =
  'https://github.com/poli0981/free-games-itchio-list/tree/main/docs/i18n/vi'

export const THIRD_PARTY: ThirdParty[] = [
  // Core
  { name: 'React', version: '19.2', license: 'MIT', url: 'https://react.dev', category: 'core' },
  { name: 'TypeScript', version: '6.0', license: 'Apache-2.0', url: 'https://www.typescriptlang.org', category: 'core' },
  { name: 'Vite', version: '8.0', license: 'MIT', url: 'https://vite.dev', category: 'core' },
  { name: 'React Router', version: '7.14', license: 'MIT', url: 'https://reactrouter.com', category: 'core' },
  { name: 'Zustand', version: '5.0', license: 'MIT', url: 'https://github.com/pmndrs/zustand', category: 'core' },
  { name: 'Zod', version: '4.4', license: 'MIT', url: 'https://zod.dev', category: 'core' },

  // UI
  { name: 'Tailwind CSS', version: '3.4', license: 'MIT', url: 'https://tailwindcss.com', category: 'ui' },
  { name: 'shadcn/ui', version: 'pattern', license: 'MIT', url: 'https://ui.shadcn.com', category: 'ui' },
  { name: 'Radix UI', version: '1.x / 2.x', license: 'MIT', url: 'https://www.radix-ui.com', category: 'ui' },
  { name: 'lucide-react', version: '1.14', license: 'ISC', url: 'https://lucide.dev', category: 'ui' },
  { name: 'sonner', version: '2.0', license: 'MIT', url: 'https://sonner.emilkowal.ski', category: 'ui' },
  { name: 'class-variance-authority', version: '0.7', license: 'Apache-2.0', url: 'https://cva.style', category: 'ui' },
  { name: 'tailwind-merge', version: '3.5', license: 'MIT', url: 'https://github.com/dcastil/tailwind-merge', category: 'ui' },
  { name: 'clsx', version: '2.1', license: 'MIT', url: 'https://github.com/lukeed/clsx', category: 'ui' },
  { name: 'Recharts', version: '3.8', license: 'MIT', url: 'https://recharts.org', category: 'ui' },

  // Data
  { name: 'TanStack Query', version: '5.100', license: 'MIT', url: 'https://tanstack.com/query', category: 'data' },
  { name: 'TanStack Table', version: '8.21', license: 'MIT', url: 'https://tanstack.com/table', category: 'data' },
  { name: 'TanStack Virtual', version: '3.13', license: 'MIT', url: 'https://tanstack.com/virtual', category: 'data' },
  { name: 'react-hook-form', version: '7.75', license: 'MIT', url: 'https://react-hook-form.com', category: 'data' },
  { name: '@hookform/resolvers', version: '5.2', license: 'MIT', url: 'https://github.com/react-hook-form/resolvers', category: 'data' },
  { name: '@octokit/rest', version: '22.0', license: 'MIT', url: 'https://github.com/octokit/octokit.js', category: 'data' },
  { name: 'idb-keyval', version: '6.2', license: 'Apache-2.0', url: 'https://github.com/jakearchibald/idb-keyval', category: 'data' },
  { name: 'OpenPGP.js', version: '6.3', license: 'LGPL-3.0', url: 'https://openpgpjs.org', category: 'data' },

  // Desktop
  { name: 'Tauri', version: '2.x', license: 'Apache-2.0 OR MIT', url: 'https://tauri.app', category: 'desktop' },
  { name: '@tauri-apps/api', version: '2.11', license: 'Apache-2.0 OR MIT', url: 'https://tauri.app', category: 'desktop' },
  { name: 'tauri-plugin-http', version: '2', license: 'Apache-2.0 OR MIT', url: 'https://tauri.app', category: 'desktop' },
  { name: 'tauri-plugin-opener', version: '2', license: 'Apache-2.0 OR MIT', url: 'https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/opener', category: 'desktop' },
  { name: 'tauri-plugin-single-instance', version: '2', license: 'Apache-2.0 OR MIT', url: 'https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/single-instance', category: 'desktop' },
]

export const UPSTREAM_DATA = {
  source: 'itch.io',
  url: 'https://itch.io',
  note: 'Game metadata (name, description, tags, thumbnails, etc.) is scraped from itch.io and remains the property of the respective game developers. This database is a community-maintained index for discovery only.',
}
