import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Density = 'compact' | 'normal'
type Language = 'en' | 'vi'

/**
 * Version stamp for the legal-acceptance gate. Bump this (e.g. after editing a
 * policy in docs/) to re-prompt every user once. Kept in sync with the
 * "Updated …" date in `about.legal.desc`. Stored value !== this → gate shows.
 */
export const LEGAL_VERSION = '2026-09-24'

interface PrefsStore {
  density: Density
  language: Language
  acceptedLegalVersion: string | null
  /** 18+ games are hidden unless the visitor opted in (after confirming their age). */
  showNsfw: boolean
  setDensity: (d: Density) => void
  setLanguage: (l: Language) => void
  acceptLegal: () => void
  setShowNsfw: (v: boolean) => void
}

export const usePrefs = create<PrefsStore>()(
  persist(
    (set) => ({
      density: 'normal',
      language: 'en',
      acceptedLegalVersion: null,
      showNsfw: false,
      setDensity: (d) => set({ density: d }),
      setLanguage: (l) => set({ language: l }),
      acceptLegal: () => set({ acceptedLegalVersion: LEGAL_VERSION }),
      setShowNsfw: (v) => set({ showNsfw: v }),
    }),
    {
      name: 'webapp.prefs',
      // Only these are stored (v3 also kept sidebar and toast settings; the next write drops them).
      partialize: (s) => ({
        density: s.density,
        language: s.language,
        acceptedLegalVersion: s.acceptedLegalVersion,
        showNsfw: s.showNsfw,
      }),
    },
  ),
)
