'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { useAuth } from '@/components/AuthProvider'
import { getDayData, removeMeal, updateMeal, getWeekData, DayData, Meal } from '@/lib/firestore'
import { MealList } from '@/components/MealList'
import { CalorieChart } from '@/components/CalorieChart'
import { DayPicker } from '@/components/DayPicker'
import { getStoredGoal, DEFAULT_GOAL } from '@/lib/goals'
import { CalorieCalculator } from '@/components/CalorieCalculator'
import { EditMealModal } from '@/components/EditMealModal'

export default function DashboardPage() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)
  const [dayData, setDayData] = useState<DayData | null>(null)
  const [weekData, setWeekData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState(DEFAULT_GOAL)
  const [showCalculator, setShowCalculator] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)

  const last7Days = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
  )

  useEffect(() => {
    setGoal(getStoredGoal())
  }, [])

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

  async function handleEditMeal(oldMeal: Meal, newMeal: Meal) {
    if (!user) return
    await updateMeal(user.uid, selectedDate, oldMeal, newMeal)
    setEditingMeal(null)
    loadData()
  }

  const totalCalories = dayData?.totalCalories || 0
  const meals = dayData?.meals || []
  const percentage = Math.min(100, Math.round((totalCalories / goal) * 100))
  const remaining = Math.max(0, goal - totalCalories)

  const totals = meals.reduce(
    (acc, meal) => {
      if (!meal.nutrition) return acc
      return {
        protein: acc.protein + meal.nutrition.protein,
        carbs: acc.carbs + meal.nutrition.carbs,
        fat: acc.fat + meal.nutrition.fat,
        fiber: acc.fiber + meal.nutrition.fiber,
        sugar: acc.sugar + meal.nutrition.sugar,
      }
    },
    { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
  )

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-emerald-400">{totalCalories}</p>
          <p className="text-xs text-gray-400 mt-1">Consumidas</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-white">{goal}</p>
          <p className="text-xs text-gray-400 mt-1">Meta</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className={`text-3xl font-bold ${totalCalories > goal ? 'text-red-400' : 'text-blue-400'}`}>
            {totalCalories > goal ? `+${totalCalories - goal}` : remaining}
          </p>
          <p className="text-xs text-gray-400 mt-1">{totalCalories > goal ? 'Exceso' : 'Restantes'}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${totalCalories > goal ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-right text-xs text-gray-500 mt-1">{percentage}% de la meta</p>
      </div>

      {/* Daily macro totals */}
      {meals.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Nutrientes del día</p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { label: 'Proteína', value: totals.protein, unit: 'g', color: 'text-blue-400', bg: 'bg-blue-900/20' },
              { label: 'Carbs', value: totals.carbs, unit: 'g', color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
              { label: 'Grasa', value: totals.fat, unit: 'g', color: 'text-orange-400', bg: 'bg-orange-900/20' },
              { label: 'Fibra', value: totals.fiber, unit: 'g', color: 'text-green-400', bg: 'bg-green-900/20' },
              { label: 'Azúcar', value: totals.sugar, unit: 'g', color: 'text-pink-400', bg: 'bg-pink-900/20' },
            ].map(m => (
              <div key={m.label} className={`${m.bg} rounded-lg py-2`}>
                <p className={`text-base font-bold ${m.color}`}>{Math.round(m.value)}g</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal settings + Day picker */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Mis calorías</h2>
        <button
          onClick={() => setShowCalculator(true)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
          aria-label="Configurar meta de calorías"
        >
          ⚙️ Meta: {goal} kcal
        </button>
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
        <MealList meals={meals} onRemove={selectedDate === today ? handleRemoveMeal : undefined} onEdit={selectedDate === today ? setEditingMeal : undefined} />
      )}

      {/* Weekly chart */}
      <CalorieChart data={weekData} goal={goal} />

      {/* Footer */}
      <p className="text-center text-xs text-gray-700 pt-2">Easy Calories v{process.env.NEXT_PUBLIC_APP_VERSION} · Giru 👾</p>

      {/* Calculator modal */}
      {showCalculator && (
        <CalorieCalculator
          onGoalSet={(g) => { setGoal(g) }}
          onClose={() => setShowCalculator(false)}
        />
      )}

      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          onSave={(updated) => handleEditMeal(editingMeal, updated)}
          onClose={() => setEditingMeal(null)}
        />
      )}
    </div>
  )
}
