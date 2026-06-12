import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUndo } from '@/stores/undo'
import { useState } from 'react'
import { useT } from '@/lib/i18n'

export function UndoTray() {
  const t = useT()
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
      toast.success(t('undo.toast.done', { label: op.label }))
      remove(id)
    } catch (e) {
      toast.error(t('undo.toast.failed', { message: (e as Error).message }))
    } finally {
      setPending(null)
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-wrap items-center gap-2 p-3 text-sm">
        <Undo2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{t('undo.recentCommits')}</span>
        {ops.slice(0, 3).map((o) => (
          <Button
            key={o.id}
            variant="outline"
            size="sm"
            disabled={pending === o.id}
            onClick={() => runUndo(o.id)}
            title={t('undo.createdAt', { date: new Date(o.timestamp).toLocaleString() })}
          >
            <Undo2 className="h-3 w-3" />
            {pending === o.id ? t('undo.undoing') : t('undo.action', { label: o.label })}
          </Button>
        ))}
        {ops.length > 3 && (
          <span className="text-xs text-muted-foreground">{t('undo.older', { count: ops.length - 3 })}</span>
        )}
      </CardContent>
    </Card>
  )
}
