import { getFirebaseDb } from './firebase'
import {
  collection, doc, getDocs, setDoc, getDoc, deleteDoc, updateDoc, serverTimestamp,
  query as firestoreQuery,
  where, orderBy, limit as firestoreLimit,
} from 'firebase/firestore'
import type { NutritionFacts } from './usda'
import { logger } from './logger'

export interface RecipeIngredient {
  foodName: string
  quantity: number
  unit: string
  nutrition: NutritionFacts
}

export interface Recipe {
  id: string
  name: string
  description?: string
  servings: number
  ingredients: RecipeIngredient[]
  nutrition: NutritionFacts       // per serving
  totalNutrition: NutritionFacts  // sum of all
  createdBy: string
  createdByName?: string
  searchTerms: string[]
  createdAt: unknown
  updatedAt: unknown
}

export function buildSearchTerms(name: string, description?: string): string[] {
  const combined = [name, description || ''].join(' ').toLowerCase()
  const words = combined.split(/\s+/).filter(w => w.length > 0)
  return Array.from(new Set(words))
}

export function scaleNutrition(base: NutritionFacts, quantity: number): NutritionFacts {
  const r = quantity / 100
  return {
    calories: Math.round(base.calories * r * 10) / 10,
    protein: Math.round(base.protein * r * 10) / 10,
    carbs: Math.round(base.carbs * r * 10) / 10,
    fat: Math.round(base.fat * r * 10) / 10,
    fiber: Math.round(base.fiber * r * 10) / 10,
    sugar: Math.round(base.sugar * r * 10) / 10,
    sodium: Math.round(base.sodium * r * 10) / 10,
    cholesterol: Math.round(base.cholesterol * r * 10) / 10,
  }
}

export function divideNutrition(total: NutritionFacts, servings: number): NutritionFacts {
  return {
    calories: Math.round(total.calories / servings * 10) / 10,
    protein: Math.round(total.protein / servings * 10) / 10,
    carbs: Math.round(total.carbs / servings * 10) / 10,
    fat: Math.round(total.fat / servings * 10) / 10,
    fiber: Math.round(total.fiber / servings * 10) / 10,
    sugar: Math.round(total.sugar / servings * 10) / 10,
    sodium: Math.round(total.sodium / servings * 10) / 10,
    cholesterol: Math.round(total.cholesterol / servings * 10) / 10,
  }
}

export function sumNutrition(items: NutritionFacts[]): NutritionFacts {
  return items.reduce(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      protein: acc.protein + n.protein,
      carbs: acc.carbs + n.carbs,
      fat: acc.fat + n.fat,
      fiber: acc.fiber + n.fiber,
      sugar: acc.sugar + n.sugar,
      sodium: acc.sodium + n.sodium,
      cholesterol: acc.cholesterol + n.cholesterol,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 }
  )
}

export async function createRecipe(
  uid: string,
  displayName: string | null | undefined,
  data: Omit<Recipe, 'id' | 'createdBy' | 'createdByName' | 'searchTerms' | 'createdAt' | 'updatedAt'>
): Promise<Recipe> {
  const db = getFirebaseDb()
  const id = crypto.randomUUID()
  const searchTerms = buildSearchTerms(data.name, data.description)

  logger.info('recipes', 'createRecipe', `Creating recipe "${data.name}" for uid=${uid}`, { id, searchTerms })

  const recipe: Record<string, unknown> = {
    ...data,
    id,
    createdBy: uid,
    searchTerms,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (displayName) recipe.createdByName = displayName
  Object.keys(recipe).forEach(k => recipe[k] === undefined && delete recipe[k])

  if (db) {
    try {
      await setDoc(doc(db, 'recipes', id), recipe)
      logger.info('recipes', 'createRecipe', `Recipe saved successfully`, { id })
    } catch (e) {
      logger.error('recipes', 'createRecipe', 'Firestore setDoc failed', e)
      throw e
    }
  } else {
    logger.warn('recipes', 'createRecipe', 'Firestore db is null — recipe not persisted')
  }

  return { ...recipe, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Recipe
}

export async function updateRecipe(
  uid: string,
  recipeId: string,
  data: Partial<Pick<Recipe, 'name' | 'description' | 'servings'>>
): Promise<void> {
  const db = getFirebaseDb()
  if (!db) { logger.warn('recipes', 'updateRecipe', 'db is null'); return }

  logger.info('recipes', 'updateRecipe', `Updating recipe ${recipeId}`, data)
  const ref = doc(db, 'recipes', recipeId)
  const snap = await getDoc(ref)
  if (!snap.exists()) { logger.error('recipes', 'updateRecipe', 'Recipe not found', { recipeId }); throw new Error('Recipe not found') }
  const existing = snap.data() as Recipe
  if (existing.createdBy !== uid) { logger.error('recipes', 'updateRecipe', 'Not authorized', { uid, createdBy: existing.createdBy }); throw new Error('Not authorized') }

  const updates: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() }
  if (data.name) {
    updates.searchTerms = buildSearchTerms(data.name, data.description ?? existing.description)
  }
  if (data.servings && data.servings !== existing.servings) {
    updates.nutrition = divideNutrition(existing.totalNutrition, data.servings)
  }

  try {
    await updateDoc(ref, updates)
    logger.info('recipes', 'updateRecipe', 'Updated successfully', { recipeId })
  } catch (e) {
    logger.error('recipes', 'updateRecipe', 'updateDoc failed', e)
    throw e
  }
}

export async function deleteRecipe(uid: string, recipeId: string): Promise<void> {
  const db = getFirebaseDb()
  if (!db) { logger.warn('recipes', 'deleteRecipe', 'db is null'); return }

  logger.info('recipes', 'deleteRecipe', `Deleting recipe ${recipeId}`)
  const ref = doc(db, 'recipes', recipeId)
  const snap = await getDoc(ref)
  if (!snap.exists()) { logger.error('recipes', 'deleteRecipe', 'Recipe not found', { recipeId }); throw new Error('Recipe not found') }
  const existing = snap.data() as Recipe
  if (existing.createdBy !== uid) { logger.error('recipes', 'deleteRecipe', 'Not authorized', { uid }); throw new Error('Not authorized') }

  try {
    await deleteDoc(ref)
    logger.info('recipes', 'deleteRecipe', 'Deleted successfully', { recipeId })
  } catch (e) {
    logger.error('recipes', 'deleteRecipe', 'deleteDoc failed', e)
    throw e
  }
}

export async function searchRecipes(queryStr: string): Promise<Recipe[]> {
  const db = getFirebaseDb()
  if (!db) return []

  const words = queryStr.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0)
  if (words.length === 0) return []

  const firstWord = words[0]
  const colRef = collection(db, 'recipes')
  const q = firestoreQuery(
    colRef,
    where('searchTerms', 'array-contains', firstWord),
    firestoreLimit(20)
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => d.data() as Recipe)
  return docs.filter(recipe =>
    words.every(word => recipe.searchTerms.some(t => t.includes(word)))
  ).slice(0, 10)
}

export async function getUserRecipes(uid: string): Promise<Recipe[]> {
  const db = getFirebaseDb()
  if (!db) return []

  const colRef = collection(db, 'recipes')
  const q = firestoreQuery(
    colRef,
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
    firestoreLimit(50)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Recipe)
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const db = getFirebaseDb()
  if (!db) return null

  const ref = doc(db, 'recipes', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as Recipe
}
