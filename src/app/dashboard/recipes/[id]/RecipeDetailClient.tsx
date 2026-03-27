'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { useAuth } from '@/components/AuthProvider'
import { useI18n } from '@/components/I18nProvider'
import { getRecipe, deleteRecipe, updateRecipe, Recipe } from '@/lib/recipes'
import { addMeal, trackFoodUsage } from '@/lib/firestore'
import { logger } from '@/lib/logger'
import type { Meal } from '@/lib/firestore'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const SERVING_OPTIONS = [0.5, 1, 1.5, 2, 3, 4]
const MEAL_TYPES: { type: MealType; emoji: string; label: string }[] = [
  { type: 'breakfast', emoji: '🌅', label: 'breakfast' },
  { type: 'lunch', emoji: '☀️', label: 'lunch' },
  { type: 'dinner', emoji: '🌙', label: 'dinner' },
  { type: 'snack', emoji: '🍎', label: 'snack' },
]

export default function RecipeDetailClient() {
  const { user } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  // Prefer query param (?id=...) to support static export routes like /recipes/view?id=...
  // Fallback to dynamic segment /recipes/[id] for local/dev compatibility
  const id = searchParams.get('id') || (params?.id as string | undefined)

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedServings, setSelectedServings] = useState(1)
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editServings, setEditServings] = useState(1)
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) {
      logger.warn('recipe-detail', 'load', 'No recipe ID in params')
      setLoading(false)
      return
    }
    logger.info('recipe-detail', 'load', `Loading recipe ${id}`)
    getRecipe(id).then(r => {
      if (r) {
        logger.info('recipe-detail', 'load', `Recipe loaded: "${r.name}"`)
      } else {
        logger.warn('recipe-detail', 'load', `Recipe not found: ${id}`)
      }
      setRecipe(r)
      if (r) {
        setEditName(r.name)
        setEditDesc(r.description || '')
        setEditServings(r.servings)
      }
      setLoading(false)
    }).catch(e => {
      logger.error('recipe-detail', 'load', 'Failed to load recipe', e)
      setLoading(false)
    })
  }, [id])

  async function handleAddToLog() {
    if (!user || !recipe) return
    setAdding(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const scaledNutrition = {
      calories: recipe.nutrition.calories * selectedServings,
      protein: recipe.nutrition.protein * selectedServings,
      carbs: recipe.nutrition.carbs * selectedServings,
      fat: recipe.nutrition.fat * selectedServings,
      fiber: recipe.nutrition.fiber * selectedServings,
      sugar: recipe.nutrition.sugar * selectedServings,
      sodium: recipe.nutrition.sodium * selectedServings,
      cholesterol: recipe.nutrition.cholesterol * selectedServings,
    }
    const meal: Meal = {
      id: Date.now().toString(),
      foodName: `${recipe.name} (${selectedServings} ${selectedServings === 1 ? 'porción' : 'porciones'})`,
      calories: Math.round(scaledNutrition.calories),
      quantity: selectedServings,
      unit: 'serving',
      timestamp: new Date().toISOString(),
      mealType,
      nutrition: {
        calories: Math.round(scaledNutrition.calories),
        protein: Math.round(scaledNutrition.protein * 10) / 10,
        carbs: Math.round(scaledNutrition.carbs * 10) / 10,
        fat: Math.round(scaledNutrition.fat * 10) / 10,
        fiber: Math.round(scaledNutrition.fiber * 10) / 10,
        sugar: Math.round(scaledNutrition.sugar * 10) / 10,
        sodium: Math.round(scaledNutrition.sodium * 10) / 10,
        cholesterol: Math.round(scaledNutrition.cholesterol * 10) / 10,
      },
    }
    await addMeal(user.uid, today, meal)
    trackFoodUsage(user.uid, meal).catch(() => {})
    setAdding(false)
    setAdded(true)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  async function handleSaveEdit() {
    if (!user || !recipe) return
    setSaving(true)
    await updateRecipe(user.uid, recipe.id, {
      name: editName.trim() || recipe.name,
      description: editDesc.trim() || undefined,
      servings: editServings,
    })
    setRecipe(prev => prev ? {
      ...prev,
      name: editName.trim() || prev.name,
      description: editDesc.trim() || undefined,
      servings: editServings,
    } : prev)
    setSaving(false)
    setEditMode(false)
  }

  async function handleDelete() {
    if (!user || !recipe) return
    setDeleting(true)
    await deleteRecipe(user.uid, recipe.id)
    router.push('/dashboard/recipes')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
        <div className="w-5 h-5 border-2 border-gray-600 border-t-emerald-500 rounded-full animate-spin" />
        <span>{t('dashboard.loading')}</span>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-gray-400">Receta no encontrada</p>
        <button
          onClick={() => router.push('/dashboard/recipes')}
          className="text-emerald-400 hover:text-emerald-300 text-sm underline"
        >
          ← Volver a Recetas
        </button>
      </div>
    )
  }

  const isOwner = user?.uid === recipe.createdBy

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/recipes')} className="text-gray-400 hover:text-white">{t('recipes.back')}</button>
        <h1 className="text-2xl font-bold text-white flex-1">{recipe.name}</h1>
      </div>

      {/* Meta */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 space-y-1">
        {recipe.description && <p className="text-gray-300 text-sm">{recipe.description}</p>}
        <p className="text-gray-400 text-sm">{t('recipes.yieldsServings', { n: recipe.servings })}</p>
        {recipe.createdByName && (
          <p className="text-gray-500 text-xs">{t('recipes.by')} {recipe.createdByName}</p>
        )}
      </div>

      {/* Ingredients */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-2">{t('recipes.ingredients')}</h2>
        <div className="space-y-1">
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
              <div>
                <p className="text-white text-sm">{ing.foodName}</p>
                <p className="text-gray-500 text-xs">{ing.quantity}{ing.unit}</p>
              </div>
              <p className="text-emerald-400 text-sm">{Math.round(ing.nutrition.calories)} kcal</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition per serving */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-2">{t('recipes.perServing')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Kcal', value: Math.round(recipe.nutrition.calories), color: 'text-emerald-400' },
            { label: 'Proteína', value: `${Math.round(recipe.nutrition.protein)}g`, color: 'text-blue-400' },
            { label: 'Carbs', value: `${Math.round(recipe.nutrition.carbs)}g`, color: 'text-yellow-400' },
            { label: 'Grasa', value: `${Math.round(recipe.nutrition.fat)}g`, color: 'text-orange-400' },
            { label: 'Fibra', value: `${Math.round(recipe.nutrition.fiber)}g`, color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add to log */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400">{t('recipes.addToLog')}</h2>

        {/* Servings selector */}
        <div>
          <p className="text-xs text-gray-500 mb-2">{t('recipes.servingsToAdd')}</p>
          <div className="flex flex-wrap gap-2">
            {SERVING_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setSelectedServings(n)}
                className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                  selectedServings === n
                    ? 'bg-emerald-700 border-emerald-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Meal type */}
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map(({ type, emoji }) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
                mealType === type
                  ? 'bg-emerald-700 border-emerald-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <span>{type}</span>
            </button>
          ))}
        </div>

        {/* Calorie preview */}
        <p className="text-center text-emerald-400 font-semibold">
          {Math.round(recipe.nutrition.calories * selectedServings)} kcal
        </p>

        {added ? (
          <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl px-4 py-3 text-emerald-300 text-sm text-center">
            ✓ {t('recipes.addedToLog')}
          </div>
        ) : (
          <button
            onClick={handleAddToLog}
            disabled={adding}
            className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {adding ? '...' : t('recipes.addToLog')}
          </button>
        )}
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div className="space-y-3">
          {editMode ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-400">{t('recipes.edit')}</h2>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder={t('recipes.namePlaceholder')}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-600"
              />
              <input
                type="text"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder={t('recipes.descPlaceholder')}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-600"
              />
              <div>
                <p className="text-xs text-gray-500 mb-2">{t('recipes.servings')}</p>
                <div className="flex flex-wrap gap-2">
                  {[1,2,3,4,6,8,12].map(n => (
                    <button
                      key={n}
                      onClick={() => setEditServings(n)}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                        editServings === n
                          ? 'bg-emerald-700 border-emerald-500 text-white'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  {saving ? '...' : t('recipes.save')}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  {t('recipes.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-colors"
            >
              ✏️ {t('recipes.edit')}
            </button>
          )}

          {confirmDelete ? (
            <div className="bg-red-900/20 border border-red-700 rounded-xl px-4 py-4 space-y-3">
              <p className="text-red-300 text-sm">{t('recipes.confirmDelete')}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-700 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  {deleting ? '...' : t('recipes.delete')}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  {t('recipes.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-red-800 text-red-400 font-medium py-3 rounded-xl transition-colors"
            >
              🗑️ {t('recipes.delete')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
