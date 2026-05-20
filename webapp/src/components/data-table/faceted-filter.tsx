import { useMemo } from 'react'
import type { Column } from '@tanstack/react-table'
import { Check, PlusCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface FacetOption {
  value: string
  label: string
  count: number
}

interface FacetedFilterProps<TData> {
  column?: Column<TData, unknown>
  title: string
  options: FacetOption[]
}

export function FacetedFilter<TData>({ column, title, options }: FacetedFilterProps<TData>) {
  const rawFilterValue = column?.getFilterValue() as string[] | undefined
  const selected = useMemo(() => new Set(rawFilterValue ?? []), [rawFilterValue])

  function toggle(value: string) {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    column?.setFilterValue(next.size ? Array.from(next) : undefined)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <PlusCircle className="h-4 w-4" />
          {title}
          {selected.size > 0 && (
            <>
              <span className="mx-1 h-4 w-px bg-border" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selected.size}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="border-b p-2">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {options.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No options</p>
          ) : (
            options.map((opt) => {
              const isSelected = selected.has(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
                    isSelected && 'bg-accent/50',
                  )}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                  <span className="flex-1 truncate">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.count}</span>
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              )
            })
          )}
        </div>
        {selected.size > 0 && (
          <div className="border-t p-1">
            <button
              type="button"
              onClick={() => column?.setFilterValue(undefined)}
              className="w-full rounded-sm px-2 py-1.5 text-center text-sm hover:bg-accent"
            >
              Clear filters
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
