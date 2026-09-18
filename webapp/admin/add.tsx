import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { adminApi, errorText, shortSha, type AddResult } from './api'
import { Notice, PUBLISH_NOTE } from './app'

const OUTCOME: Record<string, string> = {
  queued: 'new',
  invalid_url: 'not an itch.io game URL',
  duplicate_in_request: 'listed twice',
  duplicate_catalog: 'already in the catalog',
  duplicate_pending: 'already in the queue',
  previously_deleted: 'removed before',
  rejected: 'rejected before',
}

export function AddPage() {
  const [text, setText] = useState('')
  const [override, setOverride] = useState(false)
  const [result, setResult] = useState<AddResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const client = useQueryClient()
  const urls = text
    .split(/\s+/)
    .map((u) => u.trim())
    .filter(Boolean)

  const add = useMutation({
    mutationFn: () => adminApi.add(urls, override),
    onSuccess: (r) => {
      setResult(r)
      setError(null)
      if (r.results.some((x) => x.approved)) setText('')
      void client.invalidateQueries({ queryKey: ['queue'] })
    },
    onError: (e) => setError(errorText(e)),
  })

  return (
    <section className="max-w-3xl">
      <h1 className="mb-1 text-lg font-semibold">Add games</h1>
      <p className="mb-3 text-sm text-muted-foreground">
        Paste itch.io game URLs (one per line, up to 200). New ones are approved right away and scraped by the
        ingest workflow; paid games are dropped there.
      </p>
      <label htmlFor="urls" className="sr-only">
        Game URLs
      </label>
      <textarea
        id="urls"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        spellCheck={false}
        placeholder="https://creator.itch.io/game"
        className="w-full rounded-md border bg-background p-2 font-mono text-sm"
      />
      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
          Override: also bring back removed or rejected games
        </label>
        <Button className="ml-auto" disabled={!urls.length || urls.length > 200 || add.isPending} onClick={() => add.mutate()}>
          {add.isPending ? 'Adding…' : `Add ${urls.length || ''}`}
        </Button>
      </div>

      {error && (
        <div className="mt-4">
          <Notice text={error} tone="error" onClose={() => setError(null)} />
        </div>
      )}
      {result && (
        <div className="mt-6">
          <p className="mb-2 text-sm">
            {result.results.filter((r) => r.approved).length} queued for ingest ({shortSha(result.sha)}). {PUBLISH_NOTE}
          </p>
          <table className="w-full text-sm">
            <tbody>
              {result.results.map((r, i) => (
                <tr key={`${r.input}-${i}`} className="border-b last:border-0">
                  <td className="py-1.5 font-mono text-xs">{r.url ?? r.input}</td>
                  <td className="py-1.5 text-muted-foreground">{OUTCOME[r.outcome] ?? r.outcome}</td>
                  <td className="py-1.5">{r.approved ? 'queued' : r.reason ? r.reason.replace(/_/g, ' ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
