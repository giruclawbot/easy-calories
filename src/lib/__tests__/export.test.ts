import {
  exportDailyCSV,
  exportHistoricalCSV,
  exportDailyMarkdown,
  exportHistoricalMarkdown,
  exportDailyPDF,
  exportHistoricalPDF,
  DailyExportData,
  HistoricalExportData,
} from '../export'

let capturedContent: string | null = null
let mockAnchor: { href: string; download: string; click: jest.Mock }
let mockWin: {
  document: { write: jest.Mock; close: jest.Mock }
  print: jest.Mock
  close: jest.Mock
  onload: (() => void) | null
  onafterprint: (() => void) | null
}

beforeEach(() => {
  capturedContent = null

  // Mock URL.createObjectURL / revokeObjectURL
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = jest.fn()

  // Intercept Blob constructor to capture content
  const OriginalBlob = global.Blob
  jest.spyOn(global, 'Blob').mockImplementation((parts?: BlobPart[], options?: BlobPropertyBag) => {
    if (parts && parts.length > 0 && typeof parts[0] === 'string') {
      capturedContent = parts[0] as string
    }
    return new OriginalBlob(parts, options)
  })

  // Mock anchor element
  mockAnchor = { href: '', download: '', click: jest.fn() }
  jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLElement
    return document.createElement.call(document, tag)
  })

  // Mock window.open
  mockWin = {
    document: { write: jest.fn(), close: jest.fn() },
    print: jest.fn(),
    close: jest.fn(),
    onload: null,
    onafterprint: null,
  }
  jest.spyOn(window, 'open').mockReturnValue(mockWin as unknown as Window)
})

afterEach(() => {
  jest.restoreAllMocks()
})

async function getBlobText(): Promise<string> {
  return capturedContent ?? ''
}

const meal1 = {
  id: '1',
  foodName: 'Egg',
  calories: 155,
  quantity: 100,
  unit: 'g',
  timestamp: '2026-03-25T08:00:00Z',
  mealType: 'breakfast' as const,
  nutrition: { protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1, sodium: 124, calories: 155, cholesterol: 0 },
}

const meal2 = {
  id: '2',
  foodName: 'Rice, cooked',
  calories: 200,
  quantity: 150,
  unit: 'g',
  timestamp: '2026-03-25T12:00:00Z',
  mealType: 'lunch' as const,
  nutrition: { protein: 4, carbs: 45, fat: 0.5, fiber: 0.6, sugar: 0, sodium: 2, calories: 200, cholesterol: 0 },
}

const dailyData: DailyExportData = {
  date: '2026-03-25',
  meals: [meal1, meal2],
  totalCalories: 355,
}

const historicalData: HistoricalExportData = {
  days: [
    dailyData,
    {
      date: '2026-03-26',
      meals: [
        {
          id: '3',
          foodName: 'Chicken breast',
          calories: 165,
          quantity: 100,
          unit: 'g',
          timestamp: '2026-03-26T12:00:00Z',
          mealType: 'lunch' as const,
        },
      ],
      totalCalories: 165,
    },
  ],
}

// ── CSV ───────────────────────────────────────────────────────────────────────

describe('exportDailyCSV', () => {
  it('creates a blob download with correct CSV headers', async () => {
    exportDailyCSV(dailyData)
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(mockAnchor.click).toHaveBeenCalledTimes(1)
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    const text = await getBlobText()
    expect(text).toContain('Date,Food,Meal Type,Quantity,Unit,Calories,Protein(g),Carbs(g),Fat(g),Fiber(g),Sugar(g),Sodium(mg)')
  })

  it('includes meal data rows', async () => {
    exportDailyCSV(dailyData)
    const text = await getBlobText()
    expect(text).toContain('2026-03-25')
    expect(text).toContain('Egg')
    expect(text).toContain('Breakfast')
    expect(text).toContain('155')
  })

  it('wraps food names with commas in quotes', async () => {
    const data: DailyExportData = {
      date: '2026-03-25',
      meals: [{ ...meal1, foodName: 'Bread, whole wheat' }],
      totalCalories: 100,
    }
    exportDailyCSV(data)
    const text = await getBlobText()
    expect(text).toContain('"Bread, whole wheat"')
  })

  it('uses es labels when locale=es', async () => {
    exportDailyCSV(dailyData, 'es')
    const text = await getBlobText()
    expect(text).toContain('Desayuno')
  })

  it('names file with the date', () => {
    exportDailyCSV(dailyData)
    expect(mockAnchor.download).toBe('easy-calories-2026-03-25.csv')
  })
})

