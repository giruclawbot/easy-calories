'use client'
import { Meal } from '@/lib/firestore'
import { useI18n } from '@/components/I18nProvider'

interface Props {
  meals: Meal[]
  onRemove?: (meal: Meal) => void
  onEdit?: (meal: Meal) => void
  viewMode?: 'grouped' | 'all'
  onViewModeChange?: (mode: 'grouped' | 'all') => void
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const GROUP_ORDER: (MealType | 'others')[] = ['breakfast', 'lunch', 'dinner', 'snack', 'others']

const GROUP_CONFIG: Record<MealType | 'others', { emoji: string; key: string }> = {
  breakfast: { emoji: '🌅', key: 'meals.breakfast' },
  lunch: { emoji: '☀️', key: 'meals.lunch' },
  dinner: { emoji: '🌙', key: 'meals.dinner' },
  snack: { emoji: '🍎', key: 'meals.snack' },
  others: { emoji: '📦', key: 'meals.others' },
}

function MealItem({ meal, onEdit, onRemove }: { meal: Meal; onEdit?: (m: Meal) => void; onRemove?: (m: Meal) => void }) {
  return (
    <li role="listitem" className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 border border-gray-800">
      <div>
        <p className="font-medium text-white text-sm">{meal.foodName}</p>
        <p className="text-xs text-gray-400">{meal.quantity}{meal.unit}</p>
        {meal.nutrition && (
          <div className="flex gap-2 mt-0.5">
            {[
              { label: 'P', value: meal.nutrition.protein, color: 'text-blue-400' },
              { label: 'C', value: meal.nutrition.carbs, color: 'text-yellow-400' },
              { label: 'G', value: meal.nutrition.fat, color: 'text-orange-400' },
            ].map(m => (
              <span key={m.label} className={`text-xs ${m.color}`}>{m.label}: {Math.round(m.value)}g</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-emerald-400 font-bold">{meal.calories} kcal</span>
        {onEdit && (
          <button
            onClick={() => onEdit(meal)}
            className="text-gray-500 hover:text-blue-400 transition-colors p-1"
            aria-label={`Editar ${meal.foodName}`}
          >
            ✏️
          </button>
        )}
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
  )
}

export function MealList({ meals, onRemove, onEdit, viewMode = 'grouped', onViewModeChange }: Props) {
  const { t } = useI18n()

  // Check if all meals are legacy (no mealType)
  const allLegacy = meals.length > 0 && meals.every(m => !m.mealType)
  const effectiveMode = allLegacy ? 'all' : viewMode
  const showToggle = !allLegacy && meals.length > 0

  if (meals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-3xl mb-2">🍽️</p>
        <p>{t('meals.noMeals')}</p>
      </div>
    )
  }

  if (effectiveMode === 'all') {
    return (
      <div>
        {showToggle && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => onViewModeChange?.('grouped')}
              className="text-xs text-gray-400 hover:text-emerald-400 transition-colors"
              aria-label="Ver por tipo de comida"
            >
              🍽️ {t('meals.viewGrouped')}
            </button>
          </div>
        )}
        <ul role="list" className="space-y-2">
          {meals.map((meal, i) => (
            <MealItem key={meal.id || i} meal={meal} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </ul>
      </div>
    )
  }

  // Grouped view
  const groups: Record<MealType | 'others', Meal[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
    others: [],
  }

  for (const meal of meals) {
    const key = meal.mealType ?? 'others'
    groups[key as MealType | 'others'].push(meal)
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => onViewModeChange?.('all')}
          className="text-xs text-gray-400 hover:text-emerald-400 transition-colors"
          aria-label="Ver todas las comidas"
        >
          📋 {t('meals.viewAll')}
        </button>
      </div>
      <div className="space-y-4">
        {GROUP_ORDER.map(groupKey => {
          const groupMeals = groups[groupKey]
          if (groupMeals.length === 0) return null
          const { emoji, key } = GROUP_CONFIG[groupKey]
          const subtotal = groupMeals.reduce((s, m) => s + m.calories, 0)
          return (
            <div key={groupKey}>
              <div className="flex items-center justify-between mb-1 px-1">
                <h3 className="text-sm font-semibold text-gray-300">
                  {emoji} {t(key)}
                </h3>
                <span className="text-xs text-emerald-400">{t('meals.subtotal', { calories: subtotal })}</span>
              </div>
              <ul role="list" className="space-y-2">
                {groupMeals.map((meal, i) => (
                  <MealItem key={meal.id || i} meal={meal} onEdit={onEdit} onRemove={onRemove} />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
