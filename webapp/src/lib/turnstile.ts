/**
 * Cloudflare Turnstile, loaded on demand (in the app only the Suggest page needs it; the
 * site CSP allows its script and frame). Explicit rendering, so the widget
 * mounts and unmounts with the React component.
 */

interface TurnstileOptions {
  sitekey: string
  action?: string
  theme?: 'auto' | 'light' | 'dark'
  callback: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileOptions): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<TurnstileApi> | null = null

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')))
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Turnstile did not load'))
    }
    document.head.appendChild(script)
  })
  return loading
}
