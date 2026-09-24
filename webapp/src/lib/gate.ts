/**
 * Web only. The Worker serves the app only to visitors who passed its
 * verification check (worker/gate.ts); a pass lasts BOT_GATE_TTL_HOURS. A tab
 * kept open past that — or opened before the gate was switched on — would see
 * its covers fail with 403. So when the tab comes back into view (or a cover
 * fails) and the pass may be over, ask the Worker, and reload into the
 * verification page if the pass is gone.
 */
import { guardedReload } from './reload'

/** localStorage: `{until}` (ms), when the current pass runs out; written by the verification page too. */
const HINT_KEY = 'webapp.gate'
const MIN_GAP = 5 * 60_000

export interface GateStatus {
  enabled: boolean
  valid: boolean
  /** Seconds the pass has left. */
  ttl: number
}

export function readHint(raw: string | null): number | null {
  if (!raw) return null
  try {
    const until: unknown = (JSON.parse(raw) as { until?: unknown } | null)?.until
    return typeof until === 'number' && Number.isFinite(until) ? until : null
  } catch {
    return null
  }
}

export function shouldReload(status: GateStatus): boolean {
  return status.enabled && !status.valid
}

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

let lastCheck = 0

/** Ask the Worker whether this browser still has a pass (at most once per 5 minutes). */
export async function recheckGate(): Promise<void> {
  const now = Date.now()
  if (now - lastCheck < MIN_GAP) return
  lastCheck = now
  let status: GateStatus
  try {
    const res = await fetch('/api/verify', { cache: 'no-store', credentials: 'same-origin' })
    if (!res.ok) return
    status = (await res.json()) as GateStatus
  } catch {
    return
  }
  const store = storage()
  if (shouldReload(status)) {
    store?.removeItem(HINT_KEY)
    guardedReload()
    return
  }
  // Gate off, or a pass by other means than the cookie: look again in a while.
  const until = status.enabled && status.ttl > 0 ? now + status.ttl * 1000 : now + MIN_GAP
  try {
    store?.setItem(HINT_KEY, JSON.stringify({ until }))
  } catch {
    /* storage full or blocked: we'll just ask again next time */
  }
}

/** Re-check when the tab is shown again (or restored from the back/forward cache) and the pass may be over. */
export function watchGate(): void {
  const check = () => {
    const until = readHint(storage()?.getItem(HINT_KEY) ?? null)
    if (until === null || Date.now() >= until) void recheckGate()
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) check()
  })
}
