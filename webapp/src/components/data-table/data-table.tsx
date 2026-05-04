import { useMemo, useRef } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'

const ROW_HEIGHT = 56

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  globalFilter: string
  onGlobalFilterChange: (v: string) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (v: ColumnFiltersState) => void
  sorting: SortingState
  onSortingChange: (v: SortingState) => void
  globalFilterFn: (row: TData, query: string) => boolean
  rowKey: (row: TData) => string
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
  globalFilterFn,
  rowKey,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, sorting, globalFilter },
    onGlobalFilterChange: (updater) =>
      onGlobalFilterChange(typeof updater === 'function' ? updater(globalFilter) : updater),
    onColumnFiltersChange: (updater) =>
      onColumnFiltersChange(
        typeof updater === 'function' ? updater(columnFilters) : updater,
      ),
    onSortingChange: (updater) =>
      onSortingChange(typeof updater === 'function' ? updater(sorting) : updater),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
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

  return (
    <div className="rounded-md border bg-card">
      <div ref={parentRef} className="relative max-h-[calc(100vh-220px)] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_hsl(var(--border))]">
            {headerGroups.map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="h-10 px-3 text-left align-middle font-medium text-muted-foreground"
                    style={{ width: h.getSize() ? `${h.getSize()}px` : undefined }}
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
                        className="px-3 align-middle"
                        style={{
                          width: cell.column.getSize()
                            ? `${cell.column.getSize()}px`
                            : undefined,
                          flex: cell.column.getSize() ? '0 0 auto' : '1 1 0',
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
  )
}
