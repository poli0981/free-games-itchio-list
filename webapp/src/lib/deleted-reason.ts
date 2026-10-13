import type { MessageKey } from '@/lib/i18n'

/**
 * The reasons the admin offers for a removal. They are public (the Removed page,
 * scripts/deleted_games.json) and each has a translated label there; the first
 * two use the pipeline's own wording.
 */
export const REMOVAL_REASONS = [
  'Game became paid',
  'Game page no longer exists',
  'Removed at the creator’s request',
  'Duplicate of another entry',
  'Not a game',
  'Broken or unplayable',
  'Reported as malware',
] as const

const PRESET_KEYS: Record<(typeof REMOVAL_REASONS)[number], MessageKey> = {
  'Game became paid': 'deleted.reason.paid',
  'Game page no longer exists': 'deleted.reason.gone',
  'Removed at the creator’s request': 'deleted.reason.request',
  'Duplicate of another entry': 'deleted.reason.duplicate',
  'Not a game': 'deleted.reason.notGame',
  'Broken or unplayable': 'deleted.reason.broken',
  'Reported as malware': 'deleted.reason.malware',
}

/** The standard removal reasons get a translated label; anything else is shown as written. */
export function reasonKey(reason: string): MessageKey | null {
  const preset = PRESET_KEYS[reason as keyof typeof PRESET_KEYS]
  if (preset) return preset
  if (/no longer exists|HTTP 4(?:04|10)/i.test(reason)) return 'deleted.reason.gone'
  if (/became paid/i.test(reason)) return 'deleted.reason.paid'
  if (/password-protected/i.test(reason)) return 'deleted.reason.private'
  return null
}
