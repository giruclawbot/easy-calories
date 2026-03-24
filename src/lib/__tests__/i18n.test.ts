import { getStoredLocale, setStoredLocale, defaultLocale, locales } from '../i18n'

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns defaultLocale when nothing stored', () => {
    expect(getStoredLocale()).toBe(defaultLocale)
  })

  it('returns stored locale', () => {
    setStoredLocale('en')
    expect(getStoredLocale()).toBe('en')
  })

  it('locales includes es and en', () => {
    expect(locales).toContain('es')
    expect(locales).toContain('en')
  })

  it('setStoredLocale persists to localStorage', () => {
    setStoredLocale('en')
    expect(localStorage.getItem('ec_lang')).toBe('en')
  })

  it('returns es when localStorage has empty/null value', () => {
    localStorage.removeItem('ec_lang')
    expect(getStoredLocale()).toBe('es')
  })
})
