'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useI18n } from '@/components/I18nProvider'
import { getUserRecipes, searchRecipes, Recipe } from '@/lib/recipes'

export default function RecipesPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([])
  const [searchResults, setSearchResults] = useState<Recipe[]>([])
  const [query, setQuery] = useState('')
  const [loadingMine, setLoadingMine] = useState(true)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return
    getUserRecipes(user.uid).then(r => {
      setMyRecipes(r)
      setLoadingMine(false)
    })
  }, [user])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchRecipes(query)
      setSearchResults(results)
      setSearching(false)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function RecipeCard({ recipe }: { recipe: Recipe }) {
    const isOwn = user?.uid === recipe.createdBy
    return (
      <button
        onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-left hover:border-gray-500 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">{isOwn ? '⭐' : '👥'}</span>
              <p className="text-white font-medium truncate">{recipe.name}</p>
            </div>
            {recipe.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{recipe.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {t('recipes.yieldsServings', { n: recipe.servings })}
              {recipe.createdByName && !isOwn && (
                <span className="text-gray-600"> · {t('recipes.by')} {recipe.createdByName}</span>
              )}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-emerald-400 font-semibold">{Math.round(recipe.nutrition.calories)}</p>
            <p className="text-xs text-gray-500">{t('recipes.calPerServing')}</p>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">{t('recipes.back')}</button>
        <h1 className="text-2xl font-bold text-white flex-1">{t('recipes.title')}</h1>
        <button
          onClick={() => router.push('/dashboard/recipes/new')}
          className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
        >
          + {t('recipes.new')}
        </button>
      </div>

      {/* My recipes */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-2">{t('recipes.myRecipes')}</h2>
        {loadingMine ? (
          <p className="text-gray-500 text-sm animate-pulse">{t('dashboard.loading')}</p>
        ) : myRecipes.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('recipes.noRecipes')}</p>
        ) : (
          <div className="space-y-2">
            {myRecipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        )}
      </div>

      {/* Community search */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-2">{t('recipes.communityRecipes')}</h2>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('recipes.search')}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-600"
        />
        {searching && <p className="text-gray-500 text-sm mt-2 animate-pulse">{t('dashboard.loading')}</p>}
        {!searching && query.trim() && searchResults.length === 0 && (
          <p className="text-gray-500 text-sm mt-2">{t('recipes.noResults')}</p>
        )}
        {searchResults.length > 0 && (
          <div className="space-y-2 mt-2">
            {searchResults.map(r => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}
