import { create } from 'zustand'
import { usePrefs } from './prefs'

const PAT_STORAGE_KEY = 'webapp.pat.encrypted'

export interface GitHubUserInfo {
  login: string
  avatar_url: string
  name?: string | null
}

interface AuthState {
  pat: string | null
  user: GitHubUserInfo | null
  unlockedAt: number | null
  hasStoredPat: boolean
  setPat: (pat: string) => void
  setUser: (user: GitHubUserInfo | null) => void
  lock: () => void
  refreshStoredFlag: () => void
}

export const useAuth = create<AuthState>()((set) => ({
  pat: null,
  user: null,
  unlockedAt: null,
  hasStoredPat: typeof localStorage !== 'undefined' && !!localStorage.getItem(PAT_STORAGE_KEY),
  setPat: (pat) => set({ pat, unlockedAt: Date.now() }),
  setUser: (user) => set({ user }),
  lock: () => set({ pat: null, user: null, unlockedAt: null }),
  refreshStoredFlag: () =>
    set({ hasStoredPat: !!localStorage.getItem(PAT_STORAGE_KEY) }),
}))

export function isIdleExpired(unlockedAt: number | null): boolean {
  if (unlockedAt === null) return true
  const timeoutMs = usePrefs.getState().idleTimeoutMs
  return Date.now() - unlockedAt > timeoutMs
}

export function readEncryptedPat(): string | null {
  return localStorage.getItem(PAT_STORAGE_KEY)
}

export function writeEncryptedPat(packed: string): void {
  localStorage.setItem(PAT_STORAGE_KEY, packed)
}

export function clearEncryptedPat(): void {
  localStorage.removeItem(PAT_STORAGE_KEY)
}
