'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useI18n } from '@/components/I18nProvider'
import { getUserRecipes, searchRecipes, Recipe } from '@/lib/recipes'
import { logger } from '@/lib/logger'

export default function RecipesPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([])
  const [searchResults, setSearchResults] = useState<Recipe[]>([])
  const [query, setQuery] = useState('')
  const [loadingMine, setLoadingMine] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return
    // Auth done but no user — stop loading
    if (!user) {
      setLoadingMine(false)
      return
    }
    setLoadingMine(true)
    setLoadError(null)
    getUserRecipes(user.uid)
      .then(r => {
        logger.info('recipes-page', 'loadMyRecipes', `Loaded ${r.length} recipes`)
        setMyRecipes(r)
      })
      .catch(e => {
        logger.error('recipes-page', 'loadMyRecipes', 'Failed to load recipes', e)
        setLoadError(String(e))
      })
      .finally(() => setLoadingMine(false))
  }, [user, authLoading])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchRecipes(query)
        setSearchResults(results)
      } catch (e) {
        logger.error('recipes-page', 'searchRecipes', 'Search failed', e)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
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
        {loadingMine || authLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-emerald-500 rounded-full animate-spin" />
            <span>{t('dashboard.loading')}</span>
          </div>
        ) : loadError ? (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">Error al cargar recetas: {loadError}</p>
            <button
              onClick={() => { setLoadingMine(true); getUserRecipes(user!.uid).then(setMyRecipes).finally(() => setLoadingMine(false)) }}
              className="text-red-300 text-xs mt-1 underline"
            >
              Reintentar
            </button>
          </div>
        ) : myRecipes.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-6 text-center">
            <p className="text-gray-400 text-sm mb-3">{t('recipes.noRecipes')}</p>
            <button
              onClick={() => router.push('/dashboard/recipes/new')}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              + {t('recipes.new')}
            </button>
          </div>
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
        {searching && (
          <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
            <div className="w-3 h-3 border-2 border-gray-600 border-t-emerald-500 rounded-full animate-spin" />
            <span>{t('dashboard.loading')}</span>
          </div>
        )}
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
