import { usePrefs } from '@/stores/prefs'
import { t } from '@/lib/i18n'
import type { Game } from '@/types/game'

/** Games the maintainer marked 18+ are hidden until the visitor opts in. */
export function isNsfw(game: Pick<Game, 'nsfw'>): boolean {
  return game.nsfw === 'Yes'
}

/** Ask for the 18+ confirmation, then show adult games on this device. */
export function enableNsfw(): boolean {
  if (!window.confirm(t('nsfw.confirm'))) return false
  usePrefs.getState().setShowNsfw(true)
  return true
}
