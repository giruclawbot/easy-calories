# 🥗 Easy Calories

> **Track as easy as possible**

A Progressive Web App for tracking daily calorie and macro intake. Search 900,000+ foods from the USDA database, scan barcodes, and visualize weekly progress.

**Live:** https://giru-easy-calories.web.app

---

## Features

- 🔐 **Google Sign-In** via Firebase Auth
- 🔍 **Food Search** — 900,000+ foods from USDA FoodData Central (debounced, 400ms)
- 📷 **Barcode Scanner** — camera-based via Quagga2
- 🥦 **Nutrition Details** — calories, protein, carbs, fat, fiber, sugar, sodium, cholesterol per meal
- 📊 **Dashboard** — daily macro totals (protein/carbs/fat/fiber/sugar), progress bar, weekly chart
- ✏️ **Edit Meals** — adjust quantity/unit with real-time macro recalculation
- 🧮 **Calorie Calculator** — Mifflin-St Jeor + TDEE, customized by goal (lose/maintain/gain), target weight, and weekly pace
- ⏱ **Goal Timeline** — estimated weeks/months to reach target weight
- ☁️ **Cloud Goal Sync** — calorie goal stored in Firestore, offline-first with localStorage cache
- 📱 **PWA** — installable, works offline (service worker, cache-first)
- 📅 **Day Navigation** — browse historical data
- 🏆 **Best Score** — tracks personal records

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS 4 |
| Auth | Firebase Auth (Google Sign-In) |
| Database | Firebase Firestore |
| Food Data | USDA FoodData Central API |
| Barcode | @ericblade/quagga2 |
| Forms | React Hook Form + Zod 4 |
| Charts | Recharts |
| Dates | date-fns |
| Testing | Jest + Testing Library (≥90% coverage) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project
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

See `SECRETS.md` for setting up GitHub Actions CI/CD secrets.

---

## Development

### Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run tests
npm run test:coverage # Tests with coverage report
npm run test:ci      # Tests for CI (coverage ≥ 90% required)
```

### Branch Strategy (GitFlow)

| Branch | Purpose |
|--------|---------|
| `main` | Production → auto-deploys to Firebase |
| `develop` | Integration branch |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

See `CONTRIBUTING.md` for full workflow.

### Release Checklist

Before any release, see `AGENTS.md` for the mandatory checklist (also relevant for AI agents).

---

## Architecture

### Firebase Lazy Init

Firebase is initialized lazily (browser-only) to avoid crashes during static prerender:

```ts
// ✅ Correct — lazy
const auth = getFirebaseAuth() // returns null on server

// ❌ Wrong — crashes CI with placeholder keys
const auth = getAuth(initializeApp(config))
```

### Static Export + Firebase Hosting

The app uses `output: 'export'` for static hosting. Constraints:
- No server-side API routes (`/api/*`)
- No trailing slash (`trailingSlash: false` in next.config.ts)
- All external API calls (USDA) are client-side

### Offline-First Goal Sync

Calorie goal is stored in Firestore with localStorage as offline cache:
1. On load → immediately read from localStorage (instant, works offline)
2. Then → sync from Firestore (overrides cache if newer)
3. On save → write to both localStorage (instant) and Firestore (cloud)

### Firestore Data Model

```
users/{uid}/
  settings/profile
    calorieGoal: number
    updatedAt: Timestamp

  days/{YYYY-MM-DD}
    totalCalories: number
    updatedAt: Timestamp
    meals: [{
      id: string
      foodName: string
      calories: number
      quantity: number
      unit: 'g' | 'oz' | 'ml' | 'porción'
      timestamp: string (ISO)
      nutrition?: {
        calories, protein, carbs, fat, fiber, sugar, sodium, cholesterol
      }
    }]
```

---

## Testing

```bash
npm test                # Run all tests
npm run test:coverage   # With coverage report
npm run test:ci         # CI mode (fails if coverage < 90%)
```

Coverage threshold: **90%** on all metrics (branches, functions, lines, statements).

Test files live in `src/**/__tests__/`.

---

## Deployment

The app deploys automatically to Firebase Hosting when pushing to `main` (requires GitHub secrets — see `SECRETS.md`).

Manual deploy:
```bash
npm run build
firebase deploy --only hosting
```

---

## For AI Agents

Read `AGENTS.md` before making changes. Key rules:
1. Always update `CHANGELOG.md` before releasing
2. Firebase must be initialized lazily — never at module level
3. No trailing slash, no API routes
4. Tests must pass with ≥90% coverage before any deploy
