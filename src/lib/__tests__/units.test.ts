import { kgToLbs, lbsToKg, cmToFtIn, ftInToCm, formatWeight, formatHeight } from '../units'

describe('kgToLbs', () => {
  it('converts 70 kg to lbs', () => {
    expect(kgToLbs(70)).toBe(154.3)
  })
  it('converts 0 kg', () => {
    expect(kgToLbs(0)).toBe(0)
  })
  it('converts 100 kg', () => {
    expect(kgToLbs(100)).toBe(220.5)
  })
})

describe('lbsToKg', () => {
  it('converts 154.3 lbs back to ~70 kg', () => {
    expect(lbsToKg(154.3)).toBeCloseTo(69.99, 1)
  })
  it('converts 0 lbs', () => {
    expect(lbsToKg(0)).toBe(0)
  })
  it('converts 220 lbs', () => {
    expect(lbsToKg(220)).toBeCloseTo(99.79, 1)
  })
})

describe('cmToFtIn', () => {
  it('converts 170 cm to 5ft 7in', () => {
    const result = cmToFtIn(170)
    expect(result.ft).toBe(5)
    expect(result.inches).toBe(7)
  })
  it('converts 180 cm to 5ft 11in', () => {
    const result = cmToFtIn(180)
    expect(result.ft).toBe(5)
    expect(result.inches).toBe(11)
  })
  it('converts 152 cm to 4ft 12in (5ft)', () => {
    const result = cmToFtIn(152)
    expect(result.ft).toBe(4)
    expect(result.inches).toBeGreaterThanOrEqual(11)
  })
})

describe('ftInToCm', () => {
  it('converts 5ft 7in to ~170 cm', () => {
    expect(ftInToCm(5, 7)).toBe(170)
  })
  it('converts 6ft 0in to ~183 cm', () => {
    expect(ftInToCm(6, 0)).toBe(183)
  })
  it('converts 5ft 11in to ~180 cm', () => {
    expect(ftInToCm(5, 11)).toBe(180)
  })
})

describe('formatWeight', () => {
  it('formats metric', () => {
    expect(formatWeight(70, 'metric')).toBe('70 kg')
  })
  it('formats imperial', () => {
    expect(formatWeight(70, 'imperial')).toBe('154.3 lbs')
  })
})

describe('formatHeight', () => {
  it('formats metric', () => {
    expect(formatHeight(170, 'metric')).toBe('170 cm')
  })
  it('formats imperial', () => {
    expect(formatHeight(170, 'imperial')).toBe('5\'7"')
  })
})
