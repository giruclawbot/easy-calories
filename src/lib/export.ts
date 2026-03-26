import type { DayData, Meal, UserProfile } from './firestore'

export type ExportFormat = 'csv' | 'markdown' | 'pdf'

export interface DailyExportData {
  date: string
  meals: Meal[]
  totalCalories: number
  profile?: UserProfile
}

export interface HistoricalExportData {
  days: DailyExportData[]
  profile?: UserProfile
}

const MEAL_LABELS_EN: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const MEAL_LABELS_ES: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Merienda',
}

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

function getMealLabel(mealType: string | undefined, locale = 'en'): string {
  const type = mealType ?? 'snack'
  const map = locale === 'es' ? MEAL_LABELS_ES : MEAL_LABELS_EN
  return map[type] ?? type
}

function csvEscape(val: string | number | undefined): string {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const CSV_HEADERS = 'Date,Food,Meal Type,Quantity,Unit,Calories,Protein(g),Carbs(g),Fat(g),Fiber(g),Sugar(g),Sodium(mg)'

function mealToCSVRow(date: string, meal: Meal, locale = 'en'): string {
  const n = meal.nutrition
  return [
    csvEscape(date),
    csvEscape(meal.foodName),
    csvEscape(getMealLabel(meal.mealType, locale)),
    csvEscape(meal.quantity),
    csvEscape(meal.unit),
    csvEscape(Math.round(meal.calories)),
    csvEscape(n?.protein != null ? n.protein : ''),
    csvEscape(n?.carbs != null ? n.carbs : ''),
    csvEscape(n?.fat != null ? n.fat : ''),
    csvEscape(n?.fiber != null ? n.fiber : ''),
    csvEscape(n?.sugar != null ? n.sugar : ''),
    csvEscape(n?.sodium != null ? n.sodium : ''),
  ].join(',')
}

export function exportDailyCSV(data: DailyExportData, locale = 'en'): void {
  const rows = data.meals.map(m => mealToCSVRow(data.date, m, locale))
  const content = [CSV_HEADERS, ...rows].join('\n')
  triggerDownload(content, `easy-calories-${data.date}.csv`, 'text/csv;charset=utf-8;')
}

export function exportHistoricalCSV(data: HistoricalExportData, locale = 'en'): void {
  const rows = data.days.flatMap(day =>
    day.meals.map(m => mealToCSVRow(day.date, m, locale))
  )
  const content = [CSV_HEADERS, ...rows].join('\n')
  triggerDownload(content, `easy-calories-history.csv`, 'text/csv;charset=utf-8;')
}

// ── Markdown ──────────────────────────────────────────────────────────────────

function buildDayMarkdown(day: DailyExportData, locale = 'en'): string {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  const grouped: Record<string, Meal[]> = {}
  for (const meal of day.meals) {
    const type = meal.mealType ?? 'snack'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(meal)
  }

  let md = `## ${day.date}\n\n**Total: ${day.totalCalories} kcal**\n\n`

  for (const type of mealTypes) {
    if (!grouped[type] || grouped[type].length === 0) continue
    const emoji = MEAL_EMOJIS[type] ?? '🍽️'
    const label = getMealLabel(type, locale)
    md += `### ${emoji} ${label}\n`
    md += `| Food | Qty | Cal | Protein | Carbs | Fat |\n`
    md += `|------|-----|-----|---------|-------|-----|\n`
    for (const meal of grouped[type]) {
      const n = meal.nutrition
      md += `| ${meal.foodName} | ${meal.quantity}${meal.unit} | ${Math.round(meal.calories)} | ${n?.protein != null ? `${n.protein}g` : '-'} | ${n?.carbs != null ? `${n.carbs}g` : '-'} | ${n?.fat != null ? `${n.fat}g` : '-'} |\n`
    }
    md += '\n'
  }

  return md
}

export function exportDailyMarkdown(data: DailyExportData, locale = 'en'): void {
  let md = `# Easy Calories — ${data.date}\n\n`
  md += `**Total: ${data.totalCalories} kcal**\n\n`

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  const grouped: Record<string, Meal[]> = {}
  for (const meal of data.meals) {
    const type = meal.mealType ?? 'snack'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(meal)
  }

  for (const type of mealTypes) {
    if (!grouped[type] || grouped[type].length === 0) continue
    const emoji = MEAL_EMOJIS[type] ?? '🍽️'
    const label = getMealLabel(type, locale)
    md += `## ${emoji} ${label}\n`
    md += `| Food | Qty | Cal | Protein | Carbs | Fat |\n`
    md += `|------|-----|-----|---------|-------|-----|\n`
    for (const meal of grouped[type]) {
      const n = meal.nutrition
      md += `| ${meal.foodName} | ${meal.quantity}${meal.unit} | ${Math.round(meal.calories)} | ${n?.protein != null ? `${n.protein}g` : '-'} | ${n?.carbs != null ? `${n.carbs}g` : '-'} | ${n?.fat != null ? `${n.fat}g` : '-'} |\n`
    }
    md += '\n'
  }

  md += `---\n*Exported from ezcals.dev*\n`
  triggerDownload(md, `easy-calories-${data.date}.md`, 'text/markdown;charset=utf-8;')
}

export function exportHistoricalMarkdown(data: HistoricalExportData, locale = 'en'): void {
  let md = `# Easy Calories — History\n\n`
  for (const day of data.days) {
    md += buildDayMarkdown(day, locale)
    md += '\n'
  }
  md += `---\n*Exported from ezcals.dev*\n`
  triggerDownload(md, `easy-calories-history.md`, 'text/markdown;charset=utf-8;')
}

// ── PDF (window.print) ────────────────────────────────────────────────────────

const PDF_CSS = `
  body { font-family: Arial, sans-serif; background: white; color: black; margin: 20px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 20px; margin-bottom: 4px; }
  h3 { font-size: 14px; margin-top: 16px; margin-bottom: 4px; }
  .total { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; font-size: 12px; }
  th { background: #f0f0f0; }
  .footer { margin-top: 20px; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
  @media print { body { margin: 0; } }
`

function buildMealTableHTML(meals: Meal[], locale: string): string {
  const rows = meals.map(m => {
    const n = m.nutrition
    return `<tr>
      <td>${m.foodName}</td>
      <td>${m.quantity}${m.unit}</td>
      <td>${getMealLabel(m.mealType, locale)}</td>
      <td>${Math.round(m.calories)}</td>
      <td>${n?.protein != null ? `${n.protein}g` : '-'}</td>
      <td>${n?.carbs != null ? `${n.carbs}g` : '-'}</td>
      <td>${n?.fat != null ? `${n.fat}g` : '-'}</td>
    </tr>`
  }).join('')
  return `<table>
    <thead><tr><th>Food</th><th>Qty</th><th>Meal</th><th>Cal</th><th>Protein</th><th>Carbs</th><th>Fat</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

function buildDayHTML(day: DailyExportData, locale: string): string {
  return `<h2>${day.date}</h2>
  <p class="total">Total: ${day.totalCalories} kcal</p>
  ${buildMealTableHTML(day.meals, locale)}`
}

function openPrintWindow(html: string): void {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.onload = () => {
    w.print()
    w.onafterprint = () => w.close()
  }
}

export function exportDailyPDF(data: DailyExportData, locale = 'en'): void {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Easy Calories — ${data.date}</title><style>${PDF_CSS}</style></head>
  <body>
    <h1>Easy Calories — ${data.date}</h1>
    <p class="total">Total: ${data.totalCalories} kcal</p>
    ${buildMealTableHTML(data.meals, locale)}
    <div class="footer">Exported from ezcals.dev</div>
  </body></html>`
  openPrintWindow(html)
}

export function exportHistoricalPDF(data: HistoricalExportData, locale = 'en'): void {
  const daysHTML = data.days.map(d => buildDayHTML(d, locale)).join('\n')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Easy Calories — History</title><style>${PDF_CSS}</style></head>
  <body>
    <h1>Easy Calories — History</h1>
    ${daysHTML}
    <div class="footer">Exported from ezcals.dev</div>
  </body></html>`
  openPrintWindow(html)
}
