import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { APP, THIRD_PARTY, UPSTREAM_DATA, type ThirdParty } from '@/lib/about'

const CATEGORY_LABELS: Record<ThirdParty['category'], string> = {
  core: 'Core',
  ui: 'UI / styling',
  data: 'Data layer',
  desktop: 'Desktop (Tauri)',
  dev: 'Dev tooling',
}

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
            <a
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium hover:underline"
              title={`${t.name} ${t.version}`}
            >
              {t.name}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
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
            <a href={APP.repo} target="_blank" rel="noreferrer" className="font-medium hover:underline">
              free-games-itchio-list
            </a>{' '}
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
          <CardTitle className="text-base">Upstream data attribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Source:{' '}
            <a
              href={UPSTREAM_DATA.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline"
            >
              {UPSTREAM_DATA.source}
            </a>
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
