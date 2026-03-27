'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useI18n } from '@/components/I18nProvider'
import { createRecipe, scaleNutrition, sumNutrition, divideNutrition, RecipeIngredient } from '@/lib/recipes'
import { searchFoods, FoodItem, NutritionFacts, getFoodByBarcode } from '@/lib/usda'
import { searchCommunityFoods } from '@/lib/communityFoods'
import { getPortionsForFood, PortionUnit } from '@/lib/portions'
import { BarcodeScanner } from '@/components/BarcodeScanner'

const SERVING_OPTIONS = [1, 2, 3, 4, 6, 8, 12]
const UNIT_OPTIONS = ['g', 'oz', 'ml', 'porción']

const EMPTY_NUTRITION: NutritionFacts = {
  calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
}

interface IngredientEntry {
  id: string
  foodName: string
  baseNutrition: NutritionFacts  // per 100g
  quantity: number
  unit: string
  scaledNutrition: NutritionFacts
  portions: PortionUnit[]
}

export default function NewRecipePage() {
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState(4)
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([])

  const [foodQuery, setFoodQuery] = useState('')
  const [foodResults, setFoodResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  async function doSearch(q: string) {
    if (q.trim().length < 2) return
    setSearching(true)
    setHasSearched(true)
    try {
      const [usdaResult, communityResult] = await Promise.allSettled([
        searchFoods(q),
        searchCommunityFoods(q),
      ])
      const usdaResults = usdaResult.status === 'fulfilled' ? usdaResult.value : []
      const communityResults = communityResult.status === 'fulfilled' ? communityResult.value : []
      const communityAsFoodItems: FoodItem[] = communityResults.map(cf => ({
        fdcId: -1,
        description: cf.name,
        brandOwner: cf.brand,
        nutrition: cf.nutrition,
      }))
      setFoodResults([...communityAsFoodItems, ...usdaResults].slice(0, 15))
    } catch {
      setFoodResults([])
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

  function addFoodToIngredients(food: FoodItem) {
    const portions = getPortionsForFood(food.description)
    // If there are common portions, use the first one as default quantity
    const defaultQty = portions.length > 0 ? portions[0].grams : 100
    const entry: IngredientEntry = {
      id: crypto.randomUUID(),
      foodName: food.description,
      baseNutrition: food.nutrition,
      quantity: defaultQty,
      unit: 'g',
      scaledNutrition: scaleNutrition(food.nutrition, defaultQty),
      portions,
    }
    setIngredients(prev => [...prev, entry])
    setFoodResults([])
    setFoodQuery('')
    setHasSearched(false)
  }

  function handleBarcodeFound(food: FoodItem) {
    setShowScanner(false)
    addFoodToIngredients(food)
  }

  function handleQtyChange(id: string, qty: number) {
    setIngredients(prev => prev.map(ing => {
      if (ing.id !== id) return ing
      return { ...ing, quantity: qty, scaledNutrition: scaleNutrition(ing.baseNutrition, qty) }
    }))
  }

  function handlePortionClick(id: string, grams: number) {
    setIngredients(prev => prev.map(ing => {
      if (ing.id !== id) return ing
      return { ...ing, quantity: grams, unit: 'g', scaledNutrition: scaleNutrition(ing.baseNutrition, grams) }
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
    if (ingredients.length === 0) { setError('Agrega al menos un ingrediente'); return }
    setSaving(true)
    setError(null)
    try {
      const recipeIngredients: RecipeIngredient[] = ingredients.map(ing => ({
        foodName: ing.foodName,
        quantity: ing.quantity,
        unit: ing.unit,
        nutrition: ing.scaledNutrition,
      }))

      // Build the recipe data — strip undefined fields to avoid Firestore rejection
      const recipeData: Parameters<typeof createRecipe>[2] = {
        name: name.trim(),
        servings,
        ingredients: recipeIngredients,
        nutrition: perServing,
        totalNutrition,
      }
      // Only include description if non-empty
      const trimmedDesc = description.trim()
      if (trimmedDesc) recipeData.description = trimmedDesc

      await createRecipe(user.uid, user.displayName, recipeData)
      setSaveSuccess(true)
      // Show success briefly then redirect
      setTimeout(() => router.push('/dashboard/recipes'), 1200)
    } catch (e) {
      setError(`Error al guardar: ${String(e)}`)
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">{t('recipes.back')}</button>
        <h1 className="text-2xl font-bold text-white">{t('recipes.new')}</h1>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-emerald-400">✓</span>
          <span className="text-emerald-300 text-sm">{t('recipes.saved')}</span>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="text-sm text-gray-400 block mb-1">{t('recipes.name')} *</label>
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

      {/* Ingredients section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-2">{t('recipes.ingredients')}</h2>

        {/* Search input */}
        <div className="relative mb-2">
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

        {/* Barcode scanner button */}
        <button
          onClick={() => setShowScanner(!showScanner)}
          className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-2.5 rounded-xl transition-colors text-sm mb-3"
        >
          📷 {showScanner ? t('food.stopScan') : t('food.scanBarcode')}
        </button>

        {/* Food search results */}
        {foodResults.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-3">
            {foodResults.map((food, idx) => (
              <button
                key={`${food.fdcId}-${idx}`}
                onClick={() => addFoodToIngredients(food)}
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

        {/* Added ingredients list */}
        <div className="space-y-2">
          {ingredients.map(ing => (
            <div key={ing.id} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-white text-sm font-medium flex-1 truncate">{ing.foodName}</p>
                <button
                  onClick={() => handleRemove(ing.id)}
                  className="text-gray-500 hover:text-red-400 text-lg leading-none shrink-0"
                >
                  ×
                </button>
              </div>

              {/* Quick portion buttons */}
              {ing.portions.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2 scrollbar-hide">
                  {ing.portions.map(portion => {
                    const label = locale === 'en' ? portion.labelEn : portion.labelEs
                    const isActive = ing.quantity === portion.grams && ing.unit === 'g'
                    return (
                      <button
                        key={`${portion.labelEn}:${portion.grams}`}
                        onClick={() => handlePortionClick(ing.id, portion.grams)}
                        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                          isActive
                            ? 'bg-emerald-900 border-emerald-400 text-emerald-300'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-emerald-600'
                        }`}
                      >
                        {portion.icon && <span>{portion.icon}</span>}
                        <span>{label}</span>
                        <span className="text-gray-400">· {portion.grams}g</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Qty + unit + calories */}
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={ing.quantity}
                  min={1}
                  onChange={e => handleQtyChange(ing.id, Number(e.target.value))}
                  className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-emerald-600"
                />
                <select
                  value={ing.unit}
                  onChange={e => handleUnitChange(ing.id, e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none"
                >
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <span className="text-emerald-400 text-sm ml-auto font-medium">
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
          {ingredients.length === 0 ? t('recipes.noIngredients') : `${t('recipes.perServing')} (÷${servings})`}
        </h2>
        {ingredients.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Kcal', value: Math.round(perServing.calories), color: 'text-emerald-400' },
              { label: 'Proteína', value: `${Math.round(perServing.protein * 10) / 10}g`, color: 'text-blue-400' },
              { label: 'Carbs', value: `${Math.round(perServing.carbs * 10) / 10}g`, color: 'text-yellow-400' },
              { label: 'Grasa', value: `${Math.round(perServing.fat * 10) / 10}g`, color: 'text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim() || ingredients.length === 0}
        className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? '...' : t('recipes.save')}
      </button>

      {/* Barcode scanner modal */}
      {showScanner && (
        <BarcodeScanner
          onFound={handleBarcodeFound}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
