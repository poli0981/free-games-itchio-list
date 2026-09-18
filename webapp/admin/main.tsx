import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@/index.css'
import { AdminApp } from './app'
import { SessionExpired, markSessionExpired } from './api'

// Follow the system theme (the admin has no settings of its own).
const dark = window.matchMedia('(prefers-color-scheme: dark)')
const applyTheme = () => document.documentElement.classList.toggle('dark', dark.matches)
applyTheme()
dark.addEventListener('change', applyTheme)

const onError = (error: unknown) => {
  if (error instanceof SessionExpired) markSessionExpired()
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => !(error instanceof SessionExpired) && count < 1,
    },
  },
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AdminApp />
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)
