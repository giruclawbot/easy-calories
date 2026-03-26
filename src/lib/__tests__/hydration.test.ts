import { calculateIdealHydration } from '../hydration'

describe('calculateIdealHydration', () => {
  it('calculates base for sedentary male: 35ml × kg', () => {
    const result = calculateIdealHydration({ weightKg: 70, sex: 'male', activity: 'sedentary' })
    // 35 × 70 = 2450 → round to 2450
    expect(result.baseMl).toBe(2450)
    expect(result.activityBonusMl).toBe(0)
    expect(result.recommendedMl).toBe(2450)
  })

  it('applies activity multiplier for moderate activity', () => {
    const result = calculateIdealHydration({ weightKg: 70, sex: 'male', activity: 'moderate' })
    // 2450 × 1.2 = 2940 → round to 2950
    expect(result.recommendedMl).toBe(2950)
    expect(result.activityBonusMl).toBeGreaterThan(0)
  })

  it('applies activity multiplier for very_active', () => {
    const result = calculateIdealHydration({ weightKg: 70, sex: 'male', activity: 'very_active' })
    // 2450 × 1.5 = 3675 → round to 3700
    expect(result.recommendedMl).toBe(3700)
  })

  it('applies female sex correction (−10%)', () => {
    const male = calculateIdealHydration({ weightKg: 60, sex: 'male', activity: 'sedentary' })
    const female = calculateIdealHydration({ weightKg: 60, sex: 'female', activity: 'sedentary' })
    expect(female.recommendedMl).toBeLessThan(male.recommendedMl)
    expect(female.sexAdjustmentMl).toBeLessThan(0)
  })

  it('clamps minimum to 1500ml for very light person', () => {
    const result = calculateIdealHydration({ weightKg: 30, sex: 'female', activity: 'sedentary' })
    // 35 × 30 = 1050 × 0.9 = 945 → clamp to 1500
    expect(result.recommendedMl).toBe(1500)
  })

  it('clamps maximum to 4500ml for very heavy active person', () => {
    const result = calculateIdealHydration({ weightKg: 150, sex: 'male', activity: 'very_active' })
    // 35 × 150 × 1.5 = 7875 → clamp to 4500
    expect(result.recommendedMl).toBe(4500)
  })

  it('rounds result to nearest 50ml', () => {
    const result = calculateIdealHydration({ weightKg: 75, sex: 'male', activity: 'sedentary' })
    expect(result.recommendedMl % 50).toBe(0)
  })

  it('defaults sex to male and activity to sedentary when not provided', () => {
    const explicit = calculateIdealHydration({ weightKg: 70, sex: 'male', activity: 'sedentary' })
    const defaults = calculateIdealHydration({ weightKg: 70 })
    expect(defaults.recommendedMl).toBe(explicit.recommendedMl)
  })

  it('returns breakdown string', () => {
    const result = calculateIdealHydration({ weightKg: 70, sex: 'male', activity: 'moderate' })
    expect(result.breakdown).toContain('35ml')
    expect(result.breakdown).toContain('70')
  })

  it('activity bonus is positive for non-sedentary', () => {
    const result = calculateIdealHydration({ weightKg: 80, sex: 'male', activity: 'active' })
    expect(result.activityBonusMl).toBeGreaterThan(0)
  })
})
