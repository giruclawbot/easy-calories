'use client'
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Meal } from '@/lib/firestore'
import { useI18n } from '@/components/I18nProvider'

const schema = z.object({
  quantity: z.coerce.number().min(1, 'Mínimo 1').max(5000),
  unit: z.enum(['g', 'oz', 'ml', 'porción']),
})

type FormData = z.infer<typeof schema>
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const MEAL_TYPES: { type: MealType; emoji: string; labelKey: string }[] = [
  { type: 'breakfast', emoji: '🌅', labelKey: 'meals.breakfast' },
  { type: 'lunch',     emoji: '☀️', labelKey: 'meals.lunch' },
  { type: 'dinner',    emoji: '🌙', labelKey: 'meals.dinner' },
  { type: 'snack',     emoji: '🍎', labelKey: 'meals.snack' },
]

interface Props {
  meal: Meal
  onSave: (updated: Meal) => void
  onClose: () => void
}

export function EditMealModal({ meal, onSave, onClose }: Props) {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<MealType | undefined>(
    meal.mealType as MealType | undefined
  )

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { quantity: meal.quantity, unit: meal.unit as FormData['unit'] },
  })

  const quantity = watch('quantity') || meal.quantity

  const perUnit = meal.nutrition
    ? {
        calories:     meal.calories / meal.quantity,
        protein:      meal.nutrition.protein / meal.quantity,
        carbs:        meal.nutrition.carbs / meal.quantity,
        fat:          meal.nutrition.fat / meal.quantity,
        fiber:        meal.nutrition.fiber / meal.quantity,
        sugar:        meal.nutrition.sugar / meal.quantity,
        sodium:       meal.nutrition.sodium / meal.quantity,
        cholesterol:  meal.nutrition.cholesterol / meal.quantity,
      }
    : null

  const preview = perUnit
    ? {
        calories: Math.round(perUnit.calories * quantity),
        protein:  Math.round(perUnit.protein  * quantity * 10) / 10,
        carbs:    Math.round(perUnit.carbs    * quantity * 10) / 10,
        fat:      Math.round(perUnit.fat      * quantity * 10) / 10,
        fiber:    Math.round(perUnit.fiber    * quantity * 10) / 10,
      }
    : null

  function onSubmit(data: FormData) {
    setSaving(true)
    const ratio = data.quantity / meal.quantity
    const updated: Meal = {
      ...meal,
      quantity:  data.quantity,
      unit:      data.unit,
      calories:  Math.round(meal.calories * ratio),
      mealType:  selectedMealType,
      nutrition: meal.nutrition
        ? {
            calories:    Math.round(meal.nutrition.calories    * ratio * 10) / 10,
            protein:     Math.round(meal.nutrition.protein     * ratio * 10) / 10,
            carbs:       Math.round(meal.nutrition.carbs       * ratio * 10) / 10,
            fat:         Math.round(meal.nutrition.fat         * ratio * 10) / 10,
            fiber:       Math.round(meal.nutrition.fiber       * ratio * 10) / 10,
            sugar:       Math.round(meal.nutrition.sugar       * ratio * 10) / 10,
            sodium:      Math.round(meal.nutrition.sodium      * ratio * 10) / 10,
            cholesterol: Math.round(meal.nutrition.cholesterol * ratio * 10) / 10,
          }
        : undefined,
    }
    setSaving(false)
    onSave(updated)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <div className="bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 id="edit-title" className="font-bold text-white">{t('edit.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl" aria-label={t('common.close')}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <p className="text-white font-medium text-sm">{meal.foodName}</p>
            <p className="text-gray-500 text-xs mt-0.5">{t('edit.adjustQty')}</p>
          </div>

          {/* Quantity + unit */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                {...register('quantity')}
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder={t('food.quantity')}
              />
              {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
            </div>
            <select
              {...register('unit')}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="g">g</option>
              <option value="oz">oz</option>
              <option value="ml">ml</option>
              <option value="porción">porción</option>
            </select>
          </div>

          {/* Move to meal type */}
          <div>
            <p className="text-xs text-gray-400 mb-2">{t('edit.moveTo')}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {MEAL_TYPES.map(({ type, emoji, labelKey }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedMealType(type)}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    selectedMealType === type
                      ? 'bg-emerald-700 border-emerald-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  <span className="leading-tight text-center">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Macro preview */}
          {preview && (
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
              {[
                { label: t('macros.protein'), value: preview.protein, color: 'text-blue-400' },
                { label: t('macros.carbs'),   value: preview.carbs,   color: 'text-yellow-400' },
                { label: t('macros.fat'),     value: preview.fat,     color: 'text-orange-400' },
                { label: t('macros.fiber'),   value: preview.fiber,   color: 'text-green-400' },
              ].map(m => (
                <div key={m.label} className="bg-gray-800 rounded-lg py-1.5">
                  <p className={`font-bold ${m.color}`}>{m.value}g</p>
                  <p className="text-gray-500">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Calorie preview + save */}
          <div className="flex items-center justify-between">
            <p className="text-emerald-400 font-bold text-lg">
              ≈ {preview ? preview.calories : Math.round(meal.calories * (quantity / meal.quantity))} kcal
            </p>
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
            >
              {t('edit.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
