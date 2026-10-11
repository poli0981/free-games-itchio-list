import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  description?: string
  /** Extra classes for the chart area, e.g. a taller one on phones (`max-md:h-96`). */
  contentClassName?: string
  children: React.ReactNode
}

export function ChartCard({ title, description, contentClassName, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      {/* Recharts 3 makes the chart focusable (keyboard navigation). A mouse
          click would focus it too, drawing the browser's focus ring and
          pinning the tooltip on the first item; keep clicks on the chart from
          moving focus. Only on the chart: the list cards (recently removed,
          tag cloud) keep their scrollbar drag and text selection. */}
      <CardContent
        className={cn('h-72', contentClassName)}
        onMouseDown={(e) => {
          if ((e.target as Element).closest('.recharts-wrapper')) e.preventDefault()
        }}
      >
        {children}
      </CardContent>
    </Card>
  )
}
