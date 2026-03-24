'use client'
import { Meal } from '@/lib/firestore'

interface Props {
  meals: Meal[]
  onRemove?: (meal: Meal) => void
}

export function MealList({ meals, onRemove }: Props) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-3xl mb-2">🍽️</p>
        <p>No hay comidas registradas</p>
      </div>
    )
  }

  return (
    <ul role="list" className="space-y-2">
      {meals.map((meal, i) => (
        <li role="listitem" key={meal.id || i} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 border border-gray-800">
          <div>
            <p className="font-medium text-white text-sm">{meal.foodName}</p>
            <p className="text-xs text-gray-400">{meal.quantity}{meal.unit}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold">{meal.calories} kcal</span>
            {onRemove && (
              <button
                onClick={() => onRemove(meal)}
                className="text-gray-600 hover:text-red-400 transition-colors text-lg"
                aria-label="Eliminar comida"
              >
                ×
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
