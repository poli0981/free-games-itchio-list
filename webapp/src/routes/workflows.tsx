import { useState } from 'react'
import { toast } from 'sonner'
import { Play, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/stores/auth'
import { createOctokit } from '@/lib/github/client'
import { dispatchWorkflow, type WorkflowFile, type WorkflowRunSummary } from '@/lib/github/workflow'
import { useWorkflowRuns, WORKFLOWS } from '@/hooks/useWorkflows'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT, type MessageKey } from '@/lib/i18n'

function StatusBadge({ run }: { run: WorkflowRunSummary }) {
  if (run.status !== 'completed') {
    return <Badge variant="secondary">{run.status}</Badge>
  }
  if (run.conclusion === 'success') return <Badge>success</Badge>
  if (run.conclusion === 'failure') return <Badge variant="destructive">failure</Badge>
  return <Badge variant="outline">{run.conclusion ?? '—'}</Badge>
}

function WorkflowPanel({ file, labelKey, descriptionKey }: { file: WorkflowFile; labelKey: MessageKey; descriptionKey: MessageKey }) {
  const t = useT()
  const pat = useAuth((s) => s.pat)
  const runs = useWorkflowRuns(file)
  const [busy, setBusy] = useState(false)

  async function handleDispatch() {
    if (!pat) return toast.error(t('workflows.toast.unlockPat'))
    setBusy(true)
    try {
      await dispatchWorkflow(createOctokit(), file)
      toast.success(t('workflows.toast.dispatched', { file }))
      setTimeout(() => runs.refetch(), 3_000)
    } catch (e) {
      toast.error(t('workflows.toast.dispatchFailed', { message: (e as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <CardTitle className="text-base">{t(labelKey)}</CardTitle>
            <p className="text-xs text-muted-foreground">{t(descriptionKey)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runs.refetch()}
              disabled={runs.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${runs.isFetching ? 'animate-spin' : ''}`} />
              {t('workflows.refresh')}
            </Button>
            <Button size="sm" onClick={handleDispatch} disabled={busy || !pat}>
              <Play className="h-4 w-4" />
              {t('workflows.dispatch')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!pat ? (
          <p className="text-sm text-muted-foreground">{t('workflows.unlockPatToView')}</p>
        ) : runs.isLoading ? (
          <Skeleton className="h-32" />
        ) : runs.isError ? (
          <p className="text-sm text-destructive">{runs.error.message}</p>
        ) : (runs.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">{t('workflows.noRuns')}</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {runs.data!.slice(0, 10).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b py-1.5 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <StatusBadge run={r} />
                  <span className="text-xs text-muted-foreground">#{r.run_number}</span>
                  <span className="truncate">{r.display_title || r.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {r.event}
                  </Badge>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {t('workflows.openRun')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default function Workflows() {
  const t = useT()
  useDocumentTitle(t('titles.workflows'))
  const [current, setCurrent] = useState<string>(WORKFLOWS[0].file)
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">{t('titles.workflows')}</h1>
      <div className="mb-3 md:hidden">
        <Select value={current} onValueChange={setCurrent}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORKFLOWS.map((w) => (
              <SelectItem key={w.file} value={w.file}>
                {t(w.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Tabs value={current} onValueChange={setCurrent}>
        <TabsList className="hidden flex-wrap md:inline-flex">
          {WORKFLOWS.map((w) => (
            <TabsTrigger key={w.file} value={w.file}>
              {t(w.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
        {WORKFLOWS.map((w) => (
          <TabsContent key={w.file} value={w.file}>
            <WorkflowPanel file={w.file} labelKey={w.labelKey} descriptionKey={w.descriptionKey} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
