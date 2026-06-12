import { Component, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorPage } from '@/components/error-page'
import { useT } from '@/lib/i18n'

// Vite emits hashed chunk filenames; after a redeploy the old hashes 404 and
// React.lazy rejects with one of these messages (browser-dependent).
const CHUNK_ERR =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|chunkloaderror/i

function ReloadAction() {
  const t = useT()
  return (
    <Button onClick={() => window.location.reload()}>
      <RotateCw className="h-4 w-4" />
      {t('error.actions.reload')}
    </Button>
  )
}

interface BoundaryState {
  error: Error | null
}

class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const isChunk = CHUNK_ERR.test(error.message)
    return (
      <ErrorPage
        variant={isChunk ? 'chunk' : undefined}
        status={isChunk ? undefined : 500}
        details={error.message}
        actions={<ReloadAction />}
      />
    )
  }
}

/**
 * Route-level boundary: keyed by pathname so navigating away resets it
 * (which also retries a previously failed lazy import).
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <AppErrorBoundary key={location.pathname}>{children}</AppErrorBoundary>
}
