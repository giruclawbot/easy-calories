'use client'
import { useEffect, useState } from 'react'
import { getFrequentFoods, dismissFrequentFood } from '@/lib/firestore'
import type { FrequentFood } from '@/lib/firestore'
import type { NutritionFacts } from '@/lib/usda'
import { useI18n } from '@/components/I18nProvider'

interface Props {
  uid: string
  onAdd: (meal: { foodName: string; calories: number; quantity: number; unit: string; nutrition?: NutritionFacts }) => Promise<void>
  mealType?: string
}

export function QuickAdd({ uid, onAdd }: Props) {
  const { t } = useI18n()
  const [foods, setFoods] = useState<FrequentFood[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<string | null>(null)

  async function loadFoods() {
    const result = await getFrequentFoods(uid)
    setFoods(result)
    setLoading(false)
  }

  useEffect(() => {
    loadFoods()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  async function handleAdd(food: FrequentFood) {
    setAdding(food.foodName)
    await onAdd({
      foodName: food.foodName,
      calories: food.calories,
      quantity: food.quantity,
      unit: food.unit,
      nutrition: food.nutrition,
    })
    setAdded(food.foodName)
    setTimeout(() => setAdded(null), 1200)
    setAdding(null)
    await loadFoods()
  }

  async function handleDismiss(food: FrequentFood) {
    setFoods(prev => prev.filter(f => f.foodName !== food.foodName))
    await dismissFrequentFood(uid, food.foodName)
  }

  if (loading || foods.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-400">{t('quickAdd.title')}</p>
      <div className="grid grid-cols-2 gap-2">
        {foods.map(food => (
          <div
            key={food.foodName}
            className="relative bg-gray-900/60 border border-gray-700/50 opacity-80 rounded-xl p-3 flex flex-col gap-1"
          >
            <button
              onClick={() => handleDismiss(food)}
              className="absolute top-1 right-1 text-gray-500 hover:text-gray-300 text-xs px-1"
              aria-label={t('quickAdd.dismiss')}
            >
              ×
            </button>
            <span className="text-sm text-white line-clamp-2 pr-4">{food.foodName}</span>
            <span className="text-xs text-gray-400">{food.calories} kcal</span>
            <span className="text-xs text-gray-500">{food.quantity}{food.unit}</span>
            <button
              onClick={() => handleAdd(food)}
              disabled={adding === food.foodName}
              className="mt-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg py-1 px-2 transition-colors disabled:opacity-50"
            >
              {added === food.foodName ? t('quickAdd.added') : adding === food.foodName ? '…' : t('quickAdd.add')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
