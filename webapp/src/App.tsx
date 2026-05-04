import { Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/sidebar'
import Dashboard from '@/routes/dashboard'
import Games from '@/routes/games'
import GameDetail from '@/routes/game-detail'
import Add from '@/routes/add'
import Charts from '@/routes/charts'
import Workflows from '@/routes/workflows'
import Deleted from '@/routes/deleted'
import Settings from '@/routes/settings'
import NotFound from '@/routes/not-found'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/:slug" element={<GameDetail />} />
          <Route path="/add" element={<Add />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/deleted" element={<Deleted />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
