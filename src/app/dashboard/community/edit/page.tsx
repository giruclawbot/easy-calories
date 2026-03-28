'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase'
import { updateCommunityFood, deleteCommunityFood, type CommunityFood } from '@/lib/communityFoods'
import { useAuth } from '@/components/AuthProvider'
import { useI18n } from '@/components/I18nProvider'

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

export default function EditCommunityFoodPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const foodId = searchParams.get('id')
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const [food, setFood] = useState<CommunityFood | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  useEffect(() => {
    if (!foodId || authLoading) return
    const db = getFirebaseDb()
    if (!db) return
    getDoc(doc(db, 'communityFoods', foodId)).then(snap => {
      if (!snap.exists()) { setLoadError('Alimento no encontrado'); return }
      const data = snap.data() as CommunityFood
      setFood(data)
      // Convert from per-100g back to original serving
      const s = data.servingSize ?? 100
      const invRatio = s / 100
      reset({
        name: data.name,
        brand: data.brand ?? '',
        servingSize: s,
        unit: data.unit as FormValues['unit'],
        calories:    Math.round(data.nutrition.calories    * invRatio * 10) / 10,
        protein:     Math.round(data.nutrition.protein     * invRatio * 10) / 10,
        carbs:       Math.round(data.nutrition.carbs       * invRatio * 10) / 10,
        fat:         Math.round(data.nutrition.fat         * invRatio * 10) / 10,
        fiber:       Math.round(data.nutrition.fiber       * invRatio * 10) / 10,
        sugar:       Math.round(data.nutrition.sugar       * invRatio * 10) / 10,
        sodium:      Math.round(data.nutrition.sodium      * invRatio * 10) / 10,
        cholesterol: Math.round(data.nutrition.cholesterol * invRatio * 10) / 10,
      })
    }).catch(e => setLoadError(String(e)))
  }, [foodId, authLoading, reset])

  const watchedValues = watch()
  const servingSize = Number(watchedValues.servingSize) || 100
  const ratio = servingSize > 0 ? 100 / servingSize : 1
  const showPer100Preview = servingSize !== 100

  function per100(val: number) {
    return Math.round(val * ratio * 10) / 10
  }

  async function onSubmit(values: FormValues) {
    if (!foodId) return
    setSaving(true)
    setError(null)
    try {
      await updateCommunityFood(foodId, {
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
      })
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/community'), 1500)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!foodId) return
    setDeleting(true)
    try {
      await deleteCommunityFood(foodId)
      router.push('/dashboard/community')
    } catch (e) {
      setError(String(e))
      setDeleting(false)
    }
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors'
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

  if (authLoading || (!food && !loadError)) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">← Atrás</button>
        <p className="text-red-400">{loadError}</p>
      </div>
    )
  }

  if (food && user && food.createdBy !== user.uid) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">← Atrás</button>
        <p className="text-yellow-400">No tienes permiso para editar este alimento</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
          {t('food.back')}
        </button>
        <h1 className="text-2xl font-bold text-white">Editar alimento</h1>
      </div>

      {success && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-emerald-400">✓</span>
          <span className="text-emerald-300 text-sm">¡Cambios guardados!</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-gray-800/50 rounded-2xl p-4 space-y-4 border border-gray-700">
          <p className="text-white font-medium text-sm">Información básica</p>
          <div>
            <label className={labelClass}>Nombre *</label>
            <input {...register('name')} className={inputClass} />
            {errors.name && <p className="text-red-400 text-xs mt-1">Requerido</p>}
          </div>
          <div>
            <label className={labelClass}>Marca</label>
            <input {...register('brand')} className={inputClass} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>Tamaño de porción *</label>
              <input {...register('servingSize')} type="number" min="1" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Unidad</label>
              <select {...register('unit')} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="oz">oz</option>
                <option value="cup">taza</option>
                <option value="piece">pieza</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-4 space-y-4 border border-gray-700">
          <p className="text-white font-medium text-sm">
            Información nutricional
            <span className="text-gray-400 font-normal ml-1 text-xs">— por {servingSize} {watchedValues.unit !== 'piece' && watchedValues.unit !== 'cup' ? watchedValues.unit : ''} (1 porción)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {NUTRITION_FIELDS.map(([field, unit, label]) => (
              <div key={field}>
                <label className={labelClass}>{label} ({unit})</label>
                <input {...register(field)} type="number" step="0.1" min="0" className={inputClass} />
              </div>
            ))}
          </div>
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-700 text-gray-300 hover:text-white rounded-xl py-3 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || success}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {saving ? '...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* Delete section */}
      <div className="border border-red-900/50 rounded-2xl p-4 space-y-3">
        <p className="text-red-400 text-sm font-medium">Zona de peligro</p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full border border-red-700 text-red-400 hover:bg-red-900/20 rounded-xl py-3 text-sm font-medium transition-colors"
          >
            🗑️ Eliminar alimento
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-yellow-400 text-xs">¿Eliminar este alimento? No se puede deshacer.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-gray-700 text-gray-300 rounded-xl py-2.5 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                {deleting ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
