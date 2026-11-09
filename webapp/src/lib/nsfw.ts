import { create } from 'zustand'
import type { Game } from '@/types/game'

/** Games the maintainer marked 18+ are hidden until the visitor opts in. */
export function isNsfw(game: Pick<Game, 'nsfw'>): boolean {
  return game.nsfw === 'Yes'
}

/**
 * Whether the 18+ confirmation dialog (components/nsfw-dialog.tsx) is open,
 * and where focus goes when it closes (null: back to the control that opened it).
 */
export const useNsfwPrompt = create<{ open: boolean; returnFocus: HTMLElement | null }>(() => ({
  open: false,
  returnFocus: null,
}))

/**
 * Ask the visitor to confirm they are 18 or older before 18+ games are shown.
 * An in-app dialog, not window.confirm (the macOS app's WebKit answers "Cancel").
 * `returnFocus`: where focus goes afterwards when the opener itself goes away
 * (a switch inside a popover that closes).
 */
export function requestNsfw(returnFocus: HTMLElement | null = null): void {
  useNsfwPrompt.setState({ open: true, returnFocus })
}
