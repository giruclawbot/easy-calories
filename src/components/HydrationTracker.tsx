'use client'
import { useState, useEffect, useCallback } from 'react'
import { getHydrationLog, addHydration, resetHydration, HydrationLog } from '@/lib/firestore'
import { useI18n } from '@/components/I18nProvider'

interface Props {
  uid: string
  date: string       // selected date (yyyy-MM-dd)
  goalMl: number     // from UserProfile.hydrationGoalMl ?? 2000
  isToday: boolean   // can only add water for today
}

const QUICK_AMOUNTS = [150, 250, 350, 500]

export function HydrationTracker({ uid, date, goalMl, isToday }: Props) {
  const { t } = useI18n()
  const [log, setLog] = useState<HydrationLog | null>(null)
  const [totalMl, setTotalMl] = useState(0)
  const [adding, setAdding] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [customAmount, setCustomAmount] = useState<number | ''>('')

  const loadLog = useCallback(async () => {
    const data = await getHydrationLog(uid, date)
    setLog(data)
    setTotalMl(data?.totalMl ?? 0)
  }, [uid, date])

  useEffect(() => {
    loadLog()
    setConfirmReset(false)
    setCustomAmount('')
  }, [loadLog])

  async function handleAdd(ml: number) {
    if (!isToday || adding || ml <= 0) return
    setAdding(true)
    setTotalMl(prev => prev + ml) // optimistic
    setConfirmReset(false)
    await addHydration(uid, date, ml)
    await loadLog()
    setAdding(false)
  }

  async function handleReset() {
    setAdding(true)
    await resetHydration(uid, date)
    setConfirmReset(false)
    await loadLog()
    setAdding(false)
  }

  const percentage = Math.min(100, Math.round((totalMl / goalMl) * 100))
  const isComplete = totalMl >= goalMl

  return (
    <div className="bg-blue-900/30 border border-blue-700 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-blue-400 font-semibold text-sm flex items-center gap-1.5">
          💧 {t('hydration.title')}
        </h3>
        {isToday && (
          <div>
            {confirmReset ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">{t('hydration.confirmReset')}</span>
                <button
                  onClick={handleReset}
                  className="text-red-400 hover:text-red-300 font-medium"
                >
                  {t('hydration.yes')}
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  {t('hydration.no')}
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="text-gray-600 hover:text-gray-400 text-sm"
                aria-label={t('hydration.reset')}
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-3 bg-blue-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1.5">
          <p className="text-2xl font-bold text-white">{totalMl} <span className="text-sm text-gray-400">ml</span></p>
          <p className="text-xs text-gray-500">/ {goalMl} ml · {percentage}%</p>
        </div>
        {isComplete && (
          <p className="text-blue-400 text-sm font-medium mt-1">{t('hydration.complete')}</p>
        )}
      </div>

      {/* Add buttons or read-only note */}
      {isToday ? (
        <>
          {/* Quick add buttons */}
          <div className="flex gap-2 flex-wrap">
            {QUICK_AMOUNTS.map(ml => (
              <button
                key={ml}
                onClick={() => handleAdd(ml)}
                disabled={adding}
                className="flex-1 min-w-[60px] py-2 bg-blue-800/50 hover:bg-blue-700/60 disabled:opacity-50 text-blue-300 text-xs font-medium rounded-lg transition-colors border border-blue-700/50"
              >
                +{ml}ml
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder={t('hydration.customAmount')}
                min={1}
                max={2000}
                className="w-full bg-blue-950/50 border border-blue-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 pr-10"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-500">ml</span>
            </div>
            <button
              onClick={() => {
                if (customAmount && customAmount > 0) {
                  handleAdd(Number(customAmount))
                  setCustomAmount('')
                }
              }}
              disabled={adding || !customAmount || Number(customAmount) <= 0}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t('hydration.add')}
            </button>
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-500 text-center py-2">{t('hydration.readOnly')}</p>
      )}
    </div>
  )
}
