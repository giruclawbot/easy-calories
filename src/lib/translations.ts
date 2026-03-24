import type { Locale } from './i18n'

// Lazy-load translations
const cache: Partial<Record<Locale, Record<string, unknown>>> = {}

export async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  if (cache[locale]) return cache[locale]!
  const messages = await import(`../../messages/${locale}.json`)
  cache[locale] = messages.default
  return messages.default
}

// Typed getter with dot notation
export function t(messages: Record<string, unknown>, key: string, vars?: Record<string, string | number>): string {
  const parts = key.split('.')
  let val: unknown = messages
  for (const p of parts) {
    if (val && typeof val === 'object') val = (val as Record<string, unknown>)[p]
    else return key
  }
  if (typeof val !== 'string') return key
  if (vars) {
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), val)
  }
  return val
}
