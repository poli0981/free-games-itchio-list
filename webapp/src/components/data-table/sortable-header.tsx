import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SortableHeaderProps {
  label: string
  sorted: false | 'asc' | 'desc'
  onClick: (e: React.MouseEvent) => void
}

export function SortableHeader({ label, sorted, onClick }: SortableHeaderProps) {
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
