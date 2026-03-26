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
let mockIframe: HTMLIFrameElement & {
  contentDocument: { open: jest.Mock; write: jest.Mock; close: jest.Mock }
  contentWindow: { focus: jest.Mock; print: jest.Mock }
  onload: (() => void) | null
  remove: jest.Mock
}

beforeEach(() => {
  capturedContent = null

  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = jest.fn()

  const OriginalBlob = global.Blob
  jest.spyOn(global, 'Blob').mockImplementation((parts?: BlobPart[], options?: BlobPropertyBag) => {
    if (parts && parts.length > 0 && typeof parts[0] === 'string') {
      capturedContent = parts[0] as string
    }
    return new OriginalBlob(parts, options)
  })

  mockAnchor = { href: '', download: '', click: jest.fn() }

  // Mock iframe for PDF
  mockIframe = {
    id: '',
    style: { cssText: '' },
    contentDocument: { open: jest.fn(), write: jest.fn(), close: jest.fn() },
    contentWindow: { focus: jest.fn(), print: jest.fn() },
    onload: null,
    remove: jest.fn(),
  } as unknown as typeof mockIframe

  jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLElement
    if (tag === 'iframe') return mockIframe as unknown as HTMLElement
    return document.createElement.call(document, tag)
  })

  jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
  jest.spyOn(document, 'getElementById').mockReturnValue(null)
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
    const text = await getBlobText()
    expect(text).toContain('Date,Food,Meal Type,Quantity,Unit,Calories,Protein(g),Carbs(g),Fat(g),Fiber(g),Sugar(g),Sodium(mg),Cholesterol(mg)')
  })

  it('includes meal data rows and day totals row', async () => {
    exportDailyCSV(dailyData)
    const text = await getBlobText()
    expect(text).toContain('2026-03-25')
    expect(text).toContain('Egg')
    expect(text).toContain('Breakfast')
    expect(text).toContain('155')
    expect(text).toContain('DAY TOTAL')
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
    expect(text).toContain('DÍA')
  })

  it('names file with the date', () => {
    exportDailyCSV(dailyData)
    expect(mockAnchor.download).toBe('easy-calories-2026-03-25.csv')
  })
})

describe('exportHistoricalCSV', () => {
  it('includes rows for multiple days with totals', async () => {
    exportHistoricalCSV(historicalData)
    const text = await getBlobText()
    expect(text).toContain('2026-03-25')
    expect(text).toContain('2026-03-26')
    expect(text).toContain('Chicken breast')
    expect(text).toContain('DAY TOTAL')
  })

  it('names file easy-calories-history.csv', () => {
    exportHistoricalCSV(historicalData)
    expect(mockAnchor.download).toBe('easy-calories-history.csv')
  })
})

// ── Markdown ──────────────────────────────────────────────────────────────────

describe('exportDailyMarkdown', () => {
  it('produces correct markdown structure with all macro columns', async () => {
    exportDailyMarkdown(dailyData)
    const text = await getBlobText()
    expect(text).toContain('# Easy Calories — 2026-03-25')
    expect(text).toContain('## 🌅 Breakfast')
    expect(text).toContain('## ☀️ Lunch')
    expect(text).toContain('| Food | Qty | Cal | Protein | Carbs | Fat | Fiber | Sugar | Sodium |')
    expect(text).toContain('*Exported from ezcals.dev*')
  })

  it('includes macro totals summary at end', async () => {
    exportDailyMarkdown(dailyData)
    const text = await getBlobText()
    expect(text).toContain('Day totals')
    expect(text).toContain('355') // totalCalories
  })

  it('includes nutrition data in table', async () => {
    exportDailyMarkdown(dailyData)
    const text = await getBlobText()
    expect(text).toContain('13g')
    expect(text).toContain('124mg')
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

// ── PDF (iframe) ──────────────────────────────────────────────────────────────

describe('exportDailyPDF', () => {
  it('creates an iframe element (not window.open)', () => {
    exportDailyPDF(dailyData)
    expect(document.createElement).toHaveBeenCalledWith('iframe')
  })

  it('writes HTML with meal data into iframe document', () => {
    exportDailyPDF(dailyData)
    mockIframe.onload?.()
    expect(mockIframe.contentDocument.write).toHaveBeenCalledTimes(1)
    const html: string = mockIframe.contentDocument.write.mock.calls[0][0]
    expect(html).toContain('Easy Calories')
    expect(html).toContain('2026-03-25')
    expect(html).toContain('ezcals.dev')
    expect(html).toContain('Egg')
  })

  it('calls print on iframe contentWindow on load', () => {
    exportDailyPDF(dailyData)
    mockIframe.onload?.()
    expect(mockIframe.contentWindow.print).toHaveBeenCalled()
  })

  it('includes macro totals row in PDF table', () => {
    exportDailyPDF(dailyData)
    mockIframe.onload?.()
    const html: string = mockIframe.contentDocument.write.mock.calls[0][0]
    expect(html).toContain('TOTAL')
    expect(html).toContain('Protein')
    expect(html).toContain('Fiber')
    expect(html).toContain('Sodium')
  })
})

describe('exportHistoricalPDF', () => {
  it('creates an iframe element', () => {
    exportHistoricalPDF(historicalData)
    expect(document.createElement).toHaveBeenCalledWith('iframe')
  })

  it('includes all days in HTML', () => {
    exportHistoricalPDF(historicalData)
    mockIframe.onload?.()
    const html: string = mockIframe.contentDocument.write.mock.calls[0][0]
    expect(html).toContain('2026-03-25')
    expect(html).toContain('2026-03-26')
    expect(html).toContain('Chicken breast')
    expect(html).toContain('Grand total')
  })
})
