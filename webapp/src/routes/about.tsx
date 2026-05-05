import {
  Bug,
  Cloud,
  Coffee,
  ExternalLink as ExternalLinkIcon,
  Gamepad2,
  Library,
  Globe,
  Hash,
  Heart,
  MessagesSquare,
  ScrollText,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ExtLink } from '@/components/ext-link'
import {
  AI_TOOLS,
  APP,
  DEV,
  ERROR_TEMPLATE_URL,
  LEGAL_GROUP_LABELS,
  LEGAL_LINKS,
  LEGAL_VI_INDEX_URL,
  SOCIAL_GROUP_LABELS,
  SOCIAL_LINKS,
  THIRD_PARTY,
  UPSTREAM_DATA,
  type LegalGroup,
  type SocialGroup,
  type SocialLink,
  type ThirdParty,
} from '@/lib/about'

const CATEGORY_LABELS: Record<ThirdParty['category'], string> = {
  core: 'Core',
  ui: 'UI / styling',
  data: 'Data layer',
  desktop: 'Desktop (Tauri)',
  dev: 'Dev tooling',
}

const SOCIAL_ICON: Record<string, LucideIcon> = {
  x: Hash,
  youtube: Video,
  bluesky: Cloud,
  mastodon: Hash,
  'discord-repo': MessagesSquare,
  'discord-game': MessagesSquare,
  patreon: Heart,
  kofi: Coffee,
  steam: Gamepad2,
}

const SOCIAL_GROUP_ORDER: SocialGroup[] = ['social', 'community', 'support', 'gaming']
const LEGAL_GROUP_ORDER: LegalGroup[] = ['policy', 'meta']

