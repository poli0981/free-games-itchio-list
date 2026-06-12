import { ErrorPage } from '@/components/error-page'
import { errorStatus, isNetworkError } from '@/lib/http-error'

interface RouteErrorProps {
  error: unknown
  onRetry?: () => void
}

/** Maps a thrown query/fetch error to the matching full-pane error page. */
export function RouteError({ error, onRetry }: RouteErrorProps) {
  const status = errorStatus(error)
  const message = error instanceof Error ? error.message : String(error)
  return (
    <ErrorPage
      status={status}
      variant={status === undefined && isNetworkError(error) ? 'offline' : undefined}
      details={message}
      onRetry={onRetry}
    />
  )
}
