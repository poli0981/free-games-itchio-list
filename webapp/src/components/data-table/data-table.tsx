import { type ReactNode, useMemo, useRef } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { DataTablePagination } from './data-table-pagination'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/use-is-mobile'

const ROW_HEIGHT = 56

function priorityClass(priority: 1 | 2 | 3 | undefined): string {
  if (priority === 2) return 'hidden md:flex'
  if (priority === 3) return 'hidden lg:flex'
  return ''
}

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  globalFilter: string
  onGlobalFilterChange: (v: string) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (v: ColumnFiltersState) => void
  sorting: SortingState
  onSortingChange: (v: SortingState) => void
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (v: RowSelectionState) => void
  pagination?: PaginationState
  onPaginationChange?: (v: PaginationState) => void
  globalFilterFn: (row: TData, query: string) => boolean
  rowKey: (row: TData) => string
  getRowId?: (row: TData) => string
  renderMobileList?: (rows: Row<TData>[]) => ReactNode
}

export function DataTable<TData>({
  data,
  columns,
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  onColumnFiltersChange,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  pagination,
  onPaginationChange,
  globalFilterFn,
  rowKey,
  getRowId,
  renderMobileList,
}: DataTableProps<TData>) {
  const isMobile = useIsMobile()
  const enablePagination = !!pagination && !!onPaginationChange
  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      sorting,
      globalFilter,
      rowSelection: rowSelection ?? {},
      ...(enablePagination ? { pagination } : {}),
    },
    onGlobalFilterChange: (updater) =>
      onGlobalFilterChange(typeof updater === 'function' ? updater(globalFilter) : updater),
    onColumnFiltersChange: (updater) =>
      onColumnFiltersChange(
        typeof updater === 'function' ? updater(columnFilters) : updater,
      ),
    onSortingChange: (updater) =>
      onSortingChange(typeof updater === 'function' ? updater(sorting) : updater),
    onRowSelectionChange: onRowSelectionChange
      ? (updater) =>
          onRowSelectionChange(
            typeof updater === 'function' ? updater(rowSelection ?? {}) : updater,
          )
      : undefined,
    onPaginationChange: enablePagination
      ? (updater) =>
          onPaginationChange(
            typeof updater === 'function' ? updater(pagination!) : updater,
          )
      : undefined,
    getRowId: getRowId,
    enableRowSelection: !!onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(enablePagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    globalFilterFn: (row, _columnId, filterValue) =>
      globalFilterFn(row.original as TData, String(filterValue ?? '')),
    enableMultiSort: true,
  })

  const rows = table.getRowModel().rows
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })

  const totalHeight = virtualizer.getTotalSize()
  const virtualItems = virtualizer.getVirtualItems()

  const headerGroups = useMemo(() => table.getHeaderGroups(), [table])

  if (isMobile && renderMobileList) {
    return (
      <div className="space-y-2">
        {renderMobileList(rows)}
        {enablePagination && <DataTablePagination table={table} />}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border bg-card">
      <div ref={parentRef} className="scrollbar-hide relative max-h-[calc(100vh-280px)] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_hsl(var(--border))]">
            {headerGroups.map((hg) => (
              <tr key={hg.id} className="flex w-full">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className={cn(
                      'flex h-10 items-center px-3 text-left font-medium text-muted-foreground',
                      priorityClass(h.column.columnDef.meta?.priority),
                    )}
                    style={{
                      width: h.getSize() ? `${h.getSize()}px` : undefined,
                      flex: h.getSize() ? `0 0 ${h.getSize()}px` : '1 1 0',
                    }}
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ height: `${totalHeight}px`, position: 'relative' }}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </td>
              </tr>
            ) : (
              virtualItems.map((vRow) => {
                const row = rows[vRow.index]
                return (
                  <tr
                    key={rowKey(row.original as TData)}
                    data-index={vRow.index}
                    ref={(node) => virtualizer.measureElement(node)}
                    className={cn(
                      'border-b hover:bg-accent/50',
                      'absolute left-0 top-0 flex w-full items-center',
                    )}
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      transform: `translateY(${vRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'flex items-center px-3 align-middle',
                          priorityClass(cell.column.columnDef.meta?.priority),
                        )}
                        style={{
                          width: cell.column.getSize()
                            ? `${cell.column.getSize()}px`
                            : undefined,
                          flex: cell.column.getSize()
                            ? `0 0 ${cell.column.getSize()}px`
                            : '1 1 0',
                          height: `${ROW_HEIGHT}px`,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      </div>
      {enablePagination && <DataTablePagination table={table} />}
    </div>
  )
}
