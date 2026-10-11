import type { MessageKey } from '@/lib/i18n'

/** The pipeline's standard removal reasons get a translated label; anything else is shown as written. */
export function reasonKey(reason: string): MessageKey | null {
  if (/no longer exists|HTTP 4(?:04|10)/i.test(reason)) return 'deleted.reason.gone'
  if (/became paid/i.test(reason)) return 'deleted.reason.paid'
  if (/password-protected/i.test(reason)) return 'deleted.reason.private'
  return null
}
