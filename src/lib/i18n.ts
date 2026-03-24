export const locales = ['es', 'en'] as const
export type Locale = typeof locales[number]
export const defaultLocale: Locale = 'es'

const LANG_KEY = 'ec_lang'

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const stored = localStorage.getItem(LANG_KEY)
  return (stored as Locale) || defaultLocale
}

export function setStoredLocale(locale: Locale): void {
  localStorage.setItem(LANG_KEY, locale)
}
