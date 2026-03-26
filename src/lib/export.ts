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

// ── Helpers ───────────────────────────────────────────────────────────────────

const MEAL_LABELS_EN: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
}
const MEAL_LABELS_ES: Record<string, string> = {
  breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Merienda',
}
const MEAL_EMOJIS: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
}

function getMealLabel(mealType: string | undefined, locale = 'en'): string {
  const type = mealType ?? 'snack'
  return (locale === 'es' ? MEAL_LABELS_ES : MEAL_LABELS_EN)[type] ?? type
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

// Calculate macro totals from a list of meals
function calcTotals(meals: Meal[]) {
  return meals.reduce(
    (acc, m) => {
      const n = m.nutrition
      if (!n) return acc
      return {
        calories:    acc.calories    + m.calories,
        protein:     acc.protein     + (n.protein     ?? 0),
        carbs:       acc.carbs       + (n.carbs       ?? 0),
        fat:         acc.fat         + (n.fat         ?? 0),
        fiber:       acc.fiber       + (n.fiber       ?? 0),
        sugar:       acc.sugar       + (n.sugar       ?? 0),
        sodium:      acc.sodium      + (n.sodium      ?? 0),
        cholesterol: acc.cholesterol + (n.cholesterol ?? 0),
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 }
  )
}

function r(n: number, dec = 1) { return Math.round(n * 10 ** dec) / 10 ** dec }

// ── CSV ───────────────────────────────────────────────────────────────────────

const CSV_HEADERS =
  'Date,Food,Meal Type,Quantity,Unit,Calories,Protein(g),Carbs(g),Fat(g),Fiber(g),Sugar(g),Sodium(mg),Cholesterol(mg)'

function mealToCSVRow(date: string, meal: Meal, locale = 'en'): string {
  const n = meal.nutrition
  return [
    csvEscape(date),
    csvEscape(meal.foodName),
    csvEscape(getMealLabel(meal.mealType, locale)),
    csvEscape(meal.quantity),
    csvEscape(meal.unit),
    csvEscape(Math.round(meal.calories)),
    csvEscape(n?.protein  != null ? r(n.protein)  : ''),
    csvEscape(n?.carbs    != null ? r(n.carbs)    : ''),
    csvEscape(n?.fat      != null ? r(n.fat)      : ''),
    csvEscape(n?.fiber    != null ? r(n.fiber)    : ''),
    csvEscape(n?.sugar    != null ? r(n.sugar)    : ''),
    csvEscape(n?.sodium   != null ? r(n.sodium,0) : ''),
    csvEscape(n?.cholesterol != null ? r(n.cholesterol,0) : ''),
  ].join(',')
}

function dayTotalsCSVRow(date: string, meals: Meal[], locale: string): string {
  const t = calcTotals(meals)
  const label = locale === 'es' ? 'TOTAL DÍA' : 'DAY TOTAL'
  return [
    csvEscape(date),
    csvEscape(label),
    '', '', '',
    csvEscape(Math.round(t.calories)),
    csvEscape(r(t.protein)),
    csvEscape(r(t.carbs)),
    csvEscape(r(t.fat)),
    csvEscape(r(t.fiber)),
    csvEscape(r(t.sugar)),
    csvEscape(r(t.sodium, 0)),
    csvEscape(r(t.cholesterol, 0)),
  ].join(',')
}

export function exportDailyCSV(data: DailyExportData, locale = 'en'): void {
  const rows = data.meals.map(m => mealToCSVRow(data.date, m, locale))
  rows.push(dayTotalsCSVRow(data.date, data.meals, locale))
  const content = [CSV_HEADERS, ...rows].join('\n')
  triggerDownload(content, `easy-calories-${data.date}.csv`, 'text/csv;charset=utf-8;')
}

export function exportHistoricalCSV(data: HistoricalExportData, locale = 'en'): void {
  const rows = data.days.flatMap(day => [
    ...day.meals.map(m => mealToCSVRow(day.date, m, locale)),
    dayTotalsCSVRow(day.date, day.meals, locale),
    '', // blank separator between days
  ])
  const content = [CSV_HEADERS, ...rows].join('\n')
  triggerDownload(content, `easy-calories-history.csv`, 'text/csv;charset=utf-8;')
}

// ── Markdown ──────────────────────────────────────────────────────────────────

const MD_TABLE_HEADER =
  `| Food | Qty | Cal | Protein | Carbs | Fat | Fiber | Sugar | Sodium |\n` +
  `|------|-----|-----|---------|-------|-----|-------|-------|--------|\n`

function mealToMDRow(meal: Meal): string {
  const n = meal.nutrition
  return `| ${meal.foodName} | ${meal.quantity}${meal.unit} | ${Math.round(meal.calories)} | ${n?.protein != null ? `${r(n.protein)}g` : '-'} | ${n?.carbs != null ? `${r(n.carbs)}g` : '-'} | ${n?.fat != null ? `${r(n.fat)}g` : '-'} | ${n?.fiber != null ? `${r(n.fiber)}g` : '-'} | ${n?.sugar != null ? `${r(n.sugar)}g` : '-'} | ${n?.sodium != null ? `${r(n.sodium,0)}mg` : '-'} |\n`
}

function totalsMDRow(meals: Meal[], locale: string): string {
  const t = calcTotals(meals)
  const label = locale === 'es' ? '**TOTAL**' : '**TOTAL**'
  return `| ${label} | — | **${Math.round(t.calories)}** | **${r(t.protein)}g** | **${r(t.carbs)}g** | **${r(t.fat)}g** | **${r(t.fiber)}g** | **${r(t.sugar)}g** | **${r(t.sodium,0)}mg** |\n`
}

function buildDayMarkdown(day: DailyExportData, locale = 'en', headingLevel = 2): string {
  const H = '#'.repeat(headingLevel)
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  const grouped: Record<string, Meal[]> = {}
  for (const meal of day.meals) {
    const type = meal.mealType ?? 'others'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(meal)
  }

  let md = `${H} ${day.date}\n\n`

  for (const type of [...mealTypes, 'others']) {
    if (!grouped[type]?.length) continue
    const emoji = MEAL_EMOJIS[type] ?? '📦'
    const label = getMealLabel(type, locale)
    md += `${H}# ${emoji} ${label}\n`
    md += MD_TABLE_HEADER
    for (const meal of grouped[type]) md += mealToMDRow(meal)
    md += '\n'
  }

  // Day totals
  const t = calcTotals(day.meals)
  md += `> **${locale === 'es' ? 'Totales del día' : 'Day totals'}:** ${Math.round(t.calories)} kcal · Protein ${r(t.protein)}g · Carbs ${r(t.carbs)}g · Fat ${r(t.fat)}g · Fiber ${r(t.fiber)}g · Sodium ${r(t.sodium,0)}mg\n\n`

  return md
}

export function exportDailyMarkdown(data: DailyExportData, locale = 'en'): void {
  let md = `# Easy Calories — ${data.date}\n\n`
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  const grouped: Record<string, Meal[]> = {}
  for (const meal of data.meals) {
    const type = meal.mealType ?? 'others'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(meal)
  }
  for (const type of [...mealTypes, 'others']) {
    if (!grouped[type]?.length) continue
    const emoji = MEAL_EMOJIS[type] ?? '📦'
    const label = getMealLabel(type, locale)
    md += `## ${emoji} ${label}\n`
    md += MD_TABLE_HEADER
    for (const meal of grouped[type]) md += mealToMDRow(meal)
    md += totalsMDRow(grouped[type], locale)
    md += '\n'
  }

  // Grand total
  const t = calcTotals(data.meals)
  md += `---\n\n## ${locale === 'es' ? 'Totales del día' : 'Day totals'}\n\n`
  md += `| Calories | Protein | Carbs | Fat | Fiber | Sugar | Sodium |\n`
  md += `|----------|---------|-------|-----|-------|-------|--------|\n`
  md += `| **${Math.round(t.calories)}** | **${r(t.protein)}g** | **${r(t.carbs)}g** | **${r(t.fat)}g** | **${r(t.fiber)}g** | **${r(t.sugar)}g** | **${r(t.sodium,0)}mg** |\n\n`
  md += `---\n*Exported from ezcals.dev*\n`
  triggerDownload(md, `easy-calories-${data.date}.md`, 'text/markdown;charset=utf-8;')
}

export function exportHistoricalMarkdown(data: HistoricalExportData, locale = 'en'): void {
  let md = `# Easy Calories — History\n\n`
  for (const day of data.days) {
    md += buildDayMarkdown(day, locale, 2)
    md += '\n---\n\n'
  }
  md += `*Exported from ezcals.dev*\n`
  triggerDownload(md, `easy-calories-history.md`, 'text/markdown;charset=utf-8;')
}

// ── PDF ───────────────────────────────────────────────────────────────────────
// PWA-safe: use hidden iframe instead of window.open (blocked in standalone mode)

const PDF_CSS = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Arial, sans-serif; background: white; color: #111; margin: 24px; font-size: 13px; }
  h1 { font-size: 20px; color: #065f46; margin: 0 0 4px; }
  h2 { font-size: 15px; color: #374151; margin: 20px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  h3 { font-size: 13px; color: #6b7280; margin: 14px 0 4px; }
  .subtitle { color: #6b7280; font-size: 12px; margin: 0 0 16px; }
  .total-box { background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 10px 16px; margin: 12px 0; }
  .total-box p { margin: 0; font-weight: bold; color: #065f46; font-size: 14px; }
  .macro-row { display: flex; gap: 12px; flex-wrap: wrap; margin: 4px 0 12px; }
  .macro-chip { background: #f3f4f6; border-radius: 4px; padding: 2px 8px; font-size: 11px; color: #374151; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0 14px; page-break-inside: avoid; }
  th { background: #f9fafb; border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; }
  td { border: 1px solid #e5e7eb; padding: 5px 8px; font-size: 12px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .totals-row td { background: #ecfdf5 !important; font-weight: bold; border-top: 2px solid #6ee7b7; }
  .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  @media print { body { margin: 0; } @page { margin: 16mm; } }
`

function macroChips(t: ReturnType<typeof calcTotals>): string {
  return `<div class="macro-row">
    <span class="macro-chip">🥩 Protein: ${r(t.protein)}g</span>
    <span class="macro-chip">🍞 Carbs: ${r(t.carbs)}g</span>
    <span class="macro-chip">🧈 Fat: ${r(t.fat)}g</span>
    <span class="macro-chip">🌾 Fiber: ${r(t.fiber)}g</span>
    <span class="macro-chip">🍬 Sugar: ${r(t.sugar)}g</span>
    <span class="macro-chip">🧂 Sodium: ${r(t.sodium,0)}mg</span>
  </div>`
}

function buildMealTableHTML(meals: Meal[], locale: string): string {
  const rows = meals.map(m => {
    const n = m.nutrition
    return `<tr>
      <td>${m.foodName}</td>
      <td>${m.quantity}${m.unit}</td>
      <td>${getMealLabel(m.mealType, locale)}</td>
      <td>${Math.round(m.calories)}</td>
      <td>${n?.protein != null ? `${r(n.protein)}g` : '-'}</td>
      <td>${n?.carbs != null ? `${r(n.carbs)}g` : '-'}</td>
      <td>${n?.fat != null ? `${r(n.fat)}g` : '-'}</td>
      <td>${n?.fiber != null ? `${r(n.fiber)}g` : '-'}</td>
      <td>${n?.sugar != null ? `${r(n.sugar)}g` : '-'}</td>
      <td>${n?.sodium != null ? `${r(n.sodium,0)}mg` : '-'}</td>
    </tr>`
  }).join('')
  const t = calcTotals(meals)
  const totalsRow = `<tr class="totals-row">
    <td colspan="3">TOTAL</td>
    <td>${Math.round(t.calories)}</td>
    <td>${r(t.protein)}g</td>
    <td>${r(t.carbs)}g</td>
    <td>${r(t.fat)}g</td>
    <td>${r(t.fiber)}g</td>
    <td>${r(t.sugar)}g</td>
    <td>${r(t.sodium,0)}mg</td>
  </tr>`
  return `<table>
    <thead><tr>
      <th>Food</th><th>Qty</th><th>Meal</th><th>Cal</th>
      <th>Protein</th><th>Carbs</th><th>Fat</th><th>Fiber</th><th>Sugar</th><th>Sodium</th>
    </tr></thead>
    <tbody>${rows}${totalsRow}</tbody>
  </table>`
}

function buildDayHTML(day: DailyExportData, locale: string): string {
  const t = calcTotals(day.meals)
  return `<h2>${day.date}</h2>
  <div class="total-box"><p>${day.totalCalories} kcal</p></div>
  ${macroChips(t)}
  ${buildMealTableHTML(day.meals, locale)}`
}

function printViaIframe(html: string): void {
  // Remove any previous print iframe
  const existing = document.getElementById('__ec_print_frame')
  if (existing) existing.remove()

  const iframe = document.createElement('iframe')
  iframe.id = '__ec_print_frame'
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    // Clean up after print dialog closes
    setTimeout(() => iframe.remove(), 2000)
  }
}

export function exportDailyPDF(data: DailyExportData, locale = 'en'): void {
  const t = calcTotals(data.meals)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Easy Calories — ${data.date}</title>
    <style>${PDF_CSS}</style></head>
  <body>
    <h1>Easy Calories</h1>
    <p class="subtitle">${data.date}</p>
    <div class="total-box"><p>${data.totalCalories} kcal</p></div>
    ${macroChips(t)}
    ${buildMealTableHTML(data.meals, locale)}
    <div class="footer">Exported from ezcals.dev · ${new Date().toISOString().slice(0,10)}</div>
  </body></html>`
  printViaIframe(html)
}

export function exportHistoricalPDF(data: HistoricalExportData, locale = 'en'): void {
  const allMeals = data.days.flatMap(d => d.meals)
  const grandTotal = calcTotals(allMeals)
  const daysHTML = data.days.map(d => buildDayHTML(d, locale)).join('\n<hr style="margin:20px 0;">\n')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Easy Calories — History</title>
    <style>${PDF_CSS}</style></head>
  <body>
    <h1>Easy Calories — History</h1>
    <p class="subtitle">${data.days.length} days · ${data.days[0]?.date ?? ''} → ${data.days[data.days.length - 1]?.date ?? ''}</p>
    <div class="total-box"><p>Grand total: ${Math.round(grandTotal.calories)} kcal</p></div>
    ${macroChips(grandTotal)}
    <hr style="margin:20px 0;">
    ${daysHTML}
    <div class="footer">Exported from ezcals.dev · ${new Date().toISOString().slice(0,10)}</div>
  </body></html>`
  printViaIframe(html)
}
