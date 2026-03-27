'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useI18n } from '@/components/I18nProvider'
import { createRecipe, scaleNutrition, sumNutrition, divideNutrition, RecipeIngredient } from '@/lib/recipes'
import { searchFoods, FoodItem, NutritionFacts } from '@/lib/usda'
import { searchCommunityFoods } from '@/lib/communityFoods'

const SERVING_OPTIONS = [1, 2, 3, 4, 6, 8, 12]
const UNIT_OPTIONS = ['g', 'oz', 'ml', 'portion']

const EMPTY_NUTRITION: NutritionFacts = {
  calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
}

interface IngredientEntry {
  id: string
  foodName: string
  baseNutrition: NutritionFacts  // per 100g/unit
  quantity: number
  unit: string
  scaledNutrition: NutritionFacts
}

export default function NewRecipePage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState(4)
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([])

  const [foodQuery, setFoodQuery] = useState('')
  const [foodResults, setFoodResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  async function doSearch(q: string) {
    if (q.trim().length < 2) return
    setSearching(true)
    setHasSearched(true)
    try {
      const [usda, community] = await Promise.all([
        searchFoods(q),
        searchCommunityFoods(q),
      ])
      const communityAsFoodItems: FoodItem[] = community.map(cf => ({
        fdcId: -1,  // marker for community, unique key handled via index+description
        description: cf.name,
        brandOwner: cf.brand,
        nutrition: cf.nutrition,
      }))
      setFoodResults([...communityAsFoodItems, ...usda].slice(0, 15))
    } finally {
      setSearching(false)
    }
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setFoodQuery(val)
    setHasSearched(false)
    setFoodResults([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) return
    debounceRef.current = setTimeout(() => doSearch(val), 400)
  }

  function handleAddIngredient(food: FoodItem) {
    const entry: IngredientEntry = {
      id: crypto.randomUUID(),
      foodName: food.description,
      baseNutrition: food.nutrition,
      quantity: 100,
      unit: 'g',
      scaledNutrition: scaleNutrition(food.nutrition, 100),
    }
    setIngredients(prev => [...prev, entry])
    setFoodResults([])
    setFoodQuery('')
  }

  function handleQtyChange(id: string, qty: number) {
    setIngredients(prev => prev.map(ing => {
      if (ing.id !== id) return ing
      return { ...ing, quantity: qty, scaledNutrition: scaleNutrition(ing.baseNutrition, qty) }
    }))
  }

  function handleUnitChange(id: string, unit: string) {
    setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, unit } : ing))
  }

  function handleRemove(id: string) {
    setIngredients(prev => prev.filter(ing => ing.id !== id))
  }

  const totalNutrition = ingredients.length > 0
    ? sumNutrition(ingredients.map(i => i.scaledNutrition))
    : EMPTY_NUTRITION
  const perServing = divideNutrition(totalNutrition, servings)

  async function handleSave() {
    if (!user) return
    if (!name.trim()) { setError('El nombre es requerido'); return }
    setSaving(true)
    try {
      const recipeIngredients: RecipeIngredient[] = ingredients.map(ing => ({
        foodName: ing.foodName,
        quantity: ing.quantity,
        unit: ing.unit,
        nutrition: ing.scaledNutrition,
      }))
      await createRecipe(user.uid, user.displayName, {
        name: name.trim(),
        description: description.trim() || undefined,
        servings,
        ingredients: recipeIngredients,
        nutrition: perServing,
        totalNutrition,
      })
      router.push('/dashboard/recipes')
    } catch {
      setError('Error al guardar')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">{t('recipes.back')}</button>
        <h1 className="text-2xl font-bold text-white">{t('recipes.new')}</h1>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Name */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">{t('recipes.name')}</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('recipes.namePlaceholder')}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-600"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">{t('recipes.description')}</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('recipes.descPlaceholder')}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-600"
        />
      </div>

      {/* Servings */}
      <div>
        <label className="text-sm text-gray-400 block mb-2">{t('recipes.servings')}</label>
        <div className="flex flex-wrap gap-2">
          {SERVING_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setServings(n)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                servings === n
                  ? 'bg-emerald-700 border-emerald-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-2">{t('recipes.ingredients')}</h2>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            value={foodQuery}
            onChange={handleQueryChange}
            onKeyDown={e => e.key === 'Enter' && doSearch(foodQuery)}
            placeholder={t('recipes.searchFood')}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-600 text-sm pr-10"
          />
          {searching && (
            <div className="absolute right-3 top-3 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Food results */}
        {foodResults.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-3">
            {foodResults.map((food, idx) => (
              <button
                key={`${food.fdcId}-${idx}`}
                onClick={() => handleAddIngredient(food)}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-700 border-b border-gray-700 last:border-0 transition-colors"
              >
                <p className="text-white text-sm truncate">{food.description}</p>
                {food.brandOwner && <p className="text-gray-500 text-xs">{food.brandOwner}</p>}
                <p className="text-emerald-400 text-xs">{Math.round(food.nutrition.calories)} kcal/100g</p>
              </button>
            ))}
          </div>
        )}

        {hasSearched && !searching && foodResults.length === 0 && foodQuery.trim().length >= 2 && (
          <p className="text-gray-500 text-sm mb-3">{t('recipes.noIngredientSearch')}</p>
        )}

        {/* Added ingredients */}
        <div className="space-y-2">
          {ingredients.map(ing => (
            <div key={ing.id} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-white text-sm font-medium flex-1 truncate">{ing.foodName}</p>
                <button
                  onClick={() => handleRemove(ing.id)}
                  className="text-gray-500 hover:text-red-400 text-lg leading-none shrink-0"
                >
                  {t('recipes.removeIngredient')}
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={ing.quantity}
                  min={1}
                  onChange={e => handleQtyChange(ing.id, Number(e.target.value))}
                  className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-emerald-600"
                />
                <select
                  value={ing.unit}
                  onChange={e => handleUnitChange(ing.id, e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
                >
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <span className="text-emerald-400 text-sm ml-auto">
                  {Math.round(ing.scaledNutrition.calories)} kcal
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition preview */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">
          {ingredients.length === 0 ? t('recipes.noIngredients') : t('recipes.perServing')}
        </h2>
        {ingredients.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Kcal', value: Math.round(perServing.calories), color: 'text-emerald-400' },
              { label: 'Proteína', value: `${Math.round(perServing.protein)}g`, color: 'text-blue-400' },
              { label: 'Carbs', value: `${Math.round(perServing.carbs)}g`, color: 'text-yellow-400' },
              { label: 'Grasa', value: `${Math.round(perServing.fat)}g`, color: 'text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? '...' : t('recipes.save')}
      </button>
    </div>
  )
}
