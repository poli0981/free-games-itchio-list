import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUndo } from '@/stores/undo'
import { useState } from 'react'

export function UndoTray() {
  const ops = useUndo((s) => s.ops)
  const remove = useUndo((s) => s.remove)
  const [pending, setPending] = useState<string | null>(null)

  if (ops.length === 0) return null

  async function runUndo(id: string) {
    const op = ops.find((o) => o.id === id)
    if (!op) return
    setPending(id)
    try {
      await op.reverse()
      toast.success(`Undone: ${op.label}`)
      remove(id)
    } catch (e) {
      toast.error(`Undo failed: ${(e as Error).message}`)
    } finally {
      setPending(null)
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-wrap items-center gap-2 p-3 text-sm">
        <Undo2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Recent commits:</span>
        {ops.slice(0, 3).map((o) => (
          <Button
            key={o.id}
            variant="outline"
            size="sm"
            disabled={pending === o.id}
            onClick={() => runUndo(o.id)}
            title={`Created ${new Date(o.timestamp).toLocaleString()}`}
          >
            <Undo2 className="h-3 w-3" />
            {pending === o.id ? 'Undoing...' : `Undo: ${o.label}`}
          </Button>
        ))}
        {ops.length > 3 && (
          <span className="text-xs text-muted-foreground">+ {ops.length - 3} older</span>
        )}
      </CardContent>
    </Card>
  )
}
