import { Toaster } from 'sonner'
import { usePrefs } from '@/stores/prefs'

export function AppToaster() {
  const enabled = usePrefs((s) => s.notificationsEnabled)
  const duration = usePrefs((s) => s.notificationDurationMs)
  if (!enabled) return null
  return <Toaster richColors position="top-right" duration={duration} />
}
