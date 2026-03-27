'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { useAuth } from '@/components/AuthProvider'
import { FoodSearch } from '@/components/FoodSearch'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { addMeal, trackFoodUsage } from '@/lib/firestore'
import type { Meal } from '@/lib/firestore'
import { QuickAdd } from '@/components/QuickAdd'
import { FoodItem, NutritionFacts } from '@/lib/usda'
import { useI18n } from '@/components/I18nProvider'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

function getDefaultMealType(): MealType {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 15) return 'lunch'
  if (hour >= 15 && hour < 21) return 'dinner'
  return 'snack'
}

const MEAL_TYPES: { type: MealType; emoji: string; key: string }[] = [
  { type: 'breakfast', emoji: '🌅', key: 'meals.breakfast' },
  { type: 'lunch', emoji: '☀️', key: 'meals.lunch' },
  { type: 'dinner', emoji: '🌙', key: 'meals.dinner' },
  { type: 'snack', emoji: '🍎', key: 'meals.snack' },
]

export default function AddFoodPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [showScanner, setShowScanner] = useState(false)
  const [adding, setAdding] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<MealType>(getDefaultMealType())

  const today = format(new Date(), 'yyyy-MM-dd')

  async function handleAdd(meal: { foodName: string; calories: number; quantity: number; unit: string; nutrition?: NutritionFacts }) {
    if (!user) return
    setAdding(true)
    const newMeal: Meal = {
      id: Date.now().toString(),
      ...meal,
      timestamp: new Date().toISOString(),
      mealType: selectedMealType,
    }
    await addMeal(user.uid, today, newMeal)
    // fire-and-forget usage tracking
    trackFoodUsage(user.uid, meal).catch(() => {})
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
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">{t('food.back')}</button>
        <h1 className="text-2xl font-bold text-white">{t('food.addTitle')}</h1>
      </div>

      {lastAdded && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-emerald-400">✓</span>
          <span className="text-emerald-300 text-sm">{t('food.addedSuccess', { name: lastAdded })}</span>
        </div>
      )}

      {/* Meal type selector */}
      <div>
        <p className="text-sm text-gray-400 mb-2">{t('food.selectMealType')}</p>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map(({ type, emoji, key }) => (
            <button
              key={type}
              onClick={() => setSelectedMealType(type)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
                selectedMealType === type
                  ? 'bg-emerald-700 border-emerald-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <span>{t(key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recipes shortcut */}
      <Link
        href="/dashboard/recipes"
        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 rounded-xl transition-colors"
      >
        🍳 {t('recipes.addShortcut')}
      </Link>

      {/* Quick Add section */}
      {user && <QuickAdd uid={user.uid} onAdd={handleAdd} mealType={selectedMealType} />}

      <button
        onClick={() => setShowScanner(!showScanner)}
        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 rounded-xl transition-colors"
      >
        📷 {showScanner ? t('food.stopScan') : t('food.scanBarcode')}
      </button>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-400">O busca manualmente:</p>
          <button
            onClick={() => router.push('/dashboard/add/custom-food')}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-800 hover:border-emerald-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            <span>👥</span>
            <span>{t('communityFood.addNewFood')}</span>
          </button>
        </div>
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
