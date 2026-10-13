import { createElement, lazy, type ComponentType, type ReactElement } from 'react'

export interface Preloadable<P> {
  (props: P): ReactElement
  /** Start (or join) loading the code; resolves once it is in. */
  preload: () => Promise<unknown>
}

/**
 * React.lazy that can be loaded ahead of time. Once the code is in, the
 * component renders directly — no Suspense fallback, which React 19 would show
 * for at least 300 ms even for a chunk already in the cache. The element type
 * switches from the lazy wrapper to the module only before anything of it was
 * committed (a suspended render commits nothing), so nothing re-mounts.
 */
export function lazyWithPreload<P extends object>(load: () => Promise<{ default: ComponentType<P> }>): Preloadable<P> {
  let loaded: ComponentType<P> | undefined
  let pending: Promise<unknown> | undefined
  const preload = () => {
    pending ??= load().then(
      (m) => {
        loaded = m.default
      },
      (error: unknown) => {
        pending = undefined // a failed download can be retried
        throw error
      },
    )
    return pending
  }
  const Lazy = lazy(async () => {
    await preload()
    return { default: loaded as ComponentType<P> }
  })
  const Component = (props: P) => createElement((loaded ?? Lazy) as ComponentType<P>, props)
  return Object.assign(Component, { preload })
}

/** Run `fn` when the browser is idle (Safari has no requestIdleCallback); returns a cancel function. */
export function whenIdle(fn: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: 2000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(fn, 1200)
  return () => window.clearTimeout(id)
}
