// DOM helpers for moving keyboard focus where a screen reader should start
// reading: the new page's heading after a navigation, a #section, or back to
// the control a dialog was opened from. Kept out of src/lib (they need a DOM).

/**
 * Calls `found` with what `find` returns, right away or as soon as it appears
 * inside <main> (routes are lazy chunks; on a slow connection their content
 * can take seconds). Gives up after `timeout` ms and calls `missing`, if
 * given. Returns a cancel.
 */
export function whenPresent<T extends Element>(
  find: () => T | null,
  found: (el: T) => void,
  { timeout = 10_000, missing }: { timeout?: number; missing?: () => void } = {},
): () => void {
  const now = find()
  if (now) {
    found(now)
    return () => {}
  }
  const observer = new MutationObserver(() => {
    const el = find()
    if (!el) return
    stop()
    found(el)
  })
  const timer = window.setTimeout(() => {
    stop()
    missing?.()
  }, timeout)
  function stop() {
    observer.disconnect()
    window.clearTimeout(timer)
  }
  observer.observe(document.getElementById('main') ?? document.body, { childList: true, subtree: true })
  return stop
}

/**
 * Focuses an element without scrolling. One that can't take focus by itself
 * (a heading, a section; links and buttons can) gets tabindex=-1 and
 * `data-focus-target`, which hides the focus ring there (index.css): it marks
 * where reading starts, it isn't a control.
 */
export function focusElement(el: HTMLElement): void {
  if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1')
    el.setAttribute('data-focus-target', '')
  }
  el.focus({ preventScroll: true })
}

/** The current page's h1. */
export function pageHeading(): HTMLElement | null {
  return document.querySelector<HTMLElement>('#main h1')
}

/** Focus the page's h1, or <main> while there is none (a loading page). */
export function focusPageHeading(): void {
  const el = pageHeading() ?? document.getElementById('main')
  if (el) focusElement(el)
}

/**
 * True while focus is still where it was when a wait started (or nowhere):
 * a late focus move must not pull the visitor back from where they went.
 */
export function focusUntouchedSince(before: Element | null): boolean {
  const now = document.activeElement
  return now === before || now === null || now === document.body
}

/** Smooth scrolling, unless the visitor asked the system for less motion. */
export function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}
