import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Navigate, Routes, Route, useLocation, useNavigationType } from 'react-router'
import {
  focusElement,
  focusUntouchedSince,
  pageHeading,
  scrollBehavior,
  whenPresent,
} from '@/components/focus-target'
import { LegalGate } from '@/components/legal-gate'
import { NsfwDialog } from '@/components/nsfw-dialog'
import ScrollToTop from '@/components/scroll-to-top'
import { RouteErrorBoundary } from '@/components/error-boundary'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useThemeEffect } from '@/hooks/useThemeEffect'
import { useDensityEffect } from '@/hooks/useDensityEffect'
import { useScrollbarsEffect } from '@/hooks/useScrollbarsEffect'
import { useBackButton } from '@/hooks/useBackButton'
import { useSeoHead } from '@/hooks/useSeoHead'
import { useT } from '@/lib/i18n'
import { hashId, routeFocusTarget, type RouteSpot } from '@/lib/route-focus'
import Welcome from '@/routes/welcome'
import Games from '@/routes/games'
import NotFound from '@/routes/not-found'

const GameDetail = lazy(() => import('@/routes/game-detail'))
const Charts = lazy(() => import('@/routes/charts'))
const Removed = lazy(() => import('@/routes/deleted'))
const Settings = lazy(() => import('@/routes/settings'))
const About = lazy(() => import('@/routes/about'))
const Suggest = lazy(() => import('@/routes/suggest'))
const ErrorPreview = lazy(() => import('@/routes/error-preview'))

function RouteFallback() {
  const t = useT()
  return (
    <div role="status" className="mx-auto max-w-[1120px] space-y-3 px-4 pt-8 sm:px-8">
      <span className="sr-only">{t('common.loading')}</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[60vh]" />
    </div>
  )
}

/**
 * Back / forward return to where that page was scrolled; a new history entry
 * (a link, the Games pager) starts at the top; a #hash scrolls to its section.
 * Replaced entries (Games filters, typed searches) keep the position. The
 * browser's own restoration is off: it runs before React renders.
 *
 * Focus follows the page (lib/route-focus.ts): after a page change it moves
 * to the new h1 (Back: to the link that was used there, e.g. the game row),
 * after a #hash to that section — waiting for lazy routes to render.
 */
function ScrollManager() {
  const { key, pathname, search, hash } = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const lastLinks = useRef(new Map<string, string>())
  const currentKey = useRef(key)
  const lastPath = useRef(pathname)
  const lastSpot = useRef<RouteSpot | null>(null)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    // The key is switched in the layout effect below, before any scroll event of the new page.
    const save = () => positions.current.set(currentKey.current, window.scrollY)
    // The last link focused inside the page, so Back can return there.
    const remember = (e: FocusEvent) => {
      const el = e.target
      if (!(el instanceof HTMLAnchorElement) || !el.closest('#main')) return
      const href = el.getAttribute('href')
      if (href) lastLinks.current.set(currentKey.current, href)
    }
    window.addEventListener('scroll', save, { passive: true })
    document.addEventListener('focusin', remember)
    return () => {
      window.removeEventListener('scroll', save)
      document.removeEventListener('focusin', remember)
    }
  }, [])

  useLayoutEffect(() => {
    currentKey.current = key
    const saved = positions.current.get(key)
    const sectionId = hashId(hash)
    const cancels: (() => void)[] = []
    const target = routeFocusTarget(lastSpot.current, { pathname, search, hash })
    lastSpot.current = { pathname, search, hash }
    const before = document.activeElement
    const focus = (el: HTMLElement) => {
      if (focusUntouchedSince(before)) focusElement(el)
    }
    const focusHeading = () => {
      const main = document.getElementById('main')
      cancels.push(whenPresent(pageHeading, focus, { missing: () => main && focus(main) }))
    }

    const restore = navigationType === 'POP' && saved !== undefined
    if (restore) {
      window.scrollTo(0, saved)
    } else if (!sectionId && (navigationType === 'PUSH' || pathname !== lastPath.current)) {
      window.scrollTo(0, 0)
    }
    lastPath.current = pathname

    if (sectionId && (!restore || target?.kind === 'hash')) {
      cancels.push(
        whenPresent(
          () => document.getElementById(sectionId),
          (el) => {
            if (!restore) el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
            if (target?.kind === 'hash') focus(el)
          },
        ),
      )
    } else if (target?.kind === 'heading') {
      const href = navigationType === 'POP' ? lastLinks.current.get(key) : undefined
      if (href) {
        const link = () => document.querySelector<HTMLAnchorElement>(`#main a[href="${CSS.escape(href)}"]`)
        cancels.push(whenPresent(link, focus, { timeout: 2000, missing: focusHeading }))
      } else {
        focusHeading()
      }
    }
    return () => cancels.forEach((cancel) => cancel())
  }, [key, pathname, search, hash, navigationType])

  return null
}

/** Keyboard users can jump past the header. A button, not a #hash link (HashRouter in the apps). */
function SkipToContent() {
  const t = useT()
  return (
    <button
      type="button"
      onClick={() => document.getElementById('main')?.focus()}
      className="sr-only z-50 rounded-md bg-primary text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-3 focus:py-2"
    >
      {t('common.skipToContent')}
    </button>
  )
}

export default function App() {
  useThemeEffect()
  useDensityEffect()
  useScrollbarsEffect()
  useBackButton()
  useSeoHead()
  return (
    <LegalGate>
      <div className="flex min-h-dvh flex-col pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        <ScrollManager />
        <SkipToContent />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          <RouteErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/games" element={<Games />} />
                <Route path="/games/:slug" element={<GameDetail />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/removed" element={<Removed />} />
                <Route path="/deleted" element={<Navigate to="/removed" replace />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
                <Route path="/suggest" element={<Suggest />} />
                <Route path="/errors/:code" element={<ErrorPreview />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </main>
        <SiteFooter />
        <ScrollToTop />
        <NsfwDialog />
      </div>
    </LegalGate>
  )
}
