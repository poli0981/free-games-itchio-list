import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Density = 'compact' | 'normal'
type Language = 'en' | 'vi'

export const IDLE_TIMEOUT_OPTIONS = [5, 15, 30, 60, 120] as const

export const NOTIFICATION_DURATION_OPTIONS = [2_000, 4_000, 6_000, 10_000] as const

interface PrefsStore {
  sidebarCollapsed: boolean
  density: Density
  language: Language
  notificationsEnabled: boolean
  notificationDurationMs: number
  idleTimeoutMs: number
  authorName: string
  authorEmail: string
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setDensity: (d: Density) => void
  setLanguage: (l: Language) => void
  setNotificationsEnabled: (v: boolean) => void
  setNotificationDurationMs: (v: number) => void
  setIdleTimeoutMs: (v: number) => void
  setAuthorName: (v: string) => void
  setAuthorEmail: (v: string) => void
}

const DEFAULT_IDLE_MS = 30 * 60 * 1000

export const usePrefs = create<PrefsStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      density: 'normal',
      language: 'en',
      notificationsEnabled: true,
      notificationDurationMs: 4_000,
      idleTimeoutMs: DEFAULT_IDLE_MS,
      authorName: '',
      authorEmail: '',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setDensity: (d) => set({ density: d }),
      setLanguage: (l) => set({ language: l }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setNotificationDurationMs: (v) => set({ notificationDurationMs: v }),
      setIdleTimeoutMs: (v) => set({ idleTimeoutMs: v }),
      setAuthorName: (v) => set({ authorName: v }),
      setAuthorEmail: (v) => set({ authorEmail: v }),
    }),
    { name: 'webapp.prefs' },
  ),
)
