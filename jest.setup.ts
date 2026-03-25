import '@testing-library/jest-dom'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const esMessages = require('./messages/es.json')

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createElement } = require('react')
    return createElement('img', props)
  },
}))

// Helper: resolve dot-notation key against messages object
function resolveKey(messages: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  let val: unknown = messages
  for (const p of parts) {
    if (val && typeof val === 'object') val = (val as Record<string, unknown>)[p]
    else return key
  }
  return typeof val === 'string' ? val : key
}

// Mock I18nProvider + useI18n — uses real es.json translations
jest.mock('@/components/I18nProvider', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  useI18n: () => ({
    locale: 'es',
    setLocale: jest.fn(),
    t: (key: string, vars?: Record<string, string | number>) => {
      let result = resolveKey(esMessages, key)
      if (vars) {
        result = Object.entries(vars).reduce(
          (s, [k, v]) => s.replace(`{${k}}`, String(v)),
          result
        )
      }
      return result
    },
  }),
}))
