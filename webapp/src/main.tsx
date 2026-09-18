import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'
import App from './App'
import { AppToaster } from './components/app-toaster'
import { AppRouter } from './components/app-router'
import { APP } from './lib/about'
import { initI18n } from './lib/i18n'
import { isTauri } from './lib/runtime'
import { clearLegacyCredentials, redirectLegacyHashRoute } from './lib/legacy'
import './index.css'

// Catalog data persisted to IndexedDB survives restarts for up to a week —
// instant paint from cache, then background revalidation. gcTime must be
// >= maxAge or restored queries are garbage-collected right after hydration.
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: CACHE_MAX_AGE,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

const persister = createAsyncStoragePersister({
  key: 'webapp.query-cache',
  storage: {
    getItem: async (key) => (await get<string>(key)) ?? null,
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  throttleTime: 1_000,
})

// Only the public catalog queries are persisted.
const PERSISTED_KEYS = new Set(['db', 'deleted', 'count-history'])

// Bump the suffix only when the Game schema changes shape — not per data
// update (freshness comes from staleTime + ETag revalidation).
const CACHE_BUSTER = `${APP.version}:data-v1`

clearLegacyCredentials()
if (!isTauri()) redirectLegacyHashRoute()

// A deploy replaces hashed chunk files; a tab opened before it would fail to
// lazy-load a route. Reload once to pick up the new build.
window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem('reloaded-after-deploy')) return
  sessionStorage.setItem('reloaded-after-deploy', '1')
  event.preventDefault()
  window.location.reload()
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
          shouldDehydrateQuery: (q) =>
            q.state.status === 'success' && PERSISTED_KEYS.has(String(q.queryKey[0])),
        },
      }}
    >
      <AppRouter>
        <App />
      </AppRouter>
      <AppToaster />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </PersistQueryClientProvider>
  </StrictMode>,
)