describe('exportHistoricalCSV', () => {
  it('includes rows for multiple days', async () => {
    exportHistoricalCSV(historicalData)
    const text = await getBlobText()
    expect(text).toContain('2026-03-25')
    expect(text).toContain('2026-03-26')
    expect(text).toContain('Chicken breast')
  })

  it('names file easy-calories-history.csv', () => {
    exportHistoricalCSV(historicalData)
    expect(mockAnchor.download).toBe('easy-calories-history.csv')
  })
})

// ── Markdown ──────────────────────────────────────────────────────────────────

describe('exportDailyMarkdown', () => {
  it('produces correct markdown structure', async () => {
    exportDailyMarkdown(dailyData)
    const text = await getBlobText()
    expect(text).toContain('# Easy Calories — 2026-03-25')
    expect(text).toContain('**Total: 355 kcal**')
    expect(text).toContain('## 🌅 Breakfast')
    expect(text).toContain('## ☀️ Lunch')
    expect(text).toContain('| Food | Qty | Cal | Protein | Carbs | Fat |')
    expect(text).toContain('Egg')
    expect(text).toContain('*Exported from ezcals.dev*')
  })

  it('includes nutrition data in table', async () => {
    exportDailyMarkdown(dailyData)
    const text = await getBlobText()
    expect(text).toContain('13g')
    expect(text).toContain('100g')
  })

  it('shows - for missing nutrition', async () => {
    const data: DailyExportData = {
      date: '2026-03-25',
      meals: [{ ...meal1, nutrition: undefined }],
      totalCalories: 155,
    }
    exportDailyMarkdown(data)
    const text = await getBlobText()
    expect(text).toContain('| - |')
  })
})

describe('exportHistoricalMarkdown', () => {
  it('groups by day with H2 headings', async () => {
    exportHistoricalMarkdown(historicalData)
    const text = await getBlobText()
    expect(text).toContain('## 2026-03-25')
    expect(text).toContain('## 2026-03-26')
    expect(text).toContain('Chicken breast')
    expect(text).toContain('# Easy Calories — History')
  })
})

// ── PDF ───────────────────────────────────────────────────────────────────────

describe('exportDailyPDF', () => {
  it('calls window.open', () => {
    exportDailyPDF(dailyData)
    expect(window.open).toHaveBeenCalledWith('', '_blank')
  })

  it('writes HTML to the new window', () => {
    exportDailyPDF(dailyData)
    expect(mockWin.document.write).toHaveBeenCalledTimes(1)
    const html: string = mockWin.document.write.mock.calls[0][0]
    expect(html).toContain('Easy Calories')
    expect(html).toContain('2026-03-25')
    expect(html).toContain('ezcals.dev')
  })

  it('calls print on window load', () => {
    exportDailyPDF(dailyData)
    mockWin.onload?.()
    expect(mockWin.print).toHaveBeenCalled()
  })
})

describe('exportHistoricalPDF', () => {
  it('calls window.open', () => {
    exportHistoricalPDF(historicalData)
    expect(window.open).toHaveBeenCalledWith('', '_blank')
  })

  it('includes all days in HTML', () => {
    exportHistoricalPDF(historicalData)
    const html: string = mockWin.document.write.mock.calls[0][0]
    expect(html).toContain('2026-03-25')
    expect(html).toContain('2026-03-26')
    expect(html).toContain('Chicken breast')
  })
})
