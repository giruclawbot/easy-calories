// Mock fetch globally
global.fetch = jest.fn()

import { searchFoods, getFoodByBarcode } from '../usda'

const mockFetchResponse = (data: unknown) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  })
}

const mockFetchFail = () => {
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
}

const mockFetchNotOk = () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
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

// Open Food Facts mock response
const offProduct = {
  status: 1,
  product: {
    product_name: 'Diet Coke',
    brands: 'Coca-Cola',
    nutriments: {
      'energy-kcal_100g': 0,
      'proteins_100g': 0,
      'carbohydrates_100g': 0,
      'fat_100g': 0,
      'fiber_100g': 0,
      'sugars_100g': 0,
      'sodium_100g': 0.011,
      'cholesterol_100g': 0,
    },
  },
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

  it('returns result from Open Food Facts when found', async () => {
    // OFF returns a product
    mockFetchResponse(offProduct)
    const result = await getFoodByBarcode('049000028911')
    expect(result).not.toBeNull()
    expect(result?.description).toBe('Diet Coke')
    expect(result?.brandOwner).toBe('Coca-Cola')
    // fetch called once (OFF only)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('falls back to USDA when OFF returns status 0', async () => {
    // OFF: product not found
    mockFetchResponse({ status: 0, product: null })
    // USDA: returns a product with matching gtinUpc
    mockFetchResponse({ foods: [{ ...sampleFood, gtinUpc: '012345678' }] })
    const result = await getFoodByBarcode('012345678')
    expect(result).not.toBeNull()
    expect(result?.fdcId).toBe(123)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('falls back to USDA when OFF fetch fails', async () => {
    // OFF: network error
    mockFetchFail()
    // USDA: returns a product
    mockFetchResponse({ foods: [{ ...sampleFood, gtinUpc: '012345678' }] })
    const result = await getFoodByBarcode('012345678')
    expect(result).not.toBeNull()
    expect(result?.fdcId).toBe(123)
  })

  it('returns null when both OFF and USDA fail', async () => {
    // OFF fails
    mockFetchFail()
    // USDA: network error
    mockFetchFail()
    const result = await getFoodByBarcode('000000000000')
    expect(result).toBeNull()
  })

  it('returns null when OFF not found and USDA returns empty', async () => {
    // OFF: not found
    mockFetchResponse({ status: 0 })
    // USDA: empty
    mockFetchResponse({ foods: [] })
    const result = await getFoodByBarcode('000000000000')
    expect(result).toBeNull()
  })

  it('returns null when USDA gtinUpc does not match', async () => {
    // OFF: not found
    mockFetchResponse({ status: 0 })
    // USDA: returns food but wrong UPC
    mockFetchResponse({ foods: [{ ...sampleFood, gtinUpc: '999999999999' }] })
    const result = await getFoodByBarcode('012345678')
    expect(result).toBeNull()
  })

  it('extracts sodium correctly from OFF (g → mg conversion)', async () => {
    mockFetchResponse(offProduct) // sodium_100g: 0.011 g → 11mg
    const result = await getFoodByBarcode('049000028911')
    expect(result?.nutrition.sodium).toBeCloseTo(11, 0)
  })

  it('handles OFF product with no product_name', async () => {
    // OFF returns product but no name → skip
    mockFetchResponse({ status: 1, product: { product_name: '', brands: 'X', nutriments: {} } })
    // USDA fallback: empty
    mockFetchResponse({ foods: [] })
    const result = await getFoodByBarcode('012345678')
    expect(result).toBeNull()
  })
})
