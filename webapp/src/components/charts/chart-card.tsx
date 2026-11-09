import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TableRow } from '@/lib/chart-table'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ChartAnnounce, chartIds } from './chart-theme'

/** The chart's numbers as a table under it (lib/chart-table.ts builds the rows). */
interface ChartTableData {
  /** Heading of the first column (what each row is: genre, date, …). */
  label: string
  /** Heading of the value column (games, ratings, removed). */
  value: string
  rows: readonly TableRow[]
  /** Formats the first column, e.g. an ISO date. */
  formatKey?: (key: string) => string
}

interface ChartCardProps {
  /** Unique on the page: the ids of the heading, description and hint derive from it (chartAria). */
  id: string
  title: string
  description?: string
  /** The same data as a table, for screen readers and anyone who'd rather read numbers. */
  table?: ChartTableData
  /** Recharts charts you can step through with the arrow keys (not the list cards or the treemap). */
  keyboard?: boolean
  /** Extra classes for the chart area, e.g. a taller one on phones (`max-md:h-96`). */
  contentClassName?: string
  children: ReactNode
}

export function ChartCard({
  id,
  title,
  description,
  table,
  keyboard = true,
  contentClassName,
  children,
}: ChartCardProps) {
  const t = useT()
  const ids = chartIds(id)
  // The tooltip's text goes straight into the live region: no state, so hovering
  // never re-renders the card or the chart in it (charts stay mounted, gotcha 33).
  const live = useRef<HTMLParagraphElement>(null)
  const announce = useCallback((text: string) => {
    if (live.current && live.current.textContent !== text) live.current.textContent = text
  }, [])
  return (
    <Card>
      <CardHeader>
        <CardTitle id={ids.title} className="text-base">
          {title}
        </CardTitle>
        {description && (
          <p id={ids.desc} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {keyboard && (
          <p id={ids.keys} className="sr-only">
            {t('charts.a11y.keys')}
          </p>
        )}
      </CardHeader>
      {/* Recharts 3 makes the chart focusable (keyboard navigation). A mouse
          click would focus it too, drawing the browser's focus ring and
          pinning the tooltip on the first item; keep clicks on the chart from
          moving focus. Only on the chart: the list cards (recently removed,
          tag cloud) keep their scrollbar drag and text selection. */}
      <CardContent
        className={cn('h-72', contentClassName)}
        onMouseDown={(e) => {
          if ((e.target as Element).closest('.recharts-wrapper')) e.preventDefault()
        }}
      >
        <ChartAnnounce.Provider value={announce}>{children}</ChartAnnounce.Provider>
        <p ref={live} className="sr-only" aria-live="polite" aria-atomic="true" />
      </CardContent>
      {table && <ChartTable title={title} {...table} />}
    </Card>
  )
}

/** A closed <details> under the chart; the table is only built once it is opened. */
function ChartTable({ title, label, value, rows, formatKey }: ChartTableData & { title: string }) {
  const t = useT()
  const fmt = useFormat()
  const [open, setOpen] = useState(false)
  const shares = rows.some((row) => row.share !== null)
  return (
    <details className="border-t px-5 py-3 text-sm" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
        {t('charts.table.show')}
      </summary>
      {open && (
        // Scrolls on its own (the game count has a row per day); focusable so the keyboard can scroll it.
        <div tabIndex={0} role="region" aria-label={title} className="mt-2 max-h-72 overflow-y-auto">
          <table className="w-full border-collapse text-xs">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="py-1.5 pr-3 text-left font-medium">
                  {label}
                </th>
                <th scope="col" className="py-1.5 pl-3 text-right font-medium">
                  {value}
                </th>
                {shares && (
                  <th scope="col" className="py-1.5 pl-3 text-right font-medium">
                    {t('charts.table.share')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b last:border-b-0">
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                    {formatKey ? formatKey(row.key) : row.key}
                  </th>
                  <td className="py-1.5 pl-3 text-right font-mono tabular-nums">{fmt.number(row.count)}</td>
                  {shares && (
                    <td className="py-1.5 pl-3 text-right font-mono tabular-nums">
                      {row.share === null ? '' : fmt.percent(row.share)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  )
}
