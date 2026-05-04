import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PrefsStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
}

export const usePrefs = create<PrefsStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    { name: 'webapp.prefs' },
  ),
)
