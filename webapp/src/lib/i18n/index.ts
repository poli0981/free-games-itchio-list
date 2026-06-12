import { useMemo } from 'react'
import { create } from 'zustand'
import { usePrefs } from '@/stores/prefs'
import { en, type MessageKey } from './en'

export type Language = 'en' | 'vi'
export type { MessageKey }

/**
 * Holds the lazily-loaded Vietnamese dictionary. A zustand store (rather than
 * a module variable) so every `useT` subscriber re-renders when it lands.
 */
const useViDict = create<{ dict: Record<MessageKey, string> | null }>(() => ({ dict: null }))

let viPromise: Promise<void> | null = null

/** Load the VI chunk once; literal specifier keeps it a separate Vite chunk. */
function ensureVi(): Promise<void> {
  viPromise ??= import('./vi').then((m) => {
    useViDict.setState({ dict: m.vi })
  })
  return viPromise
}

/**
 * Switch the UI language. Awaits the VI dictionary BEFORE flipping the pref
 * so `t()` never renders raw keys mid-switch.
 */
export async function switchLanguage(lang: Language): Promise<void> {
  if (lang === 'vi') await ensureVi()
  usePrefs.getState().setLanguage(lang)
}

/** Call once at startup: preload VI if it was the persisted preference. */
export function initI18n(): void {
  if (usePrefs.getState().language === 'vi') void ensureVi()
}

function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

function lookup(
  lang: Language,
  dict: Record<MessageKey, string> | null,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  // Fall back to English while the VI chunk is still loading (cold start
  // with a persisted 'vi' pref) — never show raw keys.
  const template = (lang === 'vi' && dict ? dict[key] : undefined) ?? en[key]
  return format(template, params)
}

/**
 * Imperative translate for non-component contexts (toasts, handlers, column
 * render functions executing inside an already-subscribed tree).
 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  return lookup(usePrefs.getState().language, useViDict.getState().dict, key, params)
}

/** Reactive translate hook — re-renders the component on language switch. */
export function useT(): (key: MessageKey, params?: Record<string, string | number>) => string {
  const lang = usePrefs((s) => s.language)
  const dict = useViDict((s) => s.dict)
  return useMemo(
    () => (key: MessageKey, params?: Record<string, string | number>) =>
      lookup(lang, dict, key, params),
    [lang, dict],
  )
}
