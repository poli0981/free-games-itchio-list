/**
 * Labels for the creator's generative-AI disclosure (`Game.ai_disclosure`).
 * The pipeline stores itch.io's wording ("AI Assisted") or its own short
 * forms ("No AI", "N/A"); the UI translates the values it knows and shows
 * anything new as itch.io wrote it.
 */
import { AI_ASSISTED, AI_NONE, AI_UNDISCLOSED } from './game-filters'
import type { MessageKey } from './i18n'

const LABEL: Record<string, MessageKey> = {
  [AI_NONE]: 'ai.none',
  [AI_ASSISTED]: 'ai.assisted',
  [AI_UNDISCLOSED]: 'ai.undisclosed',
}

export function aiLabel(value: string, t: (key: MessageKey) => string): string {
  const key = LABEL[value]
  return key ? t(key) : value
}
