import { useState } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/utils'

interface SyncButtonProps {
  className?: string
  showLabel?: boolean
}

export function SyncButton({ className, showLabel = false }: SyncButtonProps) {
  const qc = useQueryClient()
  const pat = useAuth((s) => s.pat)
  const fetching = useIsFetching({ queryKey: ['db'] })
  const [pending, setPending] = useState(false)
  const busy = pending || fetching > 0

  async function sync() {
    setPending(true)
    try {
      await qc.invalidateQueries({ queryKey: ['db'] })
      await qc.invalidateQueries({ queryKey: ['deleted'] })
      if (pat) {
        await qc.invalidateQueries({ queryKey: ['workflows'] })
        toast.success('Synced (authenticated, bypasses CDN cache)')
      } else {
        toast.success('Synced from CDN (raw.githubusercontent.com)')
      }
    } catch (e) {
      toast.error(`Sync failed: ${(e as Error).message}`)
    } finally {
      setPending(false)
    }
  }

  if (showLabel) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={sync}
        disabled={busy}
        className={cn('w-full justify-start gap-3', className)}
        title={pat ? 'Refresh data (authenticated)' : 'Refresh data (CDN)'}
      >
        <RefreshCw className={cn('h-4 w-4', busy && 'animate-spin')} />
        <span className="text-sm">{busy ? 'Syncing...' : 'Sync data'}</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={sync}
      disabled={busy}
      className={cn('h-8 w-8', className)}
      title={pat ? 'Refresh data (authenticated)' : 'Refresh data (CDN)'}
    >
      <RefreshCw className={cn('h-4 w-4', busy && 'animate-spin')} />
    </Button>
  )
}
