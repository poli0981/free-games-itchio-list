import { create } from 'zustand'
import type { Game } from '@/types/game'

/** Games the maintainer marked 18+ are hidden until the visitor opts in. */
export function isNsfw(game: Pick<Game, 'nsfw'>): boolean {
  return game.nsfw === 'Yes'
}

/** Whether the 18+ confirmation dialog (components/nsfw-dialog.tsx) is open. */
export const useNsfwPrompt = create<{ open: boolean }>(() => ({ open: false }))

/**
 * Ask the visitor to confirm they are 18 or older before 18+ games are shown.
 * An in-app dialog, not window.confirm (the macOS app's WebKit answers "Cancel").
 */
export function requestNsfw(): void {
  useNsfwPrompt.setState({ open: true })
}
