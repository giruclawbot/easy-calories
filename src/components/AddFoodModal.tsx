'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { addCommunityFood, CommunityFood, AddFoodFormData } from '@/lib/communityFoods'
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

interface Props {
  onAdd: (food: CommunityFood) => void
  onClose: () => void
}

export function AddFoodModal({ onAdd, onClose }: Props) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { servingSize: 100, unit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 },
  })

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
      const food = await addCommunityFood(user.uid, user.displayName, data)
      onAdd(food)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500'
  const labelClass = 'block text-gray-400 text-xs mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        className="bg-zinc-900 rounded-2xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">{t('communityFood.modalTitle')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Name */}
          <div>
            <label className={labelClass}>{t('communityFood.name')} *</label>
            <input {...register('name')} className={inputClass} placeholder="Ej: Tortilla de maíz" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{t('communityFood.name')}</p>}
          </div>

          {/* Brand */}
          <div>
            <label className={labelClass}>{t('communityFood.brand')}</label>
            <input {...register('brand')} className={inputClass} placeholder="Ej: Maseca" />
          </div>

          {/* Serving */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelClass}>{t('communityFood.servingSize')}</label>
              <input {...register('servingSize')} type="number" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('communityFood.unit')}</label>
              <select {...register('unit')} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="g">{t('communityFood.units.g')}</option>
                <option value="ml">{t('communityFood.units.ml')}</option>
                <option value="oz">{t('communityFood.units.oz')}</option>
                <option value="cup">{t('communityFood.units.cup')}</option>
                <option value="piece">{t('communityFood.units.piece')}</option>
              </select>
            </div>
          </div>

          {/* Nutrition */}
          <p className="text-gray-400 text-xs font-medium pt-1">{t('communityFood.nutrition')} (por porción)</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['calories', 'kcal'],
              ['protein', 'g'],
              ['carbs', 'g'],
              ['fat', 'g'],
              ['fiber', 'g'],
              ['sugar', 'g'],
              ['sodium', 'mg'],
              ['cholesterol', 'mg'],
            ] as const).map(([field, unit]) => (
              <div key={field}>
                <label className={labelClass}>{field.charAt(0).toUpperCase() + field.slice(1)} ({unit})</label>
                <input {...register(field)} type="number" step="0.1" className={inputClass} />
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-700 text-gray-300 hover:text-white rounded-xl py-2.5 text-sm transition-colors"
            >
              {t('communityFood.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              {loading ? '...' : t('communityFood.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
