import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useT } from '@/lib/i18n'

/** Floating "back to top" button once the window has scrolled a screen or so. */
export default function ScrollToTop() {
  const t = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label={t('common.scrollToTop')}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-30 flex size-11 items-center justify-center rounded-full border bg-card text-foreground shadow-lg hover:bg-accent"
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  )
}
