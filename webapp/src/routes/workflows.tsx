import { useState } from 'react'
import { toast } from 'sonner'
import { Play, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/stores/auth'
import { createOctokit } from '@/lib/github/client'
import { dispatchWorkflow, type WorkflowFile, type WorkflowRunSummary } from '@/lib/github/workflow'
import { useWorkflowRuns, WORKFLOWS } from '@/hooks/useWorkflows'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

function StatusBadge({ run }: { run: WorkflowRunSummary }) {
  if (run.status !== 'completed') {
    return <Badge variant="secondary">{run.status}</Badge>
  }
  if (run.conclusion === 'success') return <Badge>success</Badge>
  if (run.conclusion === 'failure') return <Badge variant="destructive">failure</Badge>
  return <Badge variant="outline">{run.conclusion ?? '—'}</Badge>
}

function WorkflowPanel({ file, label, description }: { file: WorkflowFile; label: string; description: string }) {
  const pat = useAuth((s) => s.pat)
  const runs = useWorkflowRuns(file)
  const [busy, setBusy] = useState(false)

  async function handleDispatch() {
    if (!pat) return toast.error('Unlock your PAT in Settings.')
    setBusy(true)
    try {
      await dispatchWorkflow(createOctokit(), file)
      toast.success(`Dispatched ${file}.`)
      setTimeout(() => runs.refetch(), 3_000)
    } catch (e) {
      toast.error(`Dispatch failed: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <CardTitle className="text-base">{label}</CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runs.refetch()}
              disabled={runs.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${runs.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleDispatch} disabled={busy || !pat}>
              <Play className="h-4 w-4" />
              Dispatch
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!pat ? (
          <p className="text-sm text-muted-foreground">Unlock your PAT to view runs.</p>
        ) : runs.isLoading ? (
          <Skeleton className="h-32" />
        ) : runs.isError ? (
          <p className="text-sm text-destructive">{runs.error.message}</p>
        ) : (runs.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No runs yet.</p>
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
                    Open
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
  useDocumentTitle('Workflows')
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">Workflows</h1>
      <Tabs defaultValue="update.yml">
        <TabsList className="flex-wrap">
          {WORKFLOWS.map((w) => (
            <TabsTrigger key={w.file} value={w.file}>
              {w.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {WORKFLOWS.map((w) => (
          <TabsContent key={w.file} value={w.file}>
            <WorkflowPanel file={w.file} label={w.label} description={w.description} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
