import { Link } from 'react-router-dom'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Game } from '@/types/game'
import { slugify } from '@/lib/utils'

const arrayIncludesAny: FilterFn<Game> = (row, columnId, filterValue) => {
  const cell = row.getValue(columnId) as string | string[] | undefined
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true
  if (Array.isArray(cell)) return cell.some((v) => filterValue.includes(v))
  if (typeof cell === 'string') return filterValue.includes(cell)
  return false
}

interface SortableHeaderProps {
  label: string
  sorted: false | 'asc' | 'desc'
  onClick: (e: React.MouseEvent) => void
}

function SortableHeader({ label, sorted, onClick }: SortableHeaderProps) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="-ml-3 h-8">
      {label}
      {sorted === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </Button>
  )
}

export const gameColumns: ColumnDef<Game>[] = [
  {
    id: 'thumbnail',
    accessorKey: 'thumbnail',
    header: '',
    enableSorting: false,
    enableColumnFilter: false,
    size: 80,
    cell: ({ row }) =>
      row.original.thumbnail ? (
        <img
          src={row.original.thumbnail}
          alt=""
          loading="lazy"
          className="h-10 w-16 rounded object-cover"
        />
      ) : (
        <div className="h-10 w-16 rounded bg-muted" />
      ),
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader
        label="Name"
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
    header: ({ column }) => (
      <SortableHeader
        label="Dev"
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
    header: 'Genre',
    filterFn: arrayIncludesAny,
    cell: ({ row }) => <Badge variant="secondary">{row.original.genre || 'Unknown'}</Badge>,
  },
  {
    id: 'platforms',
    accessorKey: 'platforms',
    header: 'Platforms',
    enableSorting: false,
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
    header: ({ column }) => (
      <SortableHeader
        label="Rating"
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
    header: 'Status',
    filterFn: arrayIncludesAny,
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Released' ? 'default' : 'secondary'}>
        {row.original.status || 'Unknown'}
      </Badge>
    ),
  },
  {
    id: 'nsfw',
    accessorKey: 'nsfw',
    header: 'NSFW',
    filterFn: arrayIncludesAny,
    cell: ({ row }) =>
      row.original.nsfw === 'Yes' ? (
        <Badge variant="destructive">NSFW</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">No</span>
      ),
  },
  {
    id: 'safe_virus',
    accessorKey: 'safe_virus',
    header: 'Safe',
    filterFn: arrayIncludesAny,
    cell: ({ row }) => (
      <span className="text-xs">{row.original.safe_virus || '?'}</span>
    ),
  },
]
