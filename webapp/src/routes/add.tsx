import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Upload, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAllGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/stores/auth'
import { createOctokit } from '@/lib/github/client'
import { putFile, readFileWithSha } from '@/lib/github/contents'
import {
  dispatchWorkflow,
  findRecentDispatchedRun,
  getWorkflowRun,
} from '@/lib/github/workflow'
import { PATHS } from '@/lib/config'

const URL_REGEX = /^https?:\/\/[\w-]+\.itch\.io\/[\w-]+\/?$/

function normalizeUrl(u: string): string {
  return u.trim().replace(/\/$/, '')
}

export default function Add() {
  useDocumentTitle('Add Game')
  const pat = useAuth((s) => s.pat)
  const all = useAllGames()
  const qc = useQueryClient()
  const [single, setSingle] = useState('')
  const [bulk, setBulk] = useState('')
  const [busy, setBusy] = useState(false)
  const [progressMsg, setProgressMsg] = useState<string>('')
  const [runUrl, setRunUrl] = useState<string | null>(null)

  const existingUrls = useMemo(() => {
    if (!all.data) return new Set<string>()
    return new Set(all.data.games.map((g) => normalizeUrl(g.url)))
  }, [all.data])

  function validateOne(u: string): string | null {
    const norm = normalizeUrl(u)
    if (!URL_REGEX.test(norm)) return 'Not an itch.io URL'
    if (existingUrls.has(norm)) return 'Already in database'
    return null
  }

  async function pollRun(runId: number) {
    setProgressMsg('Workflow dispatched. Polling for completion...')
    const octokit = createOctokit()
    const start = Date.now()
    const TIMEOUT_MS = 5 * 60 * 1000
    while (Date.now() - start < TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, 5_000))
      const run = await getWorkflowRun(octokit, runId)
      setRunUrl(run.html_url)
      setProgressMsg(`Status: ${run.status}${run.conclusion ? ` (${run.conclusion})` : ''}`)
      if (run.status === 'completed') {
        if (run.conclusion === 'success') {
          toast.success('Workflow completed. Refreshing data.')
          await qc.invalidateQueries({ queryKey: ['db'] })
        } else {
          toast.error(`Workflow ${run.conclusion}. See run logs.`)
        }
        return
      }
    }
    toast.warning('Polling timed out. Check the Workflows tab.')
  }

  async function handleSingle() {
    if (!pat) return toast.error('Unlock your PAT in Settings.')
    const err = validateOne(single)
    if (err) return toast.error(err)
    setBusy(true)
    setRunUrl(null)
    setProgressMsg('Dispatching update workflow...')
    try {
      const octokit = createOctokit()
      const dispatchTime = Date.now() - 2_000
      await dispatchWorkflow(octokit, 'update.yml', { url: normalizeUrl(single) })
      // GitHub returns 204 with no run id; find the just-dispatched run.
      let run = null
      for (let i = 0; i < 6 && !run; i++) {
        await new Promise((r) => setTimeout(r, 2_000))
        run = await findRecentDispatchedRun(octokit, 'update.yml', dispatchTime)
      }
      if (!run) {
        toast.warning('Dispatched but could not locate the run. Check Workflows.')
        setProgressMsg('Run not found; check Workflows tab')
        return
      }
      setSingle('')
      await pollRun(run.id)
    } catch (e) {
      toast.error(`Dispatch failed: ${(e as Error).message}`)
      setProgressMsg('')
    } finally {
      setBusy(false)
    }
  }

  async function handleBulk() {
    if (!pat) return toast.error('Unlock your PAT in Settings.')
    const lines = bulk
      .split(/\s+/)
      .map((l) => normalizeUrl(l))
      .filter(Boolean)
    if (lines.length === 0) return toast.error('Paste at least one URL.')

    const valid: string[] = []
    const errors: { url: string; reason: string }[] = []
    for (const u of lines) {
      const err = validateOne(u)
      if (err) errors.push({ url: u, reason: err })
      else if (!valid.includes(u)) valid.push(u)
    }
    if (valid.length === 0) {
      toast.error(`All ${lines.length} URLs invalid. ${errors[0]?.reason ?? ''}`)
      return
    }
    if (errors.length > 0) toast.warning(`${errors.length} skipped, ${valid.length} valid.`)

    setBusy(true)
    setRunUrl(null)
    setProgressMsg(`Writing scripts/temp_link.json with ${valid.length} URLs...`)
    try {
      const octokit = createOctokit()
      const { sha } = await readFileWithSha(octokit, PATHS.tempLink)
      const newJson = JSON.stringify(valid, null, 4) + '\n'
      await putFile(
        octokit,
        PATHS.tempLink,
        newJson,
        sha,
        `chore(webapp): queue ${valid.length} new URLs`,
      )
      setProgressMsg('Dispatching update workflow...')
      const dispatchTime = Date.now() - 2_000
      await dispatchWorkflow(octokit, 'update.yml')
      let run = null
      for (let i = 0; i < 6 && !run; i++) {
        await new Promise((r) => setTimeout(r, 2_000))
        run = await findRecentDispatchedRun(octokit, 'update.yml', dispatchTime)
      }
      if (run) {
        setBulk('')
        await pollRun(run.id)
      } else {
        toast.warning('Dispatched but could not locate the run. Check Workflows.')
      }
    } catch (e) {
      toast.error(`Bulk failed: ${(e as Error).message}`)
      setProgressMsg('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Add Game</h1>

      {!pat && (
        <Card className="mb-4">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Unlock your PAT in <b>Settings</b> first — adding games dispatches the GitHub
            Actions workflow which requires <code>workflow:write</code>.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">Single URL</TabsTrigger>
          <TabsTrigger value="bulk">Bulk</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add one game by URL</CardTitle>
              <p className="text-xs text-muted-foreground">
                Dispatches <code>update.yml</code> with this URL as input. The workflow scrapes,
                validates free status, and commits — usually 60–120 s.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="single">itch.io URL</Label>
                <Input
                  id="single"
                  placeholder="https://username.itch.io/game-slug"
                  value={single}
                  onChange={(e) => setSingle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !busy && handleSingle()}
                />
              </div>
              <Button onClick={handleSingle} disabled={busy || !pat}>
                <Plus className="h-4 w-4" />
                {busy ? 'Working...' : 'Add'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bulk import</CardTitle>
              <p className="text-xs text-muted-foreground">
                One URL per line (whitespace-separated also OK). Writes them to
                <code> scripts/temp_link.json</code> in a single commit, then dispatches the
                workflow.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={8}
                placeholder={'https://a.itch.io/x\nhttps://b.itch.io/y\n...'}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
              />
              <Button onClick={handleBulk} disabled={busy || !pat}>
                <Upload className="h-4 w-4" />
                {busy ? 'Working...' : 'Queue & dispatch'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {progressMsg && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">Status</Badge>
                <span>{progressMsg}</span>
              </div>
              {runUrl && (
                <a
                  href={runUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View run
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
