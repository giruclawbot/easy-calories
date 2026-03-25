// Use real implementation — not the global mock from jest.setup.ts
jest.unmock('@/components/I18nProvider')

import { render, screen, act } from '@testing-library/react'
import { I18nProvider, useI18n } from '../I18nProvider'

function TestConsumer() {
  const { locale, t, setLocale } = useI18n()
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="t-result">{t('common.loading')}</span>
      <button onClick={() => setLocale('en')}>Switch to EN</button>
    </div>
  )
}

describe('I18nProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders children', () => {
    render(
      <I18nProvider>
        <div>hello</div>
      </I18nProvider>
    )
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('default locale is es', async () => {
    await act(async () => {
      render(
        <I18nProvider>
          <TestConsumer />
        </I18nProvider>
      )
    })
    expect(screen.getByTestId('locale').textContent).toBe('es')
  })

  it('t returns key before messages load (empty messages)', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    )
    // Before messages load, t returns key
    expect(screen.getByTestId('t-result').textContent).toBe('common.loading')
  })

  it('setLocale updates locale', async () => {
    await act(async () => {
      render(
        <I18nProvider>
          <TestConsumer />
        </I18nProvider>
      )
    })
    await act(async () => {
      screen.getByText('Switch to EN').click()
    })
    expect(screen.getByTestId('locale').textContent).toBe('en')
  })
})
