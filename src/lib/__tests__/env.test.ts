import { assertEnv } from '../env'

describe('assertEnv', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('does not throw when called', () => {
    expect(() => assertEnv()).not.toThrow()
  })

  it('warns when required env vars are missing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    delete process.env.NEXT_PUBLIC_USDA_API_KEY
    assertEnv()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('does not warn when all env vars are set', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
    process.env.NEXT_PUBLIC_USDA_API_KEY = 'test-usda'
    assertEnv()
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('warns when env vars are set to REPLACE_ME', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'REPLACE_ME'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'REPLACE_ME'
    process.env.NEXT_PUBLIC_USDA_API_KEY = 'REPLACE_ME'
    assertEnv()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
