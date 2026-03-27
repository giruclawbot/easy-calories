import { searchCommunityFoods, addCommunityFood, getAllRecentCommunityFoods } from '../communityFoods'
import { getFirebaseDb } from '../firebase'

jest.mock('../firebase', () => ({
  getFirebaseDb: jest.fn(),
}))

const mockGetDocs = jest.fn()
const mockSetDoc = jest.fn()
const mockDoc = jest.fn(() => ({}))
const mockCollection = jest.fn(() => ({}))
const mockQuery = jest.fn((...args) => args)
const mockWhere = jest.fn(() => ({}))
const mockOrderBy = jest.fn(() => ({}))
const mockLimit = jest.fn(() => ({}))
const mockServerTimestamp = jest.fn(() => 'SERVER_TIMESTAMP')

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
}))

const mockDb = {}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getFirebaseDb as jest.Mock).mockReturnValue(mockDb)
})

describe('searchCommunityFoods', () => {
  it('returns empty array when db is null', async () => {
    ;(getFirebaseDb as jest.Mock).mockReturnValue(null)
    const result = await searchCommunityFoods('tortilla')
    expect(result).toEqual([])
  })

  it('returns empty array for empty query', async () => {
    const result = await searchCommunityFoods('  ')
    expect(result).toEqual([])
  })

  it('queries Firestore and returns matching foods', async () => {
    const mockFood = {
      id: '1',
      name: 'Tortilla',
      description: 'Tortilla',
      searchTerms: ['tortilla', 'maiz'],
      nutrition: { calories: 200, protein: 5, carbs: 40, fat: 3, fiber: 2, sugar: 1, sodium: 100, cholesterol: 0 },
      source: 'community',
    }
    mockGetDocs.mockResolvedValue({ docs: [{ data: () => mockFood }] })

    const result = await searchCommunityFoods('tortilla')
    expect(mockWhere).toHaveBeenCalledWith('searchTerms', 'array-contains', 'tortilla')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Tortilla')
  })

  it('filters out foods that do not match all words', async () => {
    const mockFood = {
      id: '1',
      name: 'Tortilla',
      description: 'Tortilla',
      searchTerms: ['tortilla'],
      nutrition: { calories: 200, protein: 5, carbs: 40, fat: 3, fiber: 2, sugar: 1, sodium: 100, cholesterol: 0 },
      source: 'community',
    }
    mockGetDocs.mockResolvedValue({ docs: [{ data: () => mockFood }] })

    // searching "tortilla maiz" — food only has "tortilla", should be filtered out
    const result = await searchCommunityFoods('tortilla maiz')
    expect(result).toHaveLength(0)
  })
})

describe('addCommunityFood', () => {
  const formData = {
    name: 'Tortilla',
    brand: 'Maseca',
    servingSize: 100,
    unit: 'g',
    calories: 200,
    protein: 5,
    carbs: 40,
    fat: 3,
    fiber: 2,
    sugar: 1,
    sodium: 100,
    cholesterol: 0,
  }

  it('saves to Firestore and returns a CommunityFood', async () => {
    mockSetDoc.mockResolvedValue(undefined)
    const result = await addCommunityFood('user1', 'Test User', formData)

    expect(mockSetDoc).toHaveBeenCalled()
    expect(result.name).toBe('Tortilla')
    expect(result.source).toBe('community')
    expect(result.searchTerms).toContain('tortilla')
    expect(result.searchTerms).toContain('maseca')
  })

  it('builds search terms from name and brand', async () => {
    mockSetDoc.mockResolvedValue(undefined)
    const result = await addCommunityFood('user1', null, { ...formData, brand: 'Bimbo' })
    expect(result.searchTerms).toContain('bimbo')
  })
})

describe('getAllRecentCommunityFoods', () => {
  it('returns empty array when db is null', async () => {
    ;(getFirebaseDb as jest.Mock).mockReturnValue(null)
    const result = await getAllRecentCommunityFoods()
    expect(result).toEqual([])
  })

  it('queries with orderBy and limit', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] })
    await getAllRecentCommunityFoods(5)
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc')
    expect(mockLimit).toHaveBeenCalledWith(5)
  })
})
