export interface NutritionFacts {
  calories: number
  protein: number    // g
  carbs: number      // g
  fat: number        // g
  fiber: number      // g
  sugar: number      // g
  sodium: number     // mg
  cholesterol: number // mg
}

export interface FoodItem {
  fdcId: number
  description: string
  brandOwner?: string
  nutrition: NutritionFacts
}

const API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || ''
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

function extractNutrition(nutrients: Array<{ nutrientName?: string; nutrientId?: number; value?: number }>): NutritionFacts {
  const get = (ids: number[], names: string[]) => {
    const n = nutrients.find(n =>
      (n.nutrientId && ids.includes(n.nutrientId)) ||
      names.some(name => n.nutrientName?.toLowerCase().includes(name))
    )
    return Math.round((n?.value || 0) * 10) / 10
  }
  return {
    calories: get([1008], ['energy']),
    protein: get([1003], ['protein']),
    carbs: get([1005], ['carbohydrate']),
    fat: get([1004], ['total lipid', 'fat']),
    fiber: get([1079], ['fiber']),
    sugar: get([2000, 1063], ['sugars']),
    sodium: get([1093], ['sodium']),
    cholesterol: get([1253], ['cholesterol']),
  }
}

// Shorthand usado en varios componentes
/* istanbul ignore next */
export function getCalories(food: FoodItem): number {
  return food.nutrition.calories
}

export async function searchFoods(query: string): Promise<FoodItem[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/foods/search?query=${encodeURIComponent(query)}&api_key=${API_KEY}&pageSize=8`
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.foods || []).map((food: Record<string, unknown>) => ({
      fdcId: food.fdcId,
      description: food.description,
      brandOwner: food.brandOwner || food.brandName,
      nutrition: extractNutrition((food.foodNutrients as Array<{ nutrientName?: string; nutrientId?: number; value?: number }>) || []),
    }))
  } catch {
    return []
  }
}

// Open Food Facts API — free, no key, 3M+ products, best US coverage
const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product'

function extractNutritionFromOFF(nutriments: Record<string, number>): NutritionFacts {
  const n = nutriments || {}
  return {
    calories:    Math.round((n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0) * 10) / 10,
    protein:     Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
    carbs:       Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
    fat:         Math.round((n['fat_100g'] ?? 0) * 10) / 10,
    fiber:       Math.round((n['fiber_100g'] ?? 0) * 10) / 10,
    sugar:       Math.round((n['sugars_100g'] ?? 0) * 10) / 10,
    sodium:      Math.round((n['sodium_100g'] ?? 0) * 1000 * 10) / 10, // g → mg
    cholesterol: Math.round((n['cholesterol_100g'] ?? 0) * 1000 * 10) / 10, // g → mg
  }
}

async function getFoodByBarcodeOFF(upc: string): Promise<FoodItem | null> {
  try {
    const fields = 'code,product_name,brands,nutriments,serving_size'
    const res = await fetch(`${OFF_BASE}/${encodeURIComponent(upc)}.json?fields=${fields}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status === 0 || !data.product?.product_name) return null
    const p = data.product
    return {
      fdcId: 0, // OFF doesn't have fdcId
      description: p.product_name,
      brandOwner: p.brands || undefined,
      nutrition: extractNutritionFromOFF(p.nutriments || {}),
    }
  } catch {
    return null
  }
}

async function getFoodByBarcodeUSDA(upc: string): Promise<FoodItem | null> {
  try {
    // Try exact gtinUpc match first (most accurate)
    const res = await fetch(
      `${BASE_URL}/foods/search?query=${encodeURIComponent(upc)}&dataType=Branded&api_key=${API_KEY}&pageSize=1`
    )
    if (!res.ok) return null
    const data = await res.json()
    const foods = data.foods || []
    if (foods.length === 0) return null
    const food = foods[0]
    // Verify the UPC actually matches (USDA text search can return unrelated results)
    const gtinMatch = food.gtinUpc === upc ||
      food.gtinUpc === upc.padStart(14, '0') ||
      upc === food.gtinUpc?.replace(/^0+/, '')
    if (!gtinMatch) return null
    return {
      fdcId: food.fdcId,
      description: food.description,
      brandOwner: food.brandOwner || food.brandName,
      nutrition: extractNutrition((food.foodNutrients as Array<{ nutrientName?: string; nutrientId?: number; value?: number }>) || []),
    }
  } catch {
    return null
  }
}

export async function getFoodByBarcode(upc: string): Promise<FoodItem | null> {
  // 1. Try Open Food Facts first — best coverage for US branded products
  const offResult = await getFoodByBarcodeOFF(upc)
  if (offResult) return offResult

  // 2. Fallback to USDA Branded Foods with strict UPC match
  const usdaResult = await getFoodByBarcodeUSDA(upc)
  if (usdaResult) return usdaResult

  return null
}
