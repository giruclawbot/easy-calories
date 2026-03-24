import { t, loadMessages } from '../translations'

const mockMessages = {
  common: {
    loading: 'Cargando...',
    error: 'Error',
  },
  calculator: {
    estimatedGoal: 'Alcanzarás {weight} kg en aproximadamente',
  },
}

describe('translations', () => {
  describe('t()', () => {
    it('returns nested key value', () => {
      expect(t(mockMessages, 'common.loading')).toBe('Cargando...')
    })

    it('returns key when not found', () => {
      expect(t(mockMessages, 'common.missing')).toBe('common.missing')
    })

    it('returns key when top-level not found', () => {
      expect(t(mockMessages, 'missing.key')).toBe('missing.key')
    })

    it('interpolates variables', () => {
      expect(t(mockMessages, 'calculator.estimatedGoal', { weight: '70' })).toBe(
        'Alcanzarás 70 kg en aproximadamente'
      )
    })

    it('returns key when value is not a string', () => {
      expect(t(mockMessages, 'common')).toBe('common')
    })
  })

  describe('loadMessages()', () => {
    it('loads es messages', async () => {
      const messages = await loadMessages('es')
      expect(messages).toBeDefined()
      expect(typeof messages).toBe('object')
    })

    it('loads en messages', async () => {
      const messages = await loadMessages('en')
      expect(messages).toBeDefined()
      expect(typeof messages).toBe('object')
    })

    it('caches messages on second call', async () => {
      const first = await loadMessages('es')
      const second = await loadMessages('es')
      expect(first).toBe(second)
    })
  })
})
