import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Density = 'compact' | 'normal'
type Language = 'en' | 'vi'

/**
 * Version stamp for the legal-acceptance gate. Bump this (e.g. after editing a
 * policy in docs/) to re-prompt every user once. Kept in sync with the
 * "Updated …" date in `about.legal.desc`. Stored value !== this → gate shows.
 */
export const LEGAL_VERSION = '2026-10-13'

interface PrefsStore {
  density: Density
  language: Language
  acceptedLegalVersion: string | null
  /** 18+ games are hidden unless the visitor opted in (after confirming their age). */
  showNsfw: boolean
  /** Hides every scrollbar (html[data-scrollbars], useScrollbarsEffect); scrolling still works. */
  hideScrollbars: boolean
  /**
   * "/" jumps to the header search. A single-key shortcut must be switchable
   * off (WCAG 2.1.4): speech input and some keyboard setups type it by accident.
   */
  slashShortcut: boolean
  setDensity: (d: Density) => void
  setLanguage: (l: Language) => void
  acceptLegal: () => void
  setShowNsfw: (v: boolean) => void
  setHideScrollbars: (v: boolean) => void
  setSlashShortcut: (v: boolean) => void
}

export const usePrefs = create<PrefsStore>()(
  persist(
    (set) => ({
      density: 'normal',
      language: 'en',
      acceptedLegalVersion: null,
      showNsfw: false,
      hideScrollbars: false,
      slashShortcut: true,
      setDensity: (d) => set({ density: d }),
      setLanguage: (l) => set({ language: l }),
      acceptLegal: () => set({ acceptedLegalVersion: LEGAL_VERSION }),
      setShowNsfw: (v) => set({ showNsfw: v }),
      setHideScrollbars: (v) => set({ hideScrollbars: v }),
      setSlashShortcut: (v) => set({ slashShortcut: v }),
    }),
    {
      name: 'webapp.prefs',
      // Only these are stored (v3 also kept sidebar and toast settings; the next write drops them).
      // A field added later needs no version bump: the stored object is merged over the defaults.
      partialize: (s) => ({
        density: s.density,
        language: s.language,
        acceptedLegalVersion: s.acceptedLegalVersion,
        showNsfw: s.showNsfw,
        hideScrollbars: s.hideScrollbars,
        slashShortcut: s.slashShortcut,
      }),
    },
  ),
)
