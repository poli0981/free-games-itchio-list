import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryCache, QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'
import App from './App'
import { AppRouter } from './components/app-router'
import { APP } from './lib/about'
import { CATALOG_KEY, isStaleDescription, shouldPersistQuery, type Catalog } from './lib/data/catalog'
import { createBinaryPersister } from './lib/data/persister'
import { watchGate } from './lib/gate'
import { initI18n } from './lib/i18n'
import { isTauri } from './lib/runtime'
import { clearLegacyCredentials, redirectLegacyHashRoute } from './lib/legacy'
import { guardedReload } from './lib/reload'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './index.css'

// Catalog data persisted to IndexedDB survives restarts for up to a week —
// instant paint from cache, then background revalidation. gcTime must be
// >= maxAge or restored queries are garbage-collected right after hydration.
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    // A new catalog names new description packs: drop the old ones nobody shows.
    onSuccess: (data, query) => {
      if (query.queryKey[0] !== CATALOG_KEY[0]) return
      queryClient.removeQueries({
        predicate: (q) => isStaleDescription(q.queryKey, data as Catalog) && q.getObserversCount() === 0,
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: CACHE_MAX_AGE,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

// Stored compressed (lib/data/persister.ts): not readable JSON in DevTools.
const persister = createBinaryPersister({ key: 'webapp.query-cache', store: { get, set, del } })

// Bump the suffix only when the cached data changes shape — not per data
// update (freshness comes from staleTime + manifest revalidation).
const CACHE_BUSTER = `${APP.version}:data-v2`

clearLegacyCredentials()
if (!isTauri()) {
  redirectLegacyHashRoute()
  watchGate()
}

// A deploy replaces hashed chunk files; a tab opened before it would fail to
// lazy-load a route. Reload to pick up the new build — at most once per 30 s,
// so a chunk that still fails after the reload shows the error page (with its
// Reload button) instead of looping.
window.addEventListener('vite:preloadError', (event) => {
  if (guardedReload()) event.preventDefault()
})

initI18n()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE,
        buster: CACHE_BUSTER,
        dehydrateOptions: {
          // The public catalog queries, and only the descriptions the current catalog names.
          shouldDehydrateQuery: (q) =>
            q.state.status === 'success' &&
            shouldPersistQuery(q.queryKey, queryClient.getQueryData<Catalog>(CATALOG_KEY)),
        },
      }}
    >
      <AppRouter>
        <App />
      </AppRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </PersistQueryClientProvider>
  </StrictMode>,
)
