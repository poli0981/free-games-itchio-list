import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
}

export function ChartCard({ title, description, children }: ChartCardProps) {
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
          pinning the tooltip on the first item; keep clicks from moving focus. */}
      <CardContent className="h-72" onMouseDown={(e) => e.preventDefault()}>
        {children}
      </CardContent>
    </Card>
  )
}
