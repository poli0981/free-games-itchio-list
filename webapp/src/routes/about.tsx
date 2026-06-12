import {
  Bot,
  Bug,
  CircleDollarSign,
  Cloud,
  Coffee,
  CupSoda,
  ExternalLink as ExternalLinkIcon,
  Gamepad2,
  HeartHandshake,
  Library,
  Globe,
  Hash,
  Heart,
  MessagesSquare,
  ScrollText,
  Send,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ExtLink } from '@/components/ext-link'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT, type MessageKey } from '@/lib/i18n'
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

const CATEGORY_LABELS: Record<ThirdParty['category'], MessageKey> = {
  core: 'about.thirdParty.core',
  ui: 'about.thirdParty.ui',
  data: 'about.thirdParty.data',
  desktop: 'about.thirdParty.desktop',
  dev: 'about.thirdParty.dev',
}

const SOCIAL_ICON: Record<string, LucideIcon> = {
  x: Hash,
  youtube: Video,
  bluesky: Cloud,
  mastodon: Hash,
  'discord-repo': MessagesSquare,
  'discord-game': MessagesSquare,
  'telegram-user': Send,
  'telegram-bot': Bot,
  'github-sponsors': HeartHandshake,
  patreon: Heart,
  kofi: Coffee,
  bmc: CupSoda,
  paypal: CircleDollarSign,
  steam: Gamepad2,
}

const SOCIAL_GROUP_ORDER: SocialGroup[] = ['social', 'community', 'messaging', 'support', 'gaming']
const LEGAL_GROUP_ORDER: LegalGroup[] = ['policy', 'meta']

function ThirdPartySection({ category }: { category: ThirdParty['category'] }) {
  const t = useT()
  const items = THIRD_PARTY.filter((lib) => lib.category === category)
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">
        {t(CATEGORY_LABELS[category])}
      </h3>
      <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
        {items.map((lib) => (
          <li
            key={lib.name}
            className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
          >
            <ExtLink
              href={lib.url}
              className="inline-flex items-center gap-1 truncate font-medium hover:underline"
              title={`${lib.name} ${lib.version}`}
            >
              {lib.name}
              <ExternalLinkIcon className="h-3 w-3 opacity-50" />
            </ExtLink>
            <div className="flex flex-shrink-0 items-center gap-2 text-xs">
              <span className="text-muted-foreground">{lib.version}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {lib.license}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const GROUP_NOTE: Partial<Record<SocialGroup, MessageKey>> = {
  messaging: 'about.social.messagingNote',
  support: 'about.social.supportNote',
}

const PLATFORM_NOTE: Record<string, MessageKey> = {
  paypal: 'about.social.paypalNote',
}

function SocialGroupSection({ group }: { group: SocialGroup }) {
  const t = useT()
  const items = SOCIAL_LINKS.filter((s) => s.group === group)
  if (items.length === 0) return null
  const noteKey = GROUP_NOTE[group]
  return (
    <div className="space-y-2">
      <h3
        id={group === 'support' ? 'support' : undefined}
        className="text-sm font-semibold text-muted-foreground scroll-mt-20"
      >
        {SOCIAL_GROUP_LABELS[group]}
      </h3>
      {noteKey && <p className="text-xs text-muted-foreground">{t(noteKey)}</p>}
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((s) => (
          <SocialItem key={s.platform} link={s} />
        ))}
      </ul>
    </div>
  )
}

function SocialItem({ link }: { link: SocialLink }) {
  const t = useT()
  const Icon = SOCIAL_ICON[link.platform] ?? Globe
  const noteKey = PLATFORM_NOTE[link.platform]
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
      {noteKey && <p className="px-2 pb-1 text-[10px] text-muted-foreground">{t(noteKey)}</p>}
    </li>
  )
}

export default function About() {
  const t = useT()
  useDocumentTitle(t('titles.about'))
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{t('titles.about')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{APP.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('about.app.meta', {
              version: APP.version,
              buildDate: APP.buildDate,
              license: APP.license,
            })}
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {t('about.app.descPrefix')}
            <ExtLink href={APP.repo} className="font-medium hover:underline">
              free-games-itchio-list
            </ExtLink>
            {t('about.app.descSuffix')}
          </p>
          <p className="text-muted-foreground">{t('about.app.access')}</p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t('about.developer.title')}</CardTitle>
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
          <CardTitle className="text-base">{t('about.ai.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('about.ai.desc')}</p>
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
          <CardTitle className="text-base">{t('about.bug.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{t('about.bug.desc')}</p>
          <Button asChild variant="default" size="sm">
            <ExtLink href={ERROR_TEMPLATE_URL}>
              <Bug className="h-4 w-4" />
              {t('about.bug.openTemplate')}
              <ExternalLinkIcon className="h-3.5 w-3.5 opacity-80" />
            </ExtLink>
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t('about.social.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('about.social.desc')}</p>
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
            {t('about.legal.title')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t('about.legal.desc')}</p>
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
            {t('about.legal.viNote')}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t('about.upstream.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {t('about.upstream.source')}{' '}
            <ExtLink href={UPSTREAM_DATA.url} className="font-medium hover:underline">
              {UPSTREAM_DATA.source}
            </ExtLink>
          </p>
          <p className="text-muted-foreground">{UPSTREAM_DATA.note}</p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t('about.thirdParty.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('about.thirdParty.desc')}</p>
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

      <p className="mt-6 text-center text-xs text-muted-foreground">{t('about.footer')}</p>
    </div>
  )
}
