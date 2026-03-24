// Mock fetch globally
global.fetch = jest.fn()

import { searchFoods, getFoodByBarcode } from '../usda'

const mockFetchResponse = (data: unknown) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  })
}

const sampleFood = {
  fdcId: 123,
  description: 'Apple, raw',
  brandOwner: undefined,
  foodNutrients: [
    { nutrientId: 1008, nutrientName: 'Energy', value: 52 },
    { nutrientId: 1003, nutrientName: 'Protein', value: 0.3 },
    { nutrientId: 1005, nutrientName: 'Carbohydrate, by difference', value: 14 },
    { nutrientId: 1004, nutrientName: 'Total lipid (fat)', value: 0.2 },
    { nutrientId: 1079, nutrientName: 'Fiber, total dietary', value: 2.4 },
    { nutrientId: 2000, nutrientName: 'Sugars, total including NLEA', value: 10 },
    { nutrientId: 1093, nutrientName: 'Sodium, Na', value: 1 },
    { nutrientId: 1253, nutrientName: 'Cholesterol', value: 0 },
  ],
}

describe('searchFoods', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_USDA_API_KEY = 'test-key'
  })

  it('returns empty array on fetch error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    const results = await searchFoods('apple')
    expect(results).toEqual([])
  })

  it('returns empty array on non-ok response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    const results = await searchFoods('apple')
    expect(results).toEqual([])
  })

  it('returns mapped FoodItems with nutrition', async () => {
    mockFetchResponse({ foods: [sampleFood] })
    const results = await searchFoods('apple')
    expect(results).toHaveLength(1)
    expect(results[0].fdcId).toBe(123)
    expect(results[0].description).toBe('Apple, raw')
    expect(results[0].nutrition.calories).toBe(52)
    expect(results[0].nutrition.protein).toBe(0.3)
    expect(results[0].nutrition.carbs).toBe(14)
  })

  it('returns empty array when no foods in response', async () => {
    mockFetchResponse({ foods: [] })
    const results = await searchFoods('xyz')
    expect(results).toEqual([])
  })

  it('maps brandName fallback when brandOwner undefined', async () => {
    const foodWithBrandName = { ...sampleFood, brandOwner: undefined, brandName: 'TestBrand' }
    mockFetchResponse({ foods: [foodWithBrandName] })
    const results = await searchFoods('apple')
    expect(results[0].brandOwner).toBe('TestBrand')
  })

  it('handles food without foodNutrients', async () => {
    const minimalFood = { fdcId: 456, description: 'Minimal food', foodNutrients: undefined }
    mockFetchResponse({ foods: [minimalFood] })
    const results = await searchFoods('minimal')
    expect(results[0].nutrition.calories).toBe(0)
  })
})

describe('getFoodByBarcode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_USDA_API_KEY = 'test-key'
  })

  it('returns null on fetch error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    const result = await getFoodByBarcode('012345678')
    expect(result).toBeNull()
  })

  it('returns null on non-ok response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    const result = await getFoodByBarcode('012345678')
    expect(result).toBeNull()
  })

  it('returns null when no foods found', async () => {
    mockFetchResponse({ foods: [] })
    const result = await getFoodByBarcode('012345678')
    expect(result).toBeNull()
  })

  it('returns FoodItem when barcode found', async () => {
    mockFetchResponse({ foods: [sampleFood] })
    const result = await getFoodByBarcode('012345678')
    expect(result).not.toBeNull()
    expect(result?.fdcId).toBe(123)
    expect(result?.nutrition.calories).toBe(52)
  })

  it('maps brandName fallback in barcode result', async () => {
    const foodWithBrandName = { ...sampleFood, brandOwner: undefined, brandName: 'BrandX' }
    mockFetchResponse({ foods: [foodWithBrandName] })
    const result = await getFoodByBarcode('012345678')
    expect(result?.brandOwner).toBe('BrandX')
  })
})
