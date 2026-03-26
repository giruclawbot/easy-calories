import { getPortionsForFood, FOOD_CATEGORIES } from '../portions'

describe('getPortionsForFood', () => {
  it('returns egg portions for "egg"', () => {
    const portions = getPortionsForFood('egg')
    expect(portions.length).toBeGreaterThan(0)
    expect(portions.some(p => p.labelEs.includes('huevo'))).toBe(true)
  })

  it('returns egg portions for "huevo" (Spanish)', () => {
    const portions = getPortionsForFood('huevo')
    expect(portions.length).toBeGreaterThan(0)
    expect(portions.some(p => p.labelEs.includes('huevo'))).toBe(true)
  })

  it('returns banana portions for "banana"', () => {
    const portions = getPortionsForFood('banana')
    expect(portions.length).toBeGreaterThan(0)
    expect(portions.some(p => p.labelEn.toLowerCase().includes('banana'))).toBe(true)
  })

  it('returns meat portions for "chicken breast"', () => {
    const portions = getPortionsForFood('chicken breast')
    expect(portions.length).toBeGreaterThan(0)
    expect(portions.some(p => p.labelEn.includes('fillet') || p.labelEn.includes('oz'))).toBe(true)
  })

  it('returns empty array for unknown food', () => {
    const portions = getPortionsForFood('xyz unknown food 12345')
    expect(portions).toEqual([])
  })

  it('returns grain portions for "white rice cooked"', () => {
    const portions = getPortionsForFood('white rice cooked')
    expect(portions.length).toBeGreaterThan(0)
    expect(portions.some(p => p.labelEn.includes('cup'))).toBe(true)
  })

  it('all returned portions have valid grams > 0', () => {
    const testFoods = ['egg', 'banana', 'chicken', 'rice', 'almond', 'milk', 'cheese', 'oil', 'coffee', 'broccoli']
    for (const food of testFoods) {
      const portions = getPortionsForFood(food)
      for (const p of portions) {
        expect(p.grams).toBeGreaterThan(0)
      }
    }
  })

  it('all returned portions have labelEs and labelEn', () => {
    const testFoods = ['egg', 'banana', 'chicken', 'rice', 'almond', 'milk', 'cheese', 'oil', 'coffee', 'broccoli']
    for (const food of testFoods) {
      const portions = getPortionsForFood(food)
      for (const p of portions) {
        expect(typeof p.labelEs).toBe('string')
        expect(p.labelEs.length).toBeGreaterThan(0)
        expect(typeof p.labelEn).toBe('string')
        expect(p.labelEn.length).toBeGreaterThan(0)
      }
    }
  })

  it('is case-insensitive', () => {
    const lower = getPortionsForFood('egg')
    const upper = getPortionsForFood('EGG')
    const mixed = getPortionsForFood('Egg White')
    expect(lower.length).toBeGreaterThan(0)
    expect(upper.length).toBe(lower.length)
    expect(mixed.length).toBeGreaterThan(0)
  })

  it('returns unique portions when multiple categories match', () => {
    const portions = getPortionsForFood('egg')
    const keys = portions.map(p => `${p.labelEn}:${p.grams}`)
    const unique = new Set(keys)
    expect(unique.size).toBe(portions.length)
  })

  it('all FOOD_CATEGORIES have valid structure', () => {
    for (const cat of FOOD_CATEGORIES) {
      expect(Array.isArray(cat.keywords)).toBe(true)
      expect(cat.keywords.length).toBeGreaterThan(0)
      expect(Array.isArray(cat.portions)).toBe(true)
      expect(cat.portions.length).toBeGreaterThan(0)
      for (const p of cat.portions) {
        expect(p.grams).toBeGreaterThan(0)
        expect(p.labelEn).toBeTruthy()
        expect(p.labelEs).toBeTruthy()
      }
    }
  })
})
