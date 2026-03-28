# 🥗 Easy Calories

> **Track as easy as possible**

A Progressive Web App for tracking daily calorie and macro intake. Search 900,000+ foods from the USDA database, scan barcodes, log recipes, and visualize weekly progress — all in a fast, offline-capable mobile-first app.

**Live:** https://ezcals.dev

---

## Features

### 🍽️ Food Tracking
- 🔍 **Food Search** — 900,000+ foods from USDA FoodData Central + community foods, debounced at 400ms
- 📷 **Barcode Scanner** — camera-based via Quagga2 + Open Food Facts fallback (3M+ products)
- ⚡ **Quick Add** — one-tap re-add of frequently used foods (≥2 uses)
- 🥦 **Full Nutrition** — calories, protein, carbs, fat, fiber, sugar, sodium, cholesterol per meal
- 🍳 **Meal Types** — tag meals as Breakfast / Lunch / Dinner / Snack with smart time defaults
- ✏️ **Edit Meals** — adjust quantity/unit or move to a different meal type, real-time macro recalculation
- 📐 **Smart Portions** — quick portion buttons per food type (e.g. "1 large egg · 50g", "1 medium fillet · 120g")

### 🍲 Recipes
- Create community recipes from multiple ingredients
- Search and browse recipes created by other users (👥 Community)
- Add recipe to daily log with portion selector (0.5 – 4 servings)
- Edit / delete your own recipes inline
- Live per-serving macro preview while building a recipe
- Barcode scanner available while adding recipe ingredients

### 🥗 Community Foods
- Add custom foods with full nutritional info — available to all users
- Nutrition automatically normalized to per-100g on save
- Vote 👍/👎 on community foods; change or remove your vote at any time
- Quality badges:
  - ✅ **Verified** — ≥5 likes and ≥70% positive votes
  - ⚠️ **Questionable** — ≥3 dislikes and ≥60% negative votes
- Edit / delete your own foods with ownership check
- Live per-100g preview when serving size ≠ 100g

### 📊 Dashboard & Goals
- **Daily summary** — calories consumed vs goal, remaining/excess, macro totals with progress bars
- **Weekly chart** — green/red bars vs calorie goal
- **Calorie Calculator** — Mifflin-St Jeor + TDEE, goal type (lose/maintain/gain), target weight, weekly pace
- **Goal timeline** — estimated weeks/months to reach target weight
- **Macro targets** — per WHO/AMDR standards: protein by body weight, carbs/fat by TDEE%, fiber 14g/1000kcal
- Goal type badge: 📉 Losing / ⚖️ Maintaining / 📈 Gaining

### 💧 Hydration Tracking *(opt-in)*
- Enable in Profile settings
- Quick-add buttons: +150ml, +250ml, +350ml, +500ml
- Custom amount input + daily progress bar
- Personalized hydration goal calculator (weight, activity, sex)
- Read-only view for past dates

### 💊 Supplement Tracking *(opt-in)*
- Enable in Profile settings
- Search USDA Branded + Open Food Facts for supplements
- Caloric supplements (>5 kcal) auto-added to meals for calorie counting
- Non-caloric supplements tracked separately
- View and remove today's supplement log

### 📤 Data Export
- Export today or full history as CSV, Markdown, or PDF
- Full nutrition details per meal in export

### 👤 User Profile
- Personal data: sex, age, weight, height
- Unit system: Metric (kg/cm) or Imperial (lbs/ft)
- Language selector: 🇲🇽 Spanish / 🇺🇸 English (persisted across devices)
- Goal details panel

### 📱 PWA
- Installable on iOS and Android (Add to Home Screen)
- Works offline with service worker cache
- No zoom on input focus (iOS Safari fix)

