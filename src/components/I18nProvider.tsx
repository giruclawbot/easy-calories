'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import { getStoredLocale, setStoredLocale } from '@/lib/i18n'
import { loadMessages, t as tFn } from '@/lib/translations'

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es')
  const [messages, setMessages] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const stored = getStoredLocale()
    setLocaleState(stored)
    loadMessages(stored).then(setMessages)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    setStoredLocale(l)
    loadMessages(l).then(setMessages)
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    return tFn(messages, key, vars)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
