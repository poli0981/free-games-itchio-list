import { useMemo } from 'react'
import { usePrefs } from '@/stores/prefs'

const LOCALES = { en: 'en-GB', vi: 'vi-VN' } as const

export interface Formatters {
  /** 2681 → "2,681" (en) / "2.681" (vi). */
  number: (n: number) => string
  /** 4.9 → "4.9" (en) / "4,9" (vi), always one decimal. */
  rating: (n: number) => string
  /** 0.631 → "63.1%" (en) / "63,1%" (vi), at most one decimal. */
  percent: (ratio: number) => string
  /** ISO date/time → "17 Aug 2026" (en) / "17 thg 8, 2026" (vi); '' when invalid. */
  date: (iso: string | undefined) => string
}

/** Number and date formatting that follows the language preference. */
export function useFormat(): Formatters {
  const language = usePrefs((s) => s.language)
  return useMemo(() => {
    const locale = LOCALES[language]
    const numbers = new Intl.NumberFormat(locale)
    const ratings = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    const percents = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
    const dates = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    return {
      number: (n) => numbers.format(n),
      rating: (n) => ratings.format(n),
      percent: (n) => percents.format(n),
      date: (iso) => {
        const at = iso ? Date.parse(iso) : Number.NaN
        return Number.isNaN(at) ? '' : dates.format(at)
      },
    }
  }, [language])
}
