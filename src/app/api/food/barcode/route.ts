import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const upc = request.nextUrl.searchParams.get('upc')
  if (!upc) return NextResponse.json({ food: null })

  const apiKey = process.env.USDA_API_KEY
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(upc)}&dataType=Branded&api_key=${apiKey}&pageSize=1`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    const data = await res.json()
    const foods = data.foods || []

    if (foods.length === 0) return NextResponse.json({ food: null })

    const food = foods[0]
    const nutrients = (food.foodNutrients as Array<{ nutrientName?: string; nutrientId?: number; value?: number }>) || []
    const cal = nutrients.find(n => n.nutrientName?.toLowerCase().includes('energy') || n.nutrientId === 1008)

    return NextResponse.json({
      food: {
        fdcId: food.fdcId,
        description: food.description,
        brandOwner: food.brandOwner || food.brandName,
        calories: Math.round(cal?.value || 0),
      }
    })
  } catch {
    return NextResponse.json({ food: null }, { status: 500 })
  }
}
