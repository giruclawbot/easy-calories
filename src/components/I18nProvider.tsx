'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import { getStoredLocale, setStoredLocale } from '@/lib/i18n'
import { loadMessages, t as tFn } from '@/lib/translations'

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  syncLocaleFromProfile: (profileLocale: string | undefined) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  setLocale: () => {},
  syncLocaleFromProfile: () => {},
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

  // Call this after loading UserProfile from Firestore.
  // If Firestore has a locale set and localStorage is empty/default,
  // the Firestore value wins (new browser scenario).
  function syncLocaleFromProfile(profileLocale: string | undefined) {
    if (!profileLocale) return
    const valid: Locale[] = ['es', 'en']
    if (!valid.includes(profileLocale as Locale)) return
    const firestoreLocale = profileLocale as Locale
    // Always sync — Firestore is source of truth across devices
    if (firestoreLocale !== locale) {
      setLocaleState(firestoreLocale)
      setStoredLocale(firestoreLocale)
      loadMessages(firestoreLocale).then(setMessages)
    }
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    return tFn(messages, key, vars)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, syncLocaleFromProfile, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
