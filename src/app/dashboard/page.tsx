'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { useAuth } from '@/components/AuthProvider'
import { getDayData, removeMeal, updateMeal, getWeekData, getUserProfile, saveUserProfile, DayData, Meal, UserProfile, GoalDetails } from '@/lib/firestore'
import { MealList } from '@/components/MealList'
import { CalorieChart } from '@/components/CalorieChart'
import { DayPicker } from '@/components/DayPicker'
import { getCachedGoal, setCachedGoal, DEFAULT_GOAL } from '@/lib/goals'
import { CalorieCalculator } from '@/components/CalorieCalculator'
import { EditMealModal } from '@/components/EditMealModal'
import { useI18n } from '@/components/I18nProvider'
import { formatWeight } from '@/lib/units'
import type { UnitSystem } from '@/lib/units'

function getMacroTargets(profile: UserProfile | null, calorieGoal: number) {
  const protein = profile?.weightKg ? Math.round(profile.weightKg * 1.8) : Math.round(calorieGoal * 0.25 / 4)
  const fat = Math.round(calorieGoal * 0.28 / 9)
  const carbs = Math.round((calorieGoal - protein * 4 - fat * 9) / 4)
  const fiber = Math.round(calorieGoal / 1000 * 14)
  const sugar = Math.round(calorieGoal * 0.10 / 4)
  return { protein, carbs, fat, fiber, sugar, sodium: 2300, cholesterol: 300 }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)
  const [dayData, setDayData] = useState<DayData | null>(null)
  const [weekData, setWeekData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [goal, setGoal] = useState(DEFAULT_GOAL)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showCalculator, setShowCalculator] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)

  const last7Days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')),
    []
  )

  useEffect(() => {
    setGoal(getCachedGoal())
    if (user) {
      getUserProfile(user.uid).then(profile => {
        if (profile) {
          setUserProfile(profile)
          const g = profile.goalDetails?.calorieGoal ?? profile.calorieGoal
          if (g) { setGoal(g); setCachedGoal(g) }
        }
      })
    }
  }, [user])

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
    setDayData(prev => {
      if (!prev) return prev
      const updatedMeals = prev.meals.filter(m => m.id !== meal.id)
      return {
        ...prev,
        meals: updatedMeals,
        totalCalories: updatedMeals.reduce((s, m) => s + m.calories, 0),
      }
    })
    await removeMeal(user.uid, selectedDate, meal)
    loadData()
  }

  async function handleEditMeal(oldMeal: Meal, newMeal: Meal) {
    if (!user) return
    await updateMeal(user.uid, selectedDate, oldMeal, newMeal)
    setEditingMeal(null)
    loadData()
  }

  async function handleGoalSet(calorieGoal: number, goalDetails?: GoalDetails) {
    setGoal(calorieGoal)
    setCachedGoal(calorieGoal)
    if (user) {
      const mergedGoalDetails: GoalDetails = goalDetails
        ? { ...goalDetails, calorieGoal }
        : { calorieGoal, goalType: 'maintain' }
      const updated: Partial<UserProfile> = { calorieGoal, goalDetails: mergedGoalDetails }
      setUserProfile(prev => prev ? { ...prev, ...updated } : { ...updated })
      await saveUserProfile(user.uid, updated)
    }
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
        sodium: acc.sodium + (meal.nutrition.sodium ?? 0),
      }
    },
    { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  )

  const macroTargets = getMacroTargets(userProfile, goal)

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-emerald-400">{totalCalories}</p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.consumed')}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className="text-3xl font-bold text-white">{goal}</p>
          <p className="text-xs text-gray-400 mt-1">{t('dashboard.goal')}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <p className={`text-3xl font-bold ${totalCalories > goal ? 'text-red-400' : 'text-blue-400'}`}>
            {totalCalories > goal ? `+${totalCalories - goal}` : remaining}
          </p>
          <p className="text-xs text-gray-400 mt-1">{totalCalories > goal ? t('dashboard.excess') : t('dashboard.remaining')}</p>
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
        <p className="text-right text-xs text-gray-500 mt-1">{percentage}% {t('dashboard.ofGoal')}</p>
      </div>

      {/* Goal settings + Day picker */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{t('dashboard.myCalories')}</h2>
        <button
          onClick={() => setShowCalculator(true)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
          aria-label="Configurar meta de calorías"
        >
          ⚙️ {t('dashboard.setGoal')}: {goal} kcal
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
          {t('dashboard.addMeal')}
        </Link>
      )}

      {/* Meal list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 animate-pulse">{t('dashboard.loading')}</div>
      ) : (
        <MealList meals={meals} onRemove={selectedDate === today ? handleRemoveMeal : undefined} onEdit={selectedDate === today ? setEditingMeal : undefined} />
      )}

      {/* Weekly chart */}
      <CalorieChart data={weekData} goal={goal} />

      {/* Goal details card */}
      {userProfile?.goalDetails && (
        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400">{t('dashboard.yourGoal')}</h3>
            <button onClick={() => setShowCalculator(true)} className="text-xs text-emerald-400">{t('dashboard.adjustGoal')}</button>
          </div>
          {/* Goal type badge */}
          <div className="mb-3">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
              userProfile.goalDetails.goalType === 'lose'
                ? 'bg-red-900/40 text-red-300'
                : userProfile.goalDetails.goalType === 'gain'
                ? 'bg-blue-900/40 text-blue-300'
                : 'bg-emerald-900/40 text-emerald-300'
            }`}>
              {userProfile.goalDetails.goalType === 'lose'
                ? t('dashboard.goalTypeLose')
                : userProfile.goalDetails.goalType === 'gain'
                ? t('dashboard.goalTypeGain')
                : t('dashboard.goalTypeMaintain')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-400">{userProfile.goalDetails.calorieGoal}</p>
              <p className="text-xs text-gray-500">{t('dashboard.kcalDay')}</p>
            </div>
            {userProfile.goalDetails.targetWeightKg && (
              <div>
                <p className="text-lg font-bold text-white">{formatWeight(userProfile.goalDetails.targetWeightKg, (userProfile.unitSystem ?? 'metric') as UnitSystem)}</p>
                <p className="text-xs text-gray-500">{t('dashboard.target')}</p>
              </div>
            )}
            {userProfile.goalDetails.weeksToGoal && (
              <div>
                <p className="text-lg font-bold text-white">
                  {userProfile.goalDetails.weeksToGoal < 4
                    ? `~${userProfile.goalDetails.weeksToGoal}${t('dashboard.weeks').slice(0, 3)}`
                    : `~${Math.round(userProfile.goalDetails.weeksToGoal / 4.3)}${t('dashboard.months').slice(0, 1)}`}
                </p>
                <p className="text-xs text-gray-500">{t('dashboard.estimated')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily macro totals with targets */}
      {meals.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">{t('macros.summary')}</h3>
          <div className="space-y-2">
            {([
              { key: 'protein', label: t('macros.protein'), color: 'bg-blue-500', unit: 'g' },
              { key: 'carbs', label: t('macros.carbs'), color: 'bg-yellow-500', unit: 'g' },
              { key: 'fat', label: t('macros.fat'), color: 'bg-orange-500', unit: 'g' },
              { key: 'fiber', label: t('macros.fiber'), color: 'bg-green-500', unit: 'g' },
              { key: 'sugar', label: t('macros.sugar'), color: 'bg-pink-500', unit: 'g' },
              { key: 'sodium', label: t('macros.sodium'), color: 'bg-purple-500', unit: 'mg' },
            ] as const).map(({ key, label, color, unit }) => {
              const val = Math.round(totals[key])
              const target = macroTargets[key]
              const pct = Math.min(100, Math.round((val / target) * 100))
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-300">{val}{unit} <span className="text-gray-600">/ {target}{unit}</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-gray-700 pt-2">
        {t('dashboard.version', { version: process.env.NEXT_PUBLIC_APP_VERSION || '' })}
      </p>

      {/* Calculator modal */}
      {showCalculator && (
        <CalorieCalculator
          onGoalSet={handleGoalSet}
          onClose={() => setShowCalculator(false)}
          initialValues={{
            weightKg: userProfile?.weightKg,
            heightCm: userProfile?.heightCm,
            age: userProfile?.age,
            sex: userProfile?.sex,
            unitSystem: (userProfile?.unitSystem ?? 'metric') as UnitSystem,
          }}
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
