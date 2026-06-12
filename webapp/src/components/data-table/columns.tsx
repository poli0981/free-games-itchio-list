import { Link } from 'react-router-dom'
import type { ColumnDef, FilterFn, RowData } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { GameThumb } from '@/components/game-thumb'
import type { Game } from '@/types/game'
import { slugify } from '@/lib/utils'
import { t } from '@/lib/i18n'
import { SortableHeader } from './sortable-header'

declare module '@tanstack/react-table' {
  // priority 1 — always visible. priority 2 — visible at md+. priority 3 — visible at lg+.
  // Read in data-table.tsx to apply Tailwind responsive hiding to the <th>/<td> wrapper.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    priority?: 1 | 2 | 3
  }
}

const arrayIncludesAny: FilterFn<Game> = (row, columnId, filterValue) => {
  const cell = row.getValue(columnId) as string | string[] | undefined
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true
  if (Array.isArray(cell)) return cell.some((v) => filterValue.includes(v))
  if (typeof cell === 'string') return filterValue.includes(cell)
  return false
}

export const gameColumns: ColumnDef<Game>[] = [
  {
    id: 'select',
    enableSorting: false,
    enableColumnFilter: false,
    size: 40,
    meta: { priority: 1 },
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
        aria-label={t('table.selectAll')}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label={t('table.selectRow')}
      />
    ),
  },
  {
    id: 'thumbnail',
    accessorKey: 'thumbnail',
    header: '',
    enableSorting: false,
    enableColumnFilter: false,
    size: 80,
    meta: { priority: 1 },
    cell: ({ row }) => (
      <GameThumb
        src={row.original.thumbnail}
        alt=""
        width={64}
        height={40}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="h-10 w-16 rounded object-cover"
      />
    ),
  },
  {
    id: 'name',
    accessorKey: 'name',
    meta: { priority: 1 },
    header: ({ column }) => (
      <SortableHeader
        label={t('table.name')}
        sorted={column.getIsSorted()}
        onClick={(e) => column.toggleSorting(undefined, e.shiftKey)}
      />
    ),
    cell: ({ row }) => (
      <Link
        to={`/games/${encodeURIComponent(slugify(row.original.url))}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: 'dev',
    accessorKey: 'dev',
    meta: { priority: 3 },
    header: ({ column }) => (
      <SortableHeader
        label={t('table.dev')}
        sorted={column.getIsSorted()}
        onClick={(e) => column.toggleSorting(undefined, e.shiftKey)}
      />
    ),
    cell: ({ row }) => (
      <span className="line-clamp-1 text-sm text-muted-foreground">{row.original.dev}</span>
    ),
  },
  {
    id: 'genre',
    accessorKey: 'genre',
    header: () => t('table.genre'),
    meta: { priority: 2 },
    filterFn: arrayIncludesAny,
    cell: ({ row }) => <Badge variant="secondary">{row.original.genre || t('common.unknown')}</Badge>,
  },
  {
    id: 'platforms',
    accessorKey: 'platforms',
    header: () => t('table.platforms'),
    enableSorting: false,
    meta: { priority: 3 },
    filterFn: arrayIncludesAny,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {(row.original.platforms ?? []).slice(0, 4).map((p) => (
          <Badge key={p} variant="outline" className="text-xs">
            {p}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    id: 'rating',
    accessorKey: 'rating',
    meta: { priority: 2 },
    header: ({ column }) => (
      <SortableHeader
        label={t('table.rating')}
        sorted={column.getIsSorted()}
        onClick={(e) => column.toggleSorting(undefined, e.shiftKey)}
      />
    ),
    sortingFn: (a, b) => {
      const ra = parseFloat(a.original.rating) || 0
      const rb = parseFloat(b.original.rating) || 0
      return ra - rb
    },
    cell: ({ row }) => (
      <div className="text-right text-sm tabular-nums">
        {row.original.rating || '—'}
        <div className="text-xs text-muted-foreground">
          {row.original.rating_count ? `(${row.original.rating_count})` : ''}
        </div>
      </div>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => t('table.status'),
    meta: { priority: 3 },
    filterFn: arrayIncludesAny,
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Released' ? 'default' : 'secondary'}>
        {row.original.status || t('common.unknown')}
      </Badge>
    ),
  },
  {
    id: 'nsfw',
    accessorKey: 'nsfw',
    header: () => t('table.nsfw'),
    meta: { priority: 2 },
    filterFn: arrayIncludesAny,
    cell: ({ row }) =>
      row.original.nsfw === 'Yes' ? (
        <Badge variant="destructive">NSFW</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">{t('common.no')}</span>
      ),
  },
  {
    id: 'safe_virus',
    accessorKey: 'safe_virus',
    header: () => t('table.safe'),
    meta: { priority: 3 },
    filterFn: arrayIncludesAny,
    cell: ({ row }) => (
      <span className="text-xs">{row.original.safe_virus || '?'}</span>
    ),
  },
]
