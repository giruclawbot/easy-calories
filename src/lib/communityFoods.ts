import { getFirebaseDb } from './firebase'
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp,
  query as firestoreQuery,
  where, orderBy, limit as firestoreLimit,
  writeBatch, increment,
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
  likes: number
  dislikes: number
}

export function getFoodBadge(likes: number, dislikes: number): 'verified' | 'poor' | null {
  const total = likes + dislikes
  if (total < 3) return null
  const likeRatio = likes / total
  const dislikeRatio = dislikes / total
  if (likes >= 5 && likeRatio >= 0.7) return 'verified'
  if (dislikes >= 3 && dislikeRatio >= 0.6) return 'poor'
  return null
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
    likes: 0,
    dislikes: 0,
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
  return snap.docs.map(d => ({ likes: 0, dislikes: 0, ...d.data() } as CommunityFood))
}

export async function getCommunityFoods(limitCount = 30): Promise<CommunityFood[]> {
  const db = getFirebaseDb()
  if (!db) return []
  const colRef = collection(db, 'communityFoods')
  const q = firestoreQuery(colRef, orderBy('createdAt', 'desc'), firestoreLimit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ likes: 0, dislikes: 0, ...d.data() } as CommunityFood))
}

export async function getUserCommunityFoods(uid: string): Promise<CommunityFood[]> {
  const db = getFirebaseDb()
  if (!db) return []
  const colRef = collection(db, 'communityFoods')
  const q = firestoreQuery(colRef, where('createdBy', '==', uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ likes: 0, dislikes: 0, ...d.data() } as CommunityFood))
}

export async function updateCommunityFood(foodId: string, data: Partial<AddFoodFormData>): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return

  const foodRef = doc(db, 'communityFoods', foodId)
  const snap = await getDoc(foodRef)
  if (!snap.exists()) throw new Error('Food not found')
  const existing = snap.data() as CommunityFood

  const servingSize = data.servingSize ?? existing.servingSize
  const ratio = servingSize > 0 ? 100 / servingSize : 1

  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.brand !== undefined) updateData.brand = data.brand
  if (data.servingSize !== undefined) updateData.servingSize = data.servingSize
  if (data.unit !== undefined) updateData.unit = data.unit

  if (data.name !== undefined || data.brand !== undefined) {
    const name = data.name ?? existing.name
    const brand = data.brand ?? existing.brand
    updateData.searchTerms = buildSearchTerms(name, brand)
    updateData.description = brand ? `${name} (${brand})` : name
    updateData.brandOwner = brand
  }

  // Recalculate nutrition if any nutrition field or servingSize changes
  const nutritionKeys: (keyof AddFoodFormData)[] = ['calories','protein','carbs','fat','fiber','sugar','sodium','cholesterol']
  const hasNutrition = nutritionKeys.some(k => data[k] !== undefined) || data.servingSize !== undefined
  if (hasNutrition) {
    const calories    = data.calories    ?? (existing.nutrition.calories    / (100 / existing.servingSize))
    const protein     = data.protein     ?? (existing.nutrition.protein     / (100 / existing.servingSize))
    const carbs       = data.carbs       ?? (existing.nutrition.carbs       / (100 / existing.servingSize))
    const fat         = data.fat         ?? (existing.nutrition.fat         / (100 / existing.servingSize))
    const fiber       = data.fiber       ?? (existing.nutrition.fiber       / (100 / existing.servingSize))
    const sugar       = data.sugar       ?? (existing.nutrition.sugar       / (100 / existing.servingSize))
    const sodium      = data.sodium      ?? (existing.nutrition.sodium      / (100 / existing.servingSize))
    const cholesterol = data.cholesterol ?? (existing.nutrition.cholesterol / (100 / existing.servingSize))

    updateData.nutrition = {
      calories:    Math.round(calories    * ratio * 10) / 10,
      protein:     Math.round(protein     * ratio * 10) / 10,
      carbs:       Math.round(carbs       * ratio * 10) / 10,
      fat:         Math.round(fat         * ratio * 10) / 10,
      fiber:       Math.round(fiber       * ratio * 10) / 10,
      sugar:       Math.round(sugar       * ratio * 10) / 10,
      sodium:      Math.round(sodium      * ratio * 10) / 10,
      cholesterol: Math.round(cholesterol * ratio * 10) / 10,
    }
  }

  await updateDoc(foodRef, updateData)
}

export async function deleteCommunityFood(foodId: string): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return
  await deleteDoc(doc(db, 'communityFoods', foodId))
}

export async function voteCommunityFood(uid: string, foodId: string, vote: 'like' | 'dislike' | null): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return

  const voteId = `${uid}_${foodId}`
  const voteRef = doc(db, 'communityFoodVotes', voteId)
  const foodRef = doc(db, 'communityFoods', foodId)

  const existingSnap = await getDoc(voteRef)
  const batch = writeBatch(db)

  if (existingSnap.exists()) {
    const existingVote = existingSnap.data().vote as 'like' | 'dislike'
    if (vote === null || existingVote === vote) {
      // Remove vote
      batch.delete(voteRef)
      batch.update(foodRef, { [existingVote === 'like' ? 'likes' : 'dislikes']: increment(-1) })
    } else {
      // Change vote
      batch.update(voteRef, { vote, createdAt: serverTimestamp() })
      batch.update(foodRef, {
        [existingVote === 'like' ? 'likes' : 'dislikes']: increment(-1),
        [vote === 'like' ? 'likes' : 'dislikes']: increment(1),
      })
    }
  } else if (vote !== null) {
    // New vote
    batch.set(voteRef, { uid, foodId, vote, createdAt: serverTimestamp() })
    batch.update(foodRef, { [vote === 'like' ? 'likes' : 'dislikes']: increment(1) })
  }

  await batch.commit()
}

export async function getUserVote(uid: string, foodId: string): Promise<'like' | 'dislike' | null> {
  const db = getFirebaseDb()
  if (!db) return null
  const snap = await getDoc(doc(db, 'communityFoodVotes', `${uid}_${foodId}`))
  if (!snap.exists()) return null
  return snap.data().vote as 'like' | 'dislike'
}

export async function getUserVotesForFoods(uid: string, foodIds: string[]): Promise<Record<string, 'like' | 'dislike'>> {
  const db = getFirebaseDb()
  if (!db || foodIds.length === 0) return {}

  const colRef = collection(db, 'communityFoodVotes')
  // Firestore 'in' supports up to 30 values
  const chunks: string[][] = []
  for (let i = 0; i < foodIds.length; i += 30) chunks.push(foodIds.slice(i, i + 30))

  const result: Record<string, 'like' | 'dislike'> = {}
  for (const chunk of chunks) {
    const q = firestoreQuery(colRef, where('uid', '==', uid), where('foodId', 'in', chunk))
    const snap = await getDocs(q)
    for (const d of snap.docs) {
      const data = d.data()
      result[data.foodId] = data.vote
    }
  }
  return result
}