function ThirdPartySection({ category }: { category: ThirdParty['category'] }) {
  const items = THIRD_PARTY.filter((t) => t.category === category)
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{CATEGORY_LABELS[category]}</h3>
      <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
        {items.map((t) => (
          <li
            key={t.name}
            className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
          >
            <ExtLink
              href={t.url}
              className="inline-flex items-center gap-1 truncate font-medium hover:underline"
              title={`${t.name} ${t.version}`}
            >
              {t.name}
              <ExternalLinkIcon className="h-3 w-3 opacity-50" />
            </ExtLink>
            <div className="flex flex-shrink-0 items-center gap-2 text-xs">
              <span className="text-muted-foreground">{t.version}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {t.license}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SocialGroupSection({ group }: { group: SocialGroup }) {
  const items = SOCIAL_LINKS.filter((s) => s.group === group)
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{SOCIAL_GROUP_LABELS[group]}</h3>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((s) => (
          <SocialItem key={s.platform} link={s} />
        ))}
      </ul>
    </div>
  )
}

function SocialItem({ link }: { link: SocialLink }) {
  const Icon = SOCIAL_ICON[link.platform] ?? Globe
  return (
    <li className="rounded-md border">
      <ExtLink
        href={link.url}
        className="flex items-center gap-3 p-2 text-sm hover:bg-accent hover:text-accent-foreground"
      >
        <Icon className="h-4 w-4 flex-shrink-0 opacity-70" />
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium">{link.label}</span>
          <span className="ml-2 text-xs text-muted-foreground">{link.handle}</span>
        </span>
        <ExternalLinkIcon className="h-3 w-3 flex-shrink-0 opacity-50" />
      </ExtLink>
    </li>
  )
}

export default function About() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">About</h1>

      <Card>
        <CardHeader>
          <CardTitle>{APP.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            v{APP.version} · built {APP.buildDate} · {APP.license} licensed
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            A read/write companion app for the{' '}
            <ExtLink href={APP.repo} className="font-medium hover:underline">
              free-games-itchio-list
            </ExtLink>{' '}
            catalog. Browse 500+ free games from itch.io, edit annotations, dispatch the scraper
            workflow with one click, and visualize the dataset.
          </p>
          <p className="text-muted-foreground">
            Reads are public (no auth needed). Writes use a fine-grained GitHub PAT held only in
            memory after passphrase unlock — see Settings.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Developer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{DEV.name}</span>
            <Badge variant="secondary" className="text-xs">
              {DEV.role}
            </Badge>
          </div>
          <p className="text-muted-foreground">{DEV.blurb}</p>
          <ExtLink
            href={DEV.githubUrl}
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            <Library className="h-4 w-4" />
            {DEV.githubUrl.replace('https://', '')}
            <ExternalLinkIcon className="h-3 w-3 opacity-50" />
          </ExtLink>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">AI co-authors</CardTitle>
          <p className="text-xs text-muted-foreground">
            No real co-maintainers (introvert max level). These two LLMs are the closest thing.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {AI_TOOLS.map((tool) => (
            <div key={tool.name} className="space-y-1.5 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <ExtLink href={tool.url} className="inline-flex items-center gap-1 font-medium hover:underline">
                  {tool.name}
                  <ExternalLinkIcon className="h-3 w-3 opacity-50" />
                </ExtLink>
                <Badge variant="outline" className="text-xs">{tool.vendor}</Badge>
                {tool.model && (
                  <Badge variant="secondary" className="font-mono text-xs">{tool.model}</Badge>
                )}
              </div>
              <p className="text-muted-foreground">{tool.role}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Found a bug?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            If something's broken — desktop or web — file it here so I see it. Grok will probably
            patch it before I wake up :D
          </p>
          <Button asChild variant="default" size="sm">
            <ExtLink href={ERROR_TEMPLATE_URL}>
              <Bug className="h-4 w-4" />
              Open bug report template
              <ExternalLinkIcon className="h-3.5 w-3.5 opacity-80" />
            </ExtLink>
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Find me elsewhere</CardTitle>
          <p className="text-xs text-muted-foreground">
            DMs open on most. Replies slow (introvert max level). Pick whichever channel fits.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {SOCIAL_GROUP_ORDER.map((group, i) => (
            <div key={group} className="space-y-5">
              {i > 0 && <Separator />}
              <SocialGroupSection group={group} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-4 w-4" />
            Legal &amp; policies
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            All policies are MD files in the repo — short, plain-language, slight humor, full
            on-the-record terms. Updated 2026-05-05.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          {LEGAL_GROUP_ORDER.map((group, i) => {
            const items = LEGAL_LINKS.filter((l) => l.group === group)
            if (items.length === 0) return null
            return (
              <div key={group} className="space-y-2">
                {i > 0 && <Separator />}
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {LEGAL_GROUP_LABELS[group]}
                </h3>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {items.map((link) => (
                    <li key={link.name} className="rounded-md border p-2">
                      <ExtLink
                        href={link.url}
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        {link.name}
                        <ExternalLinkIcon className="h-3 w-3 opacity-50" />
                      </ExtLink>
                      <p className="mt-0.5 text-xs text-muted-foreground">{link.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          <p className="pt-1 text-xs text-muted-foreground">
            Tiếng Việt:{' '}
            <ExtLink href={LEGAL_VI_INDEX_URL} className="font-medium hover:underline">
              docs/i18n/vi/
            </ExtLink>{' '}
            — Vietnamese translations of the policies above (community-readable, English remains
            the controlling version for legal interpretation).
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Upstream data attribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Source:{' '}
            <ExtLink href={UPSTREAM_DATA.url} className="font-medium hover:underline">
              {UPSTREAM_DATA.source}
            </ExtLink>
          </p>
          <p className="text-muted-foreground">{UPSTREAM_DATA.note}</p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Third-party software</CardTitle>
          <p className="text-xs text-muted-foreground">
            Open-source libraries this app builds on. Click any name for the project's home page;
            license names link to the SPDX identifier.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <ThirdPartySection category="core" />
          <Separator />
          <ThirdPartySection category="ui" />
          <Separator />
          <ThirdPartySection category="data" />
          <Separator />
          <ThirdPartySection category="desktop" />
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Made with the libraries above. No tracking, no analytics, no telemetry.
      </p>
    </div>
  )
}
