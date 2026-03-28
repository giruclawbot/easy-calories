'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import {
  getCommunityFoods,
  getUserCommunityFoods,
  voteCommunityFood,
  getUserVotesForFoods,
  getFoodBadge,
  type CommunityFood,
} from '@/lib/communityFoods'

type Tab = 'all' | 'mine' | 'verified'

function FoodCard({
  food,
  userVote,
  currentUid,
  onVote,
}: {
  food: CommunityFood
  userVote: 'like' | 'dislike' | null
  currentUid: string | undefined
  onVote: (foodId: string, vote: 'like' | 'dislike') => void
}) {
  const router = useRouter()
  const badge = getFoodBadge(food.likes ?? 0, food.dislikes ?? 0)
  const isOwner = currentUid === food.createdBy

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{food.name}</p>
          <p className="text-gray-400 text-xs">
            {[food.brand, `${Math.round(food.nutrition.calories)} kcal/100g`].filter(Boolean).join(' · ')}
          </p>
          {badge === 'verified' && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-700">
              ✅ Verificado
            </span>
          )}
          {badge === 'poor' && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-700">
              ⚠️ Dudoso
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOwner && (
            <button
              onClick={() => router.push(`/dashboard/community/edit?id=${food.id}`)}
              className="text-gray-400 hover:text-white text-sm px-2 py-1"
              title="Editar"
            >
              ✏️
            </button>
          )}
          <button
            onClick={() => onVote(food.id, 'like')}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
              userVote === 'like'
                ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400'
                : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-emerald-600'
            }`}
          >
            👍 <span>{food.likes ?? 0}</span>
          </button>
          <button
            onClick={() => onVote(food.id, 'dislike')}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
              userVote === 'dislike'
                ? 'bg-red-900/40 border-red-500 text-red-400'
                : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-red-600'
            }`}
          >
            👎 <span>{food.dislikes ?? 0}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommunityFoodsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('all')
  const [foods, setFoods] = useState<CommunityFood[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike'>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const loadFoods = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      let data: CommunityFood[]
      if (tab === 'mine') {
        data = await getUserCommunityFoods(user.uid)
      } else {
        data = await getCommunityFoods(30)
        if (tab === 'verified') {
          data = data.filter(f => getFoodBadge(f.likes ?? 0, f.dislikes ?? 0) === 'verified')
        }
      }
      setFoods(data)
      if (data.length > 0) {
        const votes = await getUserVotesForFoods(user.uid, data.map(f => f.id))
        setUserVotes(votes)
      }
    } finally {
      setLoading(false)
    }
  }, [user, tab])

  useEffect(() => {
    if (!authLoading) loadFoods()
  }, [authLoading, loadFoods])

  async function handleVote(foodId: string, vote: 'like' | 'dislike') {
    if (!user) return
    const currentVote = userVotes[foodId] ?? null
    const newVote = currentVote === vote ? null : vote

    // Optimistic update
    setFoods(prev => prev.map(f => {
      if (f.id !== foodId) return f
      const updated = { ...f }
      if (currentVote === 'like') updated.likes = Math.max(0, (updated.likes ?? 0) - 1)
      if (currentVote === 'dislike') updated.dislikes = Math.max(0, (updated.dislikes ?? 0) - 1)
      if (newVote === 'like') updated.likes = (updated.likes ?? 0) + 1
      if (newVote === 'dislike') updated.dislikes = (updated.dislikes ?? 0) + 1
      return updated
    }))
    setUserVotes(prev => {
      const next = { ...prev }
      if (newVote === null) delete next[foodId]
      else next[foodId] = newVote
      return next
    })

    await voteCommunityFood(user.uid, foodId, newVote)
  }

  const filteredFoods = searchDebounced
    ? foods.filter(f => {
        const q = searchDebounced.toLowerCase()
        return f.name.toLowerCase().includes(q) || (f.brand ?? '').toLowerCase().includes(q)
      })
    : foods

  const TABS: { id: Tab; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'mine', label: 'Mis alimentos' },
    { id: 'verified', label: 'Verificados' },
  ]

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">←</button>
          <h1 className="text-xl font-bold text-white">🍎 Alimentos Comunidad</h1>
        </div>
        <Link
          href="/dashboard/add/custom-food"
          className="flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 font-medium transition-colors"
        >
          ➕ Agregar
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t.id
                ? 'bg-emerald-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Buscar alimentos..."
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
      />

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {tab === 'mine' ? 'Aún no has agregado alimentos' : 'Sin alimentos en esta categoría'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFoods.map(food => (
            <FoodCard
              key={food.id}
              food={food}
              userVote={userVotes[food.id] ?? null}
              currentUid={user?.uid}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  )
}
