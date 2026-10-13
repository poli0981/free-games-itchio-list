import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminApi, shortSha, type AuditRow } from './api'
import { errorText, when } from './texts'
import { Notice, TabBar } from './ui'

const FILTERS = {
  all: { label: 'All', actions: [] },
  approvals: { label: 'Approvals', actions: ['approve', 'approve_override', 'auto_approve'] },
  collections: { label: 'Collections', actions: ['collection_add', 'collection_watch', 'collection_unwatch', 'collection_toggle'] },
  removals: { label: 'Removals', actions: ['delete'] },
  edits: { label: 'Edits', actions: ['edit'] },
  rejections: { label: 'Rejections', actions: ['reject'] },
  other: { label: 'Restores & settings', actions: ['restore', 'settings'] },
} as const

type Filter = keyof typeof FILTERS

const ACTION: Record<string, string> = {
  approve: 'approved',
  approve_override: 'approved (override)',
  auto_approve: 'auto-approved',
  collection_add: 'added from a collection',
  collection_watch: 'followed a collection',
  collection_unwatch: 'stopped following',
  collection_toggle: 'switched a collection',
  delete: 'removed',
  edit: 'edited',
  reject: 'rejected',
  restore: 'restored',
  settings: 'changed settings',
}

/** The audit log: every admin action and automatic run, with its commit. */
export function ActivityPage({ repo }: { repo: string | null }) {
  const [filter, setFilter] = useState<Filter>('all')
  const log = useInfiniteQuery({
    queryKey: ['activity', filter],
    queryFn: ({ pageParam }) => adminApi.activity({ before: pageParam, actions: [...FILTERS[filter].actions] }),
    initialPageParam: null as number | null,
    getNextPageParam: (last) => last.next,
  })
  const rows = log.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <section>
      <h1 className="mb-3 text-lg font-semibold">Activity</h1>
      <TabBar
        label="Kind of action"
        value={filter}
        onChange={setFilter}
        options={(Object.keys(FILTERS) as Filter[]).map((id) => ({ id, label: FILTERS[id].label }))}
      />
      {log.error && <Notice text={errorText(log.error)} tone="error" onClose={() => void log.refetch()} />}
      {log.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {log.data && rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>}
      {rows.length > 0 && (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Who</th>
              <th className="py-2 pr-3">What</th>
              <th className="py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <ActivityRow key={r.id} row={r} repo={repo} />
            ))}
          </tbody>
        </table>
      )}
      {log.hasNextPage && (
        <Button className="mt-3" variant="outline" size="sm" disabled={log.isFetchingNextPage} onClick={() => void log.fetchNextPage()}>
          {log.isFetchingNextPage ? 'Loading…' : 'Load older'}
        </Button>
      )}
    </section>
  )
}

function ActivityRow({ row, repo }: { row: AuditRow; repo: string | null }) {
  const targets = (row.target ?? '').split(' ').filter(Boolean)
  const link = (t: string) =>
    t.startsWith('https://') ? (
      <a href={t} target="_blank" rel="noreferrer noopener" className="hover:underline">
        {t.replace('https://', '')}
      </a>
    ) : (
      t
    )
  return (
    <tr className="border-b align-top last:border-0">
      <td className="py-2 pr-3 text-xs whitespace-nowrap text-muted-foreground tabular-nums">{when(row.at)}</td>
      <td className="max-w-40 truncate py-2 pr-3 text-xs">{row.actor === 'cron' ? 'automatic' : row.actor}</td>
      <td className="py-2 pr-3">
        <Badge variant={row.action === 'delete' || row.action === 'reject' ? 'destructive' : 'outline'}>
          {ACTION[row.action] ?? row.action}
        </Badge>
      </td>
      <td className="py-2 text-xs">
        {targets.length === 1 && <div className="truncate">{link(targets[0])}</div>}
        {targets.length > 1 && (
          <details>
            <summary className="cursor-pointer">
              {targets.length} games: {link(targets[0])} …
            </summary>
            <ul className="mt-1 max-h-48 overflow-y-auto">
              {targets.map((t) => (
                <li key={t} className="truncate">
                  {link(t)}
                </li>
              ))}
            </ul>
          </details>
        )}
        {row.detail && <div className="mt-0.5 break-all text-muted-foreground">{row.detail}</div>}
        {row.commit_sha && (
          <div className="mt-0.5 text-muted-foreground">
            commit{' '}
            {repo ? (
              <a
                href={`https://github.com/${repo}/commit/${row.commit_sha}`}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono hover:underline"
              >
                {shortSha(row.commit_sha)}
              </a>
            ) : (
              <span className="font-mono">{shortSha(row.commit_sha)}</span>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}
