import { create } from 'zustand'

interface UndoEntry {
  id: string
  label: string
  timestamp: number
  reverse: () => Promise<void>
}

const MAX_UNDO = 20

interface UndoStore {
  ops: UndoEntry[]
  push: (op: UndoEntry) => void
  remove: (id: string) => void
  clear: () => void
}

export const useUndo = create<UndoStore>()((set) => ({
  ops: [],
  push: (op) =>
    set((s) => {
      const next = [op, ...s.ops]
      return { ops: next.slice(0, MAX_UNDO) }
    }),
  remove: (id) => set((s) => ({ ops: s.ops.filter((o) => o.id !== id) })),
  clear: () => set({ ops: [] }),
}))
