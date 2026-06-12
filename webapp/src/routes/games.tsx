import { useMemo, useState } from 'react'
import {
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { MobileCardList } from '@/components/data-table/mobile-card-list'
import { gameColumns } from '@/components/data-table/columns'
import type { FacetOption } from '@/components/data-table/faceted-filter'
import { BulkEditDialog } from '@/components/bulk-edit-dialog'
import { BulkDeleteDialog } from '@/components/bulk-delete-dialog'
import { RouteError } from '@/components/route-error'
import { UndoTray } from '@/components/undo-tray'
import { useAllGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/stores/auth'
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
  const pat = useAuth((s) => s.pat)
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 100 })
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

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
    state: { columnFilters, sorting, globalFilter, rowSelection, pagination },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    enableRowSelection: true,
    getRowId: (g) => g.url,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _id, value) => gameSearch(row.original, String(value ?? '')),
    enableMultiSort: true,
  })

  const filteredCount = tableForToolbar.getFilteredRowModel().rows.length
  const selectedUrls = useMemo(() => Object.keys(rowSelection).filter((k) => rowSelection[k]), [rowSelection])
  const selectedGames = useMemo(
    () => data.filter((g) => selectedUrls.includes(g.url)),
    [data, selectedUrls],
  )

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
          {selectedUrls.length > 0 && ` — ${t('games.selected', { count: selectedUrls.length })}`}
        </p>
      </div>

      <div className="mb-3 space-y-3">
        <DataTableToolbar
          table={tableForToolbar}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          facets={facets}
        />

        {selectedUrls.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-accent/40 p-2">
            <span className="px-1 text-sm font-medium">{t('games.selected', { count: selectedUrls.length })}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
              disabled={!pat}
              title={pat ? t('games.bulkEditTitle') : t('games.unlockPatFirst')}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('common.edit')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={!pat}
              title={pat ? t('games.bulkDeleteTitle') : t('games.unlockPatFirst')}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('common.delete')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRowSelection({})}>
              {t('games.clearSelection')}
            </Button>
          </div>
        )}

        <UndoTray />
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
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        pagination={pagination}
        onPaginationChange={setPagination}
        globalFilterFn={gameSearch}
        rowKey={(g) => g.url}
        getRowId={(g) => g.url}
        renderMobileList={(rows) => <MobileCardList rows={rows} selectable />}
      />

      <p className="mt-3 text-xs text-muted-foreground">
        {t('games.tip')}
      </p>

      <BulkEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        selected={selectedGames}
        onComplete={() => setRowSelection({})}
      />
      <BulkDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        selected={selectedGames}
        onComplete={() => setRowSelection({})}
      />
    </div>
  )
}
