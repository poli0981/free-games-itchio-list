import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Sidebar, MobileTopBar } from '@/components/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useThemeEffect } from '@/hooks/useThemeEffect'
import { useDensityEffect } from '@/hooks/useDensityEffect'
import Dashboard from '@/routes/dashboard'
import Games from '@/routes/games'
import Deleted from '@/routes/deleted'
import NotFound from '@/routes/not-found'

const GameDetail = lazy(() => import('@/routes/game-detail'))
const Add = lazy(() => import('@/routes/add'))
const Charts = lazy(() => import('@/routes/charts'))
const Workflows = lazy(() => import('@/routes/workflows'))
const Settings = lazy(() => import('@/routes/settings'))
const About = lazy(() => import('@/routes/about'))

function RouteFallback() {
  return (
    <div className="container mx-auto space-y-3 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[60vh]" />
    </div>
  )
}

function ScrollToHash() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 })
      return
    }
    const id = hash.slice(1)
    const tryScroll = () => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    requestAnimationFrame(tryScroll)
  }, [hash, pathname])
  return null
}

export default function App() {
  useThemeEffect()
  useDensityEffect()
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <ScrollToHash />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/:slug" element={<GameDetail />} />
              <Route path="/add" element={<Add />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/deleted" element={<Deleted />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
