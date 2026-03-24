import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ foods: [] })

  const apiKey = process.env.USDA_API_KEY
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&api_key=${apiKey}&pageSize=8`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()

    const foods = (data.foods || []).map((food: Record<string, unknown>) => {
      const nutrients = (food.foodNutrients as Array<{ nutrientName?: string; nutrientId?: number; value?: number }>) || []
      const cal = nutrients.find(n => n.nutrientName?.toLowerCase().includes('energy') || n.nutrientId === 1008)
      return {
        fdcId: food.fdcId,
        description: food.description,
        brandOwner: food.brandOwner || food.brandName,
        calories: Math.round(cal?.value || 0),
      }
    })

    return NextResponse.json({ foods })
  } catch {
    return NextResponse.json({ foods: [] }, { status: 500 })
  }
}
