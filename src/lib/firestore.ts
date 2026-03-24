import { getFirebaseDb } from './firebase'
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp
} from 'firebase/firestore'
import type { NutritionFacts } from './usda'

export interface Meal {
  id: string
  foodName: string
  calories: number       // mantener por compatibilidad
  quantity: number
  unit: string
  timestamp: string
  nutrition?: NutritionFacts  // nuevo, nullable para meals viejos
}

export interface DayData {
  totalCalories: number
  meals: Meal[]
  updatedAt?: unknown
}

export async function getDayData(uid: string, date: string): Promise<DayData | null> {
  const db = getFirebaseDb()
  if (!db) return null
  const ref = doc(db, 'users', uid, 'days', date)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as DayData) : null
}

export async function addMeal(uid: string, date: string, meal: Meal): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return
  const ref = doc(db, 'users', uid, 'days', date)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    const data = existing.data() as DayData
    await updateDoc(ref, {
      meals: arrayUnion(meal),
      totalCalories: (data.totalCalories || 0) + meal.calories,
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(ref, {
      totalCalories: meal.calories,
      meals: [meal],
      updatedAt: serverTimestamp(),
    })
  }
}

export async function removeMeal(uid: string, date: string, meal: Meal): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return
  const ref = doc(db, 'users', uid, 'days', date)
  const existing = await getDoc(ref)
  if (!existing.exists()) return
  const data = existing.data() as DayData
  await updateDoc(ref, {
    meals: arrayRemove(meal),
    totalCalories: Math.max(0, (data.totalCalories || 0) - meal.calories),
    updatedAt: serverTimestamp(),
  })
}

export async function updateMeal(uid: string, date: string, oldMeal: Meal, newMeal: Meal): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return
  const ref = doc(db, 'users', uid, 'days', date)
  const existing = await getDoc(ref)
  if (!existing.exists()) return
  const data = existing.data() as DayData

  // Replace old meal with new meal in array, recalculate total
  const updatedMeals = data.meals.map((m: Meal) => m.id === oldMeal.id ? newMeal : m)
  const newTotal = updatedMeals.reduce((sum: number, m: Meal) => sum + m.calories, 0)

  await updateDoc(ref, {
    meals: updatedMeals,
    totalCalories: newTotal,
    updatedAt: serverTimestamp(),
  })
}

export async function getWeekData(uid: string, dates: string[]): Promise<Record<string, number>> {
  const results: Record<string, number> = {}
  await Promise.all(
    dates.map(async (date) => {
      const data = await getDayData(uid, date)
      results[date] = data?.totalCalories || 0
    })
  )
  return results
}
