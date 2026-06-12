import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'

interface ScrollToTopProps {
  // The scroll container to watch — the app scrolls <main>, not window.
  targetRef: React.RefObject<HTMLElement | null>
}

export default function ScrollToTop({ targetRef }: ScrollToTopProps) {
  const t = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const onScroll = () => setVisible(el.scrollTop > 400)
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [targetRef])

  if (!visible) return null

  return (
    <Button
      size="icon"
      aria-label={t('common.scrollToTop')}
      onClick={() => targetRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full shadow-lg"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
