export interface ThirdParty {
  name: string
  version: string
  license: string
  url: string
  category: 'core' | 'ui' | 'data' | 'desktop' | 'dev'
}

export const APP = {
  name: 'Itch.io Free Games DB',
  version: '0.1.0',
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
  blurb: 'Unemployed introvert Vietnamese dev. Grok is my non-judgmental coding buddy.',
  githubUrl: 'https://github.com/poli0981',
} as const

export const ERROR_TEMPLATE_URL =
  'https://github.com/poli0981/free-games-itchio-list/issues/new?template=bug_report.yml'

export type SocialGroup = 'social' | 'community' | 'support' | 'gaming'

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

  // Support
  { platform: 'patreon', label: 'Patreon', handle: 'skullmute', url: 'https://patreon.com/skullmute', group: 'support' },
  { platform: 'kofi', label: 'Ko-fi', handle: 'skullmute', url: 'https://ko-fi.com/skullmute', group: 'support' },

  // Gaming
  { platform: 'steam', label: 'Steam', handle: 'profile', url: 'https://steamcommunity.com/profiles/76561199544666292/', group: 'gaming' },
]

export const SOCIAL_GROUP_LABELS: Record<SocialGroup, string> = {
  social: 'Social',
  community: 'Community',
  support: 'Support',
  gaming: 'Gaming',
}

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
  { name: 'TanStack Query', version: '5.10', license: 'MIT', url: 'https://tanstack.com/query', category: 'data' },
  { name: 'TanStack Table', version: '8.21', license: 'MIT', url: 'https://tanstack.com/table', category: 'data' },
  { name: 'TanStack Virtual', version: '3.13', license: 'MIT', url: 'https://tanstack.com/virtual', category: 'data' },
  { name: 'react-hook-form', version: '7.75', license: 'MIT', url: 'https://react-hook-form.com', category: 'data' },
  { name: '@octokit/rest', version: '22.0', license: 'MIT', url: 'https://github.com/octokit/octokit.js', category: 'data' },
  { name: 'idb-keyval', version: '6.2', license: 'Apache-2.0', url: 'https://github.com/jakearchibald/idb-keyval', category: 'data' },

  // Desktop
  { name: 'Tauri', version: '2.x', license: 'Apache-2.0 OR MIT', url: 'https://tauri.app', category: 'desktop' },
  { name: '@tauri-apps/api', version: '2.11', license: 'Apache-2.0 OR MIT', url: 'https://tauri.app', category: 'desktop' },
  { name: 'tauri-plugin-http', version: '2', license: 'Apache-2.0 OR MIT', url: 'https://tauri.app', category: 'desktop' },
  { name: 'tauri-plugin-opener', version: '2', license: 'Apache-2.0 OR MIT', url: 'https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/opener', category: 'desktop' },
]

export const UPSTREAM_DATA = {
  source: 'itch.io',
  url: 'https://itch.io',
  note: 'Game metadata (name, description, tags, thumbnails, etc.) is scraped from itch.io and remains the property of the respective game developers. This database is a community-maintained index for discovery only.',
}
