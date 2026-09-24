/**
 * Cloudflare Turnstile's server-side check (siteverify), shared by the Suggest
 * form and the verification gate. A token is single-use and valid for 300 s.
 * The widget's `action` must match, so a token minted on one page cannot be
 * spent on the other, and the hostname must be ours.
 */

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

type TurnstileAction = 'gate' | 'suggest'

/**
 * - ok: a person passed the widget on our site, for this action.
 * - rejected: the token is invalid, spent, or was issued elsewhere.
 * - unavailable: siteverify could not answer (timeout, 5xx, bad secret).
 */
export type SiteverifyOutcome = 'ok' | 'rejected' | 'unavailable'

export interface SiteverifyInput {
  secret: string
  token: string
  /** The visitor's IP (cf-connecting-ip), '' when unknown. */
  ip: string
  action: TurnstileAction
  /** Hostname the widget must have run on (SITE_ORIGIN's). */
  hostname: string
}

/** Turnstile's documented test secrets (1x… always passes, 2x… fails, 3x… "already spent"). */
export function isTestSecret(secret: string): boolean {
  return /^[123]x0+AA$/.test(secret)
}

export async function siteverify(
  input: SiteverifyInput,
  fetcher: typeof fetch,
  timeoutMs = 5000,
): Promise<SiteverifyOutcome> {
  const form = new FormData()
  form.set('secret', input.secret)
  form.set('response', input.token)
  if (input.ip) form.set('remoteip', input.ip)
  let outcome: { success?: unknown; hostname?: unknown; action?: unknown; 'error-codes'?: unknown }
  try {
    const res = await fetcher(SITEVERIFY, { method: 'POST', body: form, signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return 'unavailable'
    outcome = await res.json()
  } catch {
    return 'unavailable'
  }
  if (outcome?.success !== true) {
    const codes = Array.isArray(outcome?.['error-codes']) ? (outcome['error-codes'] as unknown[]) : []
    if (codes.some((c) => c === 'missing-input-secret' || c === 'invalid-input-secret')) {
      console.error('turnstile: the secret key was refused')
      return 'unavailable'
    }
    return codes.includes('internal-error') ? 'unavailable' : 'rejected'
  }
  // The test secrets answer with placeholder hostname and action values.
  if (isTestSecret(input.secret)) return 'ok'
  return outcome.hostname === input.hostname && outcome.action === input.action ? 'ok' : 'rejected'
}
