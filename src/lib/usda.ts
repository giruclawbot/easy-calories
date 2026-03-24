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

export async function getFoodByBarcode(upc: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/foods/search?query=${encodeURIComponent(upc)}&dataType=Branded&api_key=${API_KEY}&pageSize=1`
    )
    if (!res.ok) return null
    const data = await res.json()
    const foods = data.foods || []
    if (foods.length === 0) return null
    const food = foods[0]
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
