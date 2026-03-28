'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { addCommunityFood, AddFoodFormData } from '@/lib/communityFoods'
import { useI18n } from '@/components/I18nProvider'
import { useAuth } from '@/components/AuthProvider'

const schema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  servingSize: z.coerce.number().min(1).max(10000),
  unit: z.enum(['g', 'ml', 'oz', 'cup', 'piece']),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  fiber: z.coerce.number().min(0),
  sugar: z.coerce.number().min(0),
  sodium: z.coerce.number().min(0),
  cholesterol: z.coerce.number().min(0),
})

type FormValues = z.infer<typeof schema>

export default function AddCustomFoodPage() {
  const router = useRouter()
  const { t } = useI18n()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      servingSize: 100,
      unit: 'g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    },
  })

  // Watch live values for the per-100g preview
  const watchedValues = watch()
  const servingSize = Number(watchedValues.servingSize) || 100
  const ratio = servingSize > 0 ? 100 / servingSize : 1
  const showPer100Preview = servingSize !== 100

  function per100(val: number) {
    return Math.round(val * ratio * 10) / 10
  }

  async function onSubmit(values: FormValues) {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data: AddFoodFormData = {
        name: values.name,
        brand: values.brand || undefined,
        servingSize: values.servingSize,
        unit: values.unit,
        calories: values.calories,
        protein: values.protein,
        carbs: values.carbs,
        fat: values.fat,
        fiber: values.fiber,
        sugar: values.sugar,
        sodium: values.sodium,
        cholesterol: values.cholesterol,
      }
      await addCommunityFood(user.uid, user.displayName, data)
      setSuccess(true)
      reset()
      setTimeout(() => router.back(), 1500)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors'
  const labelClass = 'block text-gray-400 text-xs mb-1'

  const NUTRITION_FIELDS: [keyof FormValues, string, string][] = [
    ['calories', 'kcal', 'Calorías'],
    ['protein', 'g', 'Proteína'],
    ['carbs', 'g', 'Carbs'],
    ['fat', 'g', 'Grasa'],
    ['fiber', 'g', 'Fibra'],
    ['sugar', 'g', 'Azúcar'],
    ['sodium', 'mg', 'Sodio'],
    ['cholesterol', 'mg', 'Colesterol'],
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
          {t('food.back')}
        </button>
        <h1 className="text-2xl font-bold text-white">{t('communityFood.pageTitle')}</h1>
      </div>

      {/* Info banner */}
      <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-emerald-400 text-xl">👥</span>
        <p className="text-emerald-300 text-sm">{t('communityFood.pageDescription')}</p>
      </div>

      {/* Success message */}
      {success && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-emerald-400">✓</span>
          <span className="text-emerald-300 text-sm">{t('communityFood.success')}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic info */}
        <div className="bg-gray-800/50 rounded-2xl p-4 space-y-4 border border-gray-700">
          <p className="text-white font-medium text-sm">{t('communityFood.sectionBasic')}</p>

          <div>
            <label className={labelClass}>{t('communityFood.name')} *</label>
            <input
              {...register('name')}
              className={inputClass}
              placeholder={t('communityFood.namePlaceholder')}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{t('common.required')}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>{t('communityFood.brand')}</label>
            <input
              {...register('brand')}
              className={inputClass}
              placeholder={t('communityFood.brandPlaceholder')}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>{t('communityFood.servingSize')} *</label>
              <input
                {...register('servingSize')}
                type="number"
                min="1"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('communityFood.unit')}</label>
              <select
                {...register('unit')}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="g">{t('communityFood.units.g')}</option>
                <option value="ml">{t('communityFood.units.ml')}</option>
                <option value="oz">{t('communityFood.units.oz')}</option>
                <option value="cup">{t('communityFood.units.cup')}</option>
                <option value="piece">{t('communityFood.units.piece')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Nutrition info */}
        <div className="bg-gray-800/50 rounded-2xl p-4 space-y-4 border border-gray-700">
          <div>
            <p className="text-white font-medium text-sm">
              {t('communityFood.nutrition')}
              <span className="text-gray-400 font-normal ml-1 text-xs">
                — por {servingSize}{watchedValues.unit !== 'piece' && watchedValues.unit !== 'cup' ? watchedValues.unit : ''} (1 porción)
              </span>
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              Ingresa los valores tal como aparecen en la etiqueta nutricional de tu producto.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {NUTRITION_FIELDS.map(([field, unit, label]) => (
              <div key={field}>
                <label className={labelClass}>{label} ({unit})</label>
                <input
                  {...register(field)}
                  type="number"
                  step="0.1"
                  min="0"
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {/* Per-100g preview when serving size ≠ 100 */}
          {showPer100Preview && (
            <div className="bg-gray-900/60 border border-gray-600 rounded-xl px-4 py-3">
              <p className="text-gray-400 text-xs mb-2">
                ℹ️ Se guardará normalizado a <span className="text-white font-medium">por 100{watchedValues.unit !== 'piece' && watchedValues.unit !== 'cup' ? watchedValues.unit : ''}</span>:
              </p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { label: 'Kcal', value: per100(Number(watchedValues.calories) || 0), color: 'text-emerald-400' },
                  { label: 'Proteína', value: `${per100(Number(watchedValues.protein) || 0)}g`, color: 'text-blue-400' },
                  { label: 'Carbs', value: `${per100(Number(watchedValues.carbs) || 0)}g`, color: 'text-yellow-400' },
                  { label: 'Grasa', value: `${per100(Number(watchedValues.fat) || 0)}g`, color: 'text-orange-400' },
                ].map(m => (
                  <div key={m.label} className="bg-gray-800 rounded-lg py-1.5">
                    <p className={`font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-gray-500">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-700 text-gray-300 hover:text-white rounded-xl py-3 text-sm font-medium transition-colors"
          >
            {t('communityFood.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {loading ? '...' : t('communityFood.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
