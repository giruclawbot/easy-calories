'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { useAuth } from '@/components/AuthProvider'
import { getDayData, removeMeal, getWeekData, DayData, Meal } from '@/lib/firestore'
import { MealList } from '@/components/MealList'
import { CalorieChart } from '@/components/CalorieChart'
import { DayPicker } from '@/components/DayPicker'

const GOAL = 2000

export default function DashboardPage() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)
  const [dayData, setDayData] = useState<DayData | null>(null)
  const [weekData, setWeekData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const last7Days = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
  )

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [day, week] = await Promise.all([
      getDayData(user.uid, selectedDate),
      getWeekData(user.uid, last7Days),
    ])
    setDayData(day)
    setWeekData(week)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate])

  useEffect(() => { loadData() }, [loadData])

  async function handleRemoveMeal(meal: Meal) {
    if (!user) return
    await removeMeal(user.uid, selectedDate, meal)
    loadData()
  }

  const totalCalories = dayData?.totalCalories || 0
  const meals = dayData?.meals || []
  const percentage = Math.min(100, Math.round((totalCalories / GOAL) * 100))
  const remaining = Math.max(0, GOAL - totalCalories)

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-emerald-400">{totalCalories}</p>
          <p className="text-xs text-gray-400 mt-1">Consumidas</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-white">{GOAL}</p>
          <p className="text-xs text-gray-400 mt-1">Meta</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className={`text-3xl font-bold ${totalCalories > GOAL ? 'text-red-400' : 'text-blue-400'}`}>
            {totalCalories > GOAL ? `+${totalCalories - GOAL}` : remaining}
          </p>
          <p className="text-xs text-gray-400 mt-1">{totalCalories > GOAL ? 'Exceso' : 'Restantes'}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${totalCalories > GOAL ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-right text-xs text-gray-500 mt-1">{percentage}% de la meta</p>
      </div>

      {/* Day picker */}
      <DayPicker selectedDate={selectedDate} onChange={setSelectedDate} />

      {/* Add button */}
      {selectedDate === today && (
        <Link
          href="/dashboard/add"
          className="flex items-center justify-center gap-2 w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          + Agregar comida
        </Link>
      )}

      {/* Meal list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 animate-pulse">Cargando...</div>
      ) : (
        <MealList meals={meals} onRemove={selectedDate === today ? handleRemoveMeal : undefined} />
      )}

      {/* Weekly chart */}
      <CalorieChart data={weekData} goal={GOAL} />
    </div>
  )
}
