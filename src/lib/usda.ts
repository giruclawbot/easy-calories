export interface FoodItem {
  fdcId: number
  description: string
  brandOwner?: string
  calories: number
}

const API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || ''
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

function extractCalories(nutrients: Array<{ nutrientName?: string; nutrientId?: number; value?: number }>): number {
  const cal = nutrients.find(
    n => n.nutrientName?.toLowerCase().includes('energy') || n.nutrientId === 1008
  )
  return Math.round(cal?.value || 0)
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
      calories: extractCalories((food.foodNutrients as Array<{ nutrientName?: string; nutrientId?: number; value?: number }>) || []),
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
      calories: extractCalories((food.foodNutrients as Array<{ nutrientName?: string; nutrientId?: number; value?: number }>) || []),
    }
  } catch {
    return null
  }
}
