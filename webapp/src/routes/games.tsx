import { useMemo, useState } from 'react'
import {
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { MobileCardList } from '@/components/data-table/mobile-card-list'
import { gameColumns } from '@/components/data-table/columns'
import type { FacetOption } from '@/components/data-table/faceted-filter'
import { RouteError } from '@/components/route-error'
import { useAllGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT } from '@/lib/i18n'
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
  const t = useT()
  useDocumentTitle(t('titles.games'))
  const games = useAllGames()
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 100 })

  const data = useMemo(() => games.data?.games ?? [], [games.data])

  const facets = useMemo(() => {
    if (data.length === 0)
      return [] as Array<{ columnId: string; title: string; options: FacetOption[] }>
    const toOpts = (entries: { key: string; count: number }[]): FacetOption[] =>
      entries.map((e) => ({ value: e.key, label: e.key, count: e.count }))
    return [
      { columnId: 'genre', title: t('games.facet.genre'), options: toOpts(countBy(data, 'genre')) },
      { columnId: 'status', title: t('games.facet.status'), options: toOpts(countBy(data, 'status')) },
      {
        columnId: 'platforms',
        title: t('games.facet.platforms'),
        options: toOpts(countByArray(data, 'platforms')),
      },
      {
        columnId: 'nsfw',
        title: t('games.facet.nsfw'),
        options: [
          { value: 'Yes', label: 'Yes', count: data.filter((g) => g.nsfw === 'Yes').length },
          { value: 'No', label: 'No', count: data.filter((g) => g.nsfw === 'No').length },
        ],
      },
    ]
  }, [data, t])

  const tableForToolbar = useReactTable({
    data,
    columns: gameColumns,
    state: { columnFilters, sorting, globalFilter, pagination },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getRowId: (g) => g.url,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _id, value) => gameSearch(row.original, String(value ?? '')),
    enableMultiSort: true,
  })

  const filteredCount = tableForToolbar.getFilteredRowModel().rows.length

  if (games.isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.games')}</h1>
        <Skeleton className="h-9" />
        <Skeleton className="h-[60vh]" />
      </div>
    )
  }

  if (games.isError) {
    return <RouteError error={games.error} onRetry={() => void games.refetch()} />
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.games')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('games.count', { shown: formatNumber(filteredCount), total: formatNumber(data.length) })}
        </p>
      </div>

      <div className="mb-3 space-y-3">
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
        pagination={pagination}
        onPaginationChange={setPagination}
        globalFilterFn={gameSearch}
        rowKey={(g) => g.url}
        getRowId={(g) => g.url}
        renderMobileList={(rows) => <MobileCardList rows={rows} />}
      />

      <p className="mt-3 text-xs text-muted-foreground">
        {t('games.tip')}
      </p>
    </div>
  )
}
