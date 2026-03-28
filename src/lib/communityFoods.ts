import { getFirebaseDb } from './firebase'
import {
  collection, doc, getDocs, setDoc, serverTimestamp,
  query as firestoreQuery,
  where, orderBy, limit as firestoreLimit,
} from 'firebase/firestore'
import type { NutritionFacts } from './usda'

export interface CommunityFood {
  id: string
  description: string
  brandOwner?: string
  nutrition: NutritionFacts
  // community-specific
  name: string
  brand?: string
  servingSize: number
  unit: string
  createdBy: string
  createdByName?: string
  createdAt: unknown
  searchTerms: string[]
  source: 'community'
}

export interface AddFoodFormData {
  name: string
  brand?: string
  servingSize: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  cholesterol: number
}

function buildSearchTerms(name: string, brand?: string): string[] {
  const combined = [name, brand || ''].join(' ').toLowerCase()
  const words = combined.split(/\s+/).filter(w => w.length > 0)
  return Array.from(new Set(words))
}

export async function searchCommunityFoods(queryStr: string): Promise<CommunityFood[]> {
  const db = getFirebaseDb()
  if (!db) return []

  const words = queryStr.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0)
  if (words.length === 0) return []

  const firstWord = words[0]
  const colRef = collection(db, 'communityFoods')
  const q = firestoreQuery(
    colRef,
    where('searchTerms', 'array-contains', firstWord),
    firestoreLimit(20)
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => d.data() as CommunityFood)
  // Client-side filter for remaining words
  return docs.filter(food =>
    words.every(word => food.searchTerms.some(t => t.includes(word)))
  ).slice(0, 10)
}

export async function addCommunityFood(
  uid: string,
  displayName: string | null | undefined,
  data: AddFoodFormData
): Promise<CommunityFood> {
  const db = getFirebaseDb()
  const id = crypto.randomUUID()
  const searchTerms = buildSearchTerms(data.name, data.brand)

  // Normalize nutrition to per-100g so the rest of the app scales correctly.
  // The user enters values for their serving size (e.g. 170g yogurt = 150 kcal).
  // We convert: value_per_100g = (value / servingSize) * 100
  const ratio = data.servingSize > 0 ? 100 / data.servingSize : 1
  const nutrition: NutritionFacts = {
    calories:    Math.round(data.calories    * ratio * 10) / 10,
    protein:     Math.round(data.protein     * ratio * 10) / 10,
    carbs:       Math.round(data.carbs       * ratio * 10) / 10,
    fat:         Math.round(data.fat         * ratio * 10) / 10,
    fiber:       Math.round(data.fiber       * ratio * 10) / 10,
    sugar:       Math.round(data.sugar       * ratio * 10) / 10,
    sodium:      Math.round(data.sodium      * ratio * 10) / 10,
    cholesterol: Math.round(data.cholesterol * ratio * 10) / 10,
  }

  const food = {
    id,
    name: data.name,
    description: data.brand ? `${data.name} (${data.brand})` : data.name,
    brand: data.brand,
    brandOwner: data.brand,
    servingSize: data.servingSize,
    unit: data.unit,
    nutrition,
    createdBy: uid,
    createdByName: displayName || undefined,
    createdAt: serverTimestamp(),
    searchTerms,
    source: 'community' as const,
  }

  if (db) {
    await setDoc(doc(db, 'communityFoods', id), food)
  }

  return { ...food, createdAt: new Date().toISOString() } as CommunityFood
}

export async function getAllRecentCommunityFoods(limitCount = 20): Promise<CommunityFood[]> {
  const db = getFirebaseDb()
  if (!db) return []

  const colRef = collection(db, 'communityFoods')
  const q = firestoreQuery(colRef, orderBy('createdAt', 'desc'), firestoreLimit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as CommunityFood)
}