### 🔒 Security & Auth
- Google Sign-In via Firebase Auth
- Firestore rules: strict per-user data isolation
- Community data: read = any authenticated user, write = creator only

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS 4 |
| Auth | Firebase Auth (Google Sign-In) |
| Database | Firebase Firestore |
| Food Data | USDA FoodData Central API + Open Food Facts |
| Barcode | @ericblade/quagga2 |
| Forms | React Hook Form + Zod 4 |
| Charts | Recharts |
| Dates | date-fns |
| Logging | Custom logger → Firebase Analytics in prod |
| Testing | Jest + Testing Library |
| Deploy | Firebase Hosting (static export) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project (Firestore + Auth + Hosting enabled)
- USDA FoodData Central API key (free at https://fdc.nal.usda.gov/api-guide.html)

### Local Development

```bash
git clone https://github.com/giruclawbot/easy-calories.git
cd easy-calories
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_USDA_API_KEY=your_usda_key
```

See `SECRETS.md` for GitHub Actions CI/CD secrets.

---

## Development

### Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build (Next.js + inject SW version)
npm run lint          # ESLint
npm test              # Run all tests
npm run test:coverage # Tests with coverage report
npm run test:ci       # CI mode
```

### Branch Strategy (GitFlow)

| Branch | Purpose |
|--------|---------|
| `main` | Production → auto-deploys to Firebase Hosting |
| `develop` | Integration branch |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

See `CONTRIBUTING.md` for full workflow.

### Release Checklist

Before any release (see `AGENTS.md`):
1. Update `CHANGELOG.md`
2. Bump `version` in `package.json`
3. `npm run build` — must pass
4. `npm test` — all tests must pass
5. Push to `develop`, merge to `main`
6. `firebase deploy --only hosting,firestore`

---

## Architecture

### Static Export + Firebase Hosting

Uses `output: 'export'` — no server-side rendering. All constraints:
- No `/api` routes
- `cleanUrls: true`, `trailingSlash: false`
- All API calls (USDA, Open Food Facts) are client-side
- Dynamic routes (e.g. `/recipes/[id]`) must use `useParams()` or `useSearchParams()` client-side to read real IDs — `generateStaticParams()` only produces the HTML shell

### Firebase Lazy Init

Firebase must be initialized browser-only to avoid SSR prerender crash:

```ts
// ✅ Correct
export function getFirebaseDb(): Firestore | null {
  if (typeof window === 'undefined') return null
  // ...
}

// ❌ Wrong — crashes CI
const db = getFirestore(initializeApp(config))
```

### Nutrition Normalization

All `NutritionFacts` values are stored **per 100g** throughout the app. When displaying or logging a food, values are scaled by `quantity / 100`.

Community foods entered by users are normalized on save:
```ts
const ratio = 100 / servingSize
nutrition.calories = Math.round(userCalories * ratio * 10) / 10
```

### Offline-First Goal Sync

1. Load from `localStorage` immediately (instant, works offline)
2. Sync from Firestore (overrides if newer)
3. Save to both localStorage and Firestore

### Firestore Data Model

```
users/{uid}/
  settings/profile          — UserProfile (goals, personal data, preferences)
  days/{YYYY-MM-DD}         — DayData (meals[], totalCalories)
  frequentFoods/{slug}      — FrequentFood (usage tracking for Quick Add)
  hydration/{YYYY-MM-DD}    — HydrationLog (totalMl, logs[])
  supplements/{YYYY-MM-DD}  — SupplementLog (entries[])

communityFoods/{id}         — CommunityFood (nutrition per 100g, likes, dislikes)
communityFoodVotes/{uid_id} — Vote (uid, foodId, vote: 'like'|'dislike')
recipes/{id}                — Recipe (ingredients[], nutrition per serving, createdBy)
```

### Logging

`src/lib/logger.ts` — structured logger:
- **Dev**: colored console output with `[LEVEL] [module::fn] message` format
- **Prod**: minimal console + errors/warnings sent to Firebase Analytics as `app_error`/`app_warning` events

```ts
logger.info('firestore', 'addMeal', 'Adding meal', { calories })
logger.error('recipes', 'createRecipe', 'Firestore failed', error)
```

---

## Testing

```bash
npm test                # Run all tests
npm run test:coverage   # With coverage report
```

Test files: `src/**/__tests__/`

---

## Deployment

Auto-deploys on push to `main` via GitHub Actions.

Manual deploy:
```bash
npm run build
firebase deploy --only hosting,firestore  # includes rules + indexes
```

> ⚠️ Always deploy `firestore` (rules + indexes) when adding new Firestore queries, not just `hosting`.

---

## For AI Agents

Read `AGENTS.md` before making changes. Key rules:
1. Always update `CHANGELOG.md` and bump `package.json` version before releasing
2. Firebase must be initialized lazily — never at module level
3. No trailing slash, no API routes
4. Dynamic route IDs must be read via `useParams()` / `useSearchParams()` — not from server props
5. `nutrition` fields are always per-100g — normalize on write if serving size ≠ 100g
6. `firebase deploy --only hosting` does NOT deploy Firestore rules/indexes — use `--only hosting,firestore`
7. New Firestore queries with `where + orderBy` on different fields require a composite index in `firestore.indexes.json`

---

## License

**Proprietary — All Rights Reserved**

© 2026 Jesus Enrique Dick Bustamante. This software is not open source.
See [LICENSE](./LICENSE) for full terms.
