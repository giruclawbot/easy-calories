'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupplementLog, addSupplement, removeSupplement, SupplementEntry, SupplementLog } from '@/lib/firestore'
import { searchSupplements, FoodItem } from '@/lib/usda'
import { useI18n } from '@/components/I18nProvider'

interface Props {
  uid: string
  date: string
  isToday: boolean
  onCaloricSupplementAdded?: (entry: SupplementEntry) => void
}

const UNITS = ['g', 'mg', 'ml', 'capsule', 'tablet', 'scoop'] as const
const CALORIC_THRESHOLD = 5

export function SupplementTracker({ uid, date, isToday, onCaloricSupplementAdded }: Props) {
  const { t } = useI18n()
  const [tab, setTab] = useState<'search' | 'log'>('search')
  const [log, setLog] = useState<SupplementLog | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState<number | ''>(1)
  const [unit, setUnit] = useState<string>('g')
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualCalories, setManualCalories] = useState<number | ''>('')
  const [manualProtein, setManualProtein] = useState<number | ''>('')
  const [manualCarbs, setManualCarbs] = useState<number | ''>('')
  const [manualFat, setManualFat] = useState<number | ''>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadLog = useCallback(async () => {
    const data = await getSupplementLog(uid, date)
    setLog(data)
  }, [uid, date])

  useEffect(() => {
    loadLog()
  }, [loadLog])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearched(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchSupplements(searchQuery.trim())
      setSearchResults(results)
      setSearched(true)
      setSearching(false)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  function selectFood(food: FoodItem) {
    setSelectedFood(food)
    setAmount(1)
    setUnit('g')
    setNotes('')
    setShowManual(false)
  }

  function getCaloriesForEntry(food: FoodItem, amt: number): number {
    // nutrition is per 100g; scale by amount
    return Math.round((food.nutrition.calories * amt) / 100)
  }

  async function handleAdd() {
    if (!selectedFood || !amount || Number(amount) <= 0) return
    setAdding(true)
    const cal = getCaloriesForEntry(selectedFood, Number(amount))
    const entry: SupplementEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: selectedFood.description,
      brand: selectedFood.brandOwner,
      amount: Number(amount),
      unit,
      calories: cal,
      nutrition: cal > CALORIC_THRESHOLD ? selectedFood.nutrition : undefined,
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined,
    }

    await addSupplement(uid, date, entry)
    await loadLog()

    if (cal > CALORIC_THRESHOLD && isToday && onCaloricSupplementAdded) {
      onCaloricSupplementAdded(entry)
      setConfirmation(t('supplements.addedToMeals'))
    } else {
      setConfirmation(t('supplements.logged'))
    }
    setTimeout(() => setConfirmation(null), 3000)
    setSelectedFood(null)
    setSearchQuery('')
    setSearchResults([])
    setSearched(false)
    setAdding(false)
    setTab('log')
  }

  async function handleManualAdd() {
    if (!manualName.trim()) return
    setAdding(true)
    const cal = Number(manualCalories) || 0
    const entry: SupplementEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: manualName.trim(),
      amount: Number(amount) || 1,
      unit,
      calories: cal,
      nutrition: cal > CALORIC_THRESHOLD ? {
        calories: cal,
        protein: Number(manualProtein) || 0,
        carbs: Number(manualCarbs) || 0,
        fat: Number(manualFat) || 0,
        fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
      } : undefined,
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined,
    }

    await addSupplement(uid, date, entry)
    await loadLog()

    if (cal > CALORIC_THRESHOLD && isToday && onCaloricSupplementAdded) {
      onCaloricSupplementAdded(entry)
      setConfirmation(t('supplements.addedToMeals'))
    } else {
      setConfirmation(t('supplements.logged'))
    }
    setTimeout(() => setConfirmation(null), 3000)
    setShowManual(false)
    setManualName('')
    setManualCalories('')
    setManualProtein('')
    setManualCarbs('')
    setManualFat('')
    setAdding(false)
    setTab('log')
  }

  async function handleRemove(entryId: string) {
    await removeSupplement(uid, date, entryId)
    await loadLog()
  }

  const entries = log?.entries ?? []

  return (
    <div className="bg-teal-900/30 border border-teal-700 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-teal-400 font-semibold text-sm flex items-center gap-1.5">
          💊 {t('supplements.title')}
        </h3>
        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setTab('search')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              tab === 'search' ? 'bg-teal-700 text-white' : 'text-gray-400 hover:text-teal-300'
            }`}
          >
            {t('supplements.searchTab')}
          </button>
          <button
            onClick={() => setTab('log')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              tab === 'log' ? 'bg-teal-700 text-white' : 'text-gray-400 hover:text-teal-300'
            }`}
          >
            {t('supplements.logTab')} {entries.length > 0 && `(${entries.length})`}
          </button>
        </div>
      </div>

      {/* Confirmation */}
      {confirmation && (
        <p className="text-teal-300 text-xs text-center bg-teal-900/50 rounded-lg py-2">{confirmation}</p>
      )}

      {/* Search tab */}
      {tab === 'search' && (
        <div className="space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSelectedFood(null); setShowManual(false) }}
            placeholder={t('supplements.search')}
            className="w-full bg-teal-950/50 border border-teal-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
          />

          {searching && <p className="text-xs text-gray-500 text-center animate-pulse">...</p>}

          {/* Results list */}
          {!searching && !selectedFood && !showManual && searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map(food => (
                <button
                  key={`${food.fdcId}-${food.description}`}
                  onClick={() => selectFood(food)}
                  className="w-full text-left px-3 py-2 bg-teal-950/40 hover:bg-teal-800/50 rounded-lg border border-teal-700/30 transition-colors"
                >
                  <p className="text-white text-xs font-medium line-clamp-1">{food.description}</p>
                  {food.brandOwner && <p className="text-gray-400 text-xs">{food.brandOwner}</p>}
                  <p className="text-teal-300 text-xs">{food.nutrition.calories} kcal / 100g</p>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!searching && searched && searchResults.length === 0 && !showManual && (
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">{t('supplements.noResults')}</p>
              <button
                onClick={() => setShowManual(true)}
                className="text-teal-400 text-xs hover:text-teal-300"
              >
                {t('supplements.addManually')}
              </button>
            </div>
          )}

          {/* Manual form */}
          {showManual && (
            <div className="space-y-2 bg-teal-950/30 rounded-xl p-3 border border-teal-700/30">
              <input
                type="text"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder={t('supplements.manualName')}
                className="w-full bg-teal-950/50 border border-teal-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
              />
              <input
                type="number"
                value={manualCalories}
                onChange={e => setManualCalories(e.target.value ? Number(e.target.value) : '')}
                placeholder={t('supplements.manualCalories')}
                min={0}
                className="w-full bg-teal-950/50 border border-teal-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder={t('supplements.amount')}
                    min={0.1}
                    className="w-full bg-teal-950/50 border border-teal-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="bg-teal-950/50 border border-teal-700/50 rounded-lg px-2 py-2 text-white text-sm focus:outline-none"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button
                onClick={handleManualAdd}
                disabled={adding || !manualName.trim()}
                className="w-full py-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t('supplements.add')}
              </button>
              <button
                onClick={() => setShowManual(false)}
                className="w-full text-xs text-gray-500 hover:text-gray-400"
              >
                ✕
              </button>
            </div>
          )}

          {/* Selected food add form */}
          {selectedFood && !showManual && (
            <div className="space-y-2 bg-teal-950/30 rounded-xl p-3 border border-teal-700/30">
              <div>
                <p className="text-white text-xs font-semibold line-clamp-1">{selectedFood.description}</p>
                {selectedFood.brandOwner && (
                  <p className="text-gray-400 text-xs">{t('supplements.brand')}: {selectedFood.brandOwner}</p>
                )}
              </div>

              {/* Caloric badge */}
              {getCaloriesForEntry(selectedFood, Number(amount) || 0) > CALORIC_THRESHOLD ? (
                <span className="inline-block text-xs bg-yellow-900/40 text-yellow-300 border border-yellow-700/40 rounded-full px-2 py-0.5">
                  {t('supplements.caloric')}
                </span>
              ) : (
                <span className="inline-block text-xs bg-teal-900/40 text-teal-300 border border-teal-700/40 rounded-full px-2 py-0.5">
                  {t('supplements.nonCaloric')}
                </span>
              )}

              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder={t('supplements.amount')}
                  min={0.1}
                  className="flex-1 bg-teal-950/50 border border-teal-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                />
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="bg-teal-950/50 border border-teal-700/50 rounded-lg px-2 py-2 text-white text-sm focus:outline-none"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('supplements.notes')}
                className="w-full bg-teal-950/50 border border-teal-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={adding || !amount || Number(amount) <= 0}
                  className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {t('supplements.add')}
                </button>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="px-3 py-2 text-gray-400 hover:text-gray-300 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log tab */}
      {tab === 'log' && (
        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">💊</p>
              <p className="text-xs text-gray-500">{t('supplements.noEntries')}</p>
            </div>
          ) : (
            entries.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between bg-teal-950/30 rounded-xl px-3 py-2 border border-teal-700/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium line-clamp-1">{entry.name}</p>
                  <p className="text-gray-400 text-xs">
                    {entry.amount} {entry.unit}
                    {entry.calories > CALORIC_THRESHOLD && (
                      <span className="text-yellow-400 ml-1.5">· {entry.calories} kcal</span>
                    )}
                  </p>
                </div>
                {isToday && (
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="text-gray-600 hover:text-red-400 text-sm ml-2 shrink-0"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
