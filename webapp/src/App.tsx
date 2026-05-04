import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useThemeEffect } from '@/hooks/useThemeEffect'
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

export default function App() {
  useThemeEffect()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
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
  )
}
