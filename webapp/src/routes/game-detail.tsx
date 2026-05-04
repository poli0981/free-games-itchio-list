import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function GameDetail() {
  const { slug } = useParams()
  return (
    <div className="container mx-auto p-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/games">
          <ArrowLeft className="h-4 w-4" />
          Back to games
        </Link>
      </Button>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Game Detail</h1>
      <p className="text-sm text-muted-foreground">slug: {slug}</p>
      <p className="mt-4 text-muted-foreground">
        23-field view with 3 editable fields (safe_virus, notes, nsfw) — Phase 2.
      </p>
    </div>
  )
}
