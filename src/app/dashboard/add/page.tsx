'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuth } from '@/components/AuthProvider'
import { FoodSearch } from '@/components/FoodSearch'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { addMeal } from '@/lib/firestore'
import { FoodItem, NutritionFacts } from '@/lib/usda'

export default function AddFoodPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [showScanner, setShowScanner] = useState(false)
  const [adding, setAdding] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  async function handleAdd(meal: { foodName: string; calories: number; quantity: number; unit: string; nutrition?: NutritionFacts }) {
    if (!user) return
    setAdding(true)
    await addMeal(user.uid, today, {
      id: Date.now().toString(),
      ...meal,
      timestamp: new Date().toISOString(),
    })
    setLastAdded(meal.foodName)
    setAdding(false)
  }

  function handleBarcodeFound(food: FoodItem) {
    setShowScanner(false)
    handleAdd({ foodName: food.description, calories: food.nutrition.calories, quantity: 100, unit: 'g', nutrition: food.nutrition })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">‹ Volver</button>
        <h1 className="text-2xl font-bold text-white">Agregar comida</h1>
      </div>

      {lastAdded && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-emerald-400">✓</span>
          <span className="text-emerald-300 text-sm"><strong>{lastAdded}</strong> agregado correctamente</span>
        </div>
      )}

      <button
        onClick={() => setShowScanner(true)}
        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 rounded-xl transition-colors"
      >
        📷 Escanear código de barras
      </button>

      <div>
        <p className="text-sm text-gray-400 mb-3">O busca manualmente:</p>
        <FoodSearch onAdd={handleAdd} />
      </div>

      {adding && (
        <div className="text-center text-emerald-400 animate-pulse">Guardando...</div>
      )}

      {showScanner && (
        <BarcodeScanner onFound={handleBarcodeFound} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
