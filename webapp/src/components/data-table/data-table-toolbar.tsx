import { X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FacetedFilter, type FacetOption } from './faceted-filter'
import type { Table } from '@tanstack/react-table'
import { useT } from '@/lib/i18n'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  globalFilter: string
  onGlobalFilterChange: (v: string) => void
  facets: Array<{ columnId: string; title: string; options: FacetOption[] }>
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  facets,
}: DataTableToolbarProps<TData>) {
  const t = useT()
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[240px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('table.searchPlaceholder')}
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="h-9 pl-9"
        />
      </div>
      {facets.map(({ columnId, title, options }) => (
        <FacetedFilter
          key={columnId}
          column={table.getColumn(columnId)}
          title={title}
          options={options}
        />
      ))}
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            table.resetColumnFilters()
            onGlobalFilterChange('')
          }}
        >
          {t('table.reset')}
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
