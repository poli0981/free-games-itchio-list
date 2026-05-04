import { useMemo, useState } from 'react'
import {
  type ColumnFiltersState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { gameColumns } from '@/components/data-table/columns'
import type { FacetOption } from '@/components/data-table/faceted-filter'
import { useAllGames } from '@/hooks/useGames'
import { countBy, countByArray } from '@/lib/analytics'
import { formatNumber } from '@/lib/utils'
import type { Game } from '@/types/game'

function gameSearch(g: Game, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return (
    g.name.toLowerCase().includes(needle) ||
    g.dev.toLowerCase().includes(needle) ||
    g.description.toLowerCase().includes(needle) ||
    g.url.toLowerCase().includes(needle)
  )
}

export default function Games() {
  const games = useAllGames()
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])

  const data = games.data?.games ?? []

  const facets = useMemo(() => {
    if (data.length === 0)
      return [] as Array<{ columnId: string; title: string; options: FacetOption[] }>
    const toOpts = (entries: { key: string; count: number }[]): FacetOption[] =>
      entries.map((e) => ({ value: e.key, label: e.key, count: e.count }))
    return [
      { columnId: 'genre', title: 'Genre', options: toOpts(countBy(data, 'genre')) },
      { columnId: 'status', title: 'Status', options: toOpts(countBy(data, 'status')) },
      {
        columnId: 'platforms',
        title: 'Platforms',
        options: toOpts(countByArray(data, 'platforms')),
      },
      {
        columnId: 'nsfw',
        title: 'NSFW',
        options: [
          { value: 'Yes', label: 'Yes', count: data.filter((g) => g.nsfw === 'Yes').length },
          { value: 'No', label: 'No', count: data.filter((g) => g.nsfw === 'No').length },
        ],
      },
    ]
  }, [data])

  // helper table for toolbar (no virtualization, just for filter state)
  const tableForToolbar = useReactTable({
    data,
    columns: gameColumns,
    state: { columnFilters, sorting, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _id, value) => gameSearch(row.original, String(value ?? '')),
    enableMultiSort: true,
  })

  const filteredCount = tableForToolbar.getFilteredRowModel().rows.length

  if (games.isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        <Skeleton className="h-9" />
        <Skeleton className="h-[60vh]" />
      </div>
    )
  }

  if (games.isError) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Games</h1>
        <p className="text-destructive">Failed to load: {games.error.message}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(filteredCount)} of {formatNumber(data.length)}
        </p>
      </div>

      <div className="mb-3">
        <DataTableToolbar
          table={tableForToolbar}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          facets={facets}
        />
      </div>

      <DataTable
        data={data}
        columns={gameColumns}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilterFn={gameSearch}
        rowKey={(g) => g.url}
      />

      <p className="mt-3 text-xs text-muted-foreground">
        Tip: Shift-click column headers for multi-column sort.
      </p>
    </div>
  )
}
