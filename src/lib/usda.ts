export interface FoodItem {
  fdcId: number
  description: string
  brandOwner?: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
}

export async function searchFoods(query: string): Promise<FoodItem[]> {
  const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.foods || []
}

export async function getFoodByBarcode(upc: string): Promise<FoodItem | null> {
  const res = await fetch(`/api/food/barcode?upc=${encodeURIComponent(upc)}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.food || null
}
