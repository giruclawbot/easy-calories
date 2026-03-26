import { getFirebaseDb } from './firebase'
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp,
  collection, query, where, orderBy, limit as firestoreLimit, getDocs
} from 'firebase/firestore'
import type { NutritionFacts } from './usda'

export interface Meal {
  id: string
  foodName: string
  calories: number       // mantener por compatibilidad
  quantity: number
  unit: string
  timestamp: string
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'  // optional, backward compat
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

export interface UserSettings {
  calorieGoal: number
  updatedAt?: unknown
}

export interface GoalDetails {
  calorieGoal: number
  goalType: 'lose' | 'maintain' | 'gain'
  targetWeightKg?: number
  ratePerWeek?: 'slow' | 'moderate' | 'fast'
  weeksToGoal?: number
  bmr?: number
  tdee?: number
}

export interface UserProfile {
  // Personal data
  weightKg?: number
  heightCm?: number
  age?: number
  sex?: 'male' | 'female'
  locale?: string
  unitSystem?: 'metric' | 'imperial'
  // Goal details (replaces simple calorieGoal)
  goalDetails?: GoalDetails
  // Legacy (keep for backward compat)
  calorieGoal?: number
  updatedAt?: unknown
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb()
  if (!db) return null
  try {
    const ref = doc(db, 'users', uid, 'settings', 'profile')
    const snap = await getDoc(ref)
    return snap.exists() ? (snap.data() as UserProfile) : null
  } catch {
    return null
  }
}

export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return
  const ref = doc(db, 'users', uid, 'settings', 'profile')
  await setDoc(ref, { ...profile, updatedAt: serverTimestamp() }, { merge: true })
}

// Keep backward compat
export const getUserSettings = getUserProfile
export const saveUserSettings = saveUserProfile

export interface FrequentFood {
  foodName: string
  calories: number
  quantity: number
  unit: string
  nutrition?: NutritionFacts
  count: number
  lastUsed: string
  dismissed: boolean
}

function toSlug(foodName: string): string {
  return foodName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 100)
}

export async function trackFoodUsage(uid: string, meal: Omit<Meal, 'id' | 'timestamp' | 'mealType'>): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return
  const slug = toSlug(meal.foodName)
  const ref = doc(db, 'users', uid, 'frequentFoods', slug)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = snap.data() as FrequentFood
    await setDoc(ref, {
      ...data,
      foodName: meal.foodName,
      calories: meal.calories,
      quantity: meal.quantity,
      unit: meal.unit,
      nutrition: meal.nutrition ?? data.nutrition,
      count: data.count + 1,
      lastUsed: new Date().toISOString(),
    })
  } else {
    await setDoc(ref, {
      foodName: meal.foodName,
      calories: meal.calories,
      quantity: meal.quantity,
      unit: meal.unit,
      nutrition: meal.nutrition ?? null,
      count: 1,
      lastUsed: new Date().toISOString(),
      dismissed: false,
    })
  }
}

export async function getFrequentFoods(uid: string, limitCount = 8): Promise<FrequentFood[]> {
  const db = getFirebaseDb()
  if (!db) return []
  const ref = collection(db, 'users', uid, 'frequentFoods')
  const q = query(ref, where('dismissed', '==', false), orderBy('count', 'desc'), firestoreLimit(limitCount))
  const snap = await getDocs(q)
  const foods = snap.docs.map(d => d.data() as FrequentFood)
  return foods.filter(f => f.count >= 2)
}

export async function dismissFrequentFood(uid: string, foodName: string): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return
  const slug = toSlug(foodName)
  const ref = doc(db, 'users', uid, 'frequentFoods', slug)
  await setDoc(ref, { dismissed: true }, { merge: true })
}

export async function getAllDaysData(uid: string): Promise<Record<string, DayData>> {
  const db = getFirebaseDb()
  if (!db) return {}
  const ref = collection(db, 'users', uid, 'days')
  const snap = await getDocs(query(ref))
  const result: Record<string, DayData> = {}
  snap.docs.forEach(d => { result[d.id] = d.data() as DayData })
  // Sort keys chronologically
  const sorted: Record<string, DayData> = {}
  Object.keys(result).sort().forEach(k => { sorted[k] = result[k] })
  return sorted
}
