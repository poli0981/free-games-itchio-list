/**
 * What this session changed in the catalog. The published data the Catalog
 * and New games pages read lags the repository until the next build, so
 * edits and removals made here are layered on top of it until a reload.
 */
import { create } from 'zustand'
import type { Game } from '@/types/game'
import type { GameEdit } from './api'

interface OverridesState {
  edits: Map<string, GameEdit>
  removed: Set<string>
}

export const useOverrides = create<OverridesState>(() => ({ edits: new Map(), removed: new Set() }))

export function rememberEdits(edits: { url: string; edit: GameEdit }[]): void {
  useOverrides.setState((s) => {
    const next = new Map(s.edits)
    for (const { url, edit } of edits) next.set(url, { ...next.get(url), ...edit })
    return { edits: next }
  })
}

export function rememberRemoved(urls: string[]): void {
  useOverrides.setState((s) => ({ removed: new Set([...s.removed, ...urls]) }))
}

/** A game as the repository holds it now, as far as this session knows. */
export function withEdits(game: Game, edits: Map<string, GameEdit>): Game {
  const edit = edits.get(game.url)
  return edit ? { ...game, ...edit } : game
}
