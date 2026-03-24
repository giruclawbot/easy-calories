# Easy Calories — AI Agent Instructions

This file is for AI agents (Giru, Codex, Claude, etc.) working on this codebase.

## Stack
- Next.js 16 App Router + TypeScript + Tailwind CSS 4
- Firebase Auth (Google Sign-In) + Firestore
- USDA FoodData Central API (client-side, CORS-compatible)
- Static export (`output: 'export'`) → Firebase Hosting

## Before Every Release — MANDATORY CHECKLIST

```
[ ] 1. Update CHANGELOG.md — add entry under new version
[ ] 2. Bump version in package.json
[ ] 3. npm run build — must pass clean (0 errors)
[ ] 4. npm run test:coverage — coverage must be ≥ 90% on all metrics
[ ] 5. git push origin develop
[ ] 6. Merge develop → main (no-ff)
[ ] 7. git push origin main
[ ] 8. firebase deploy --only hosting
```

## Architecture

### Firebase Lazy Init
Firebase MUST be initialized lazily (only in browser). Never call `initializeApp()` at module level.
Use `getFirebaseAuth()` and `getFirebaseDb()` from `src/lib/firebase.ts`.
Reason: static prerender crashes with placeholder API keys during CI build.

### Static Export Constraints
- No server-side API routes (`/api/*`) — incompatible with `output: 'export'`
- All external API calls (USDA) must be client-side
- `trailingSlash` must be false — Firebase Hosting routing breaks with trailing slashes

### Key Files
- `src/lib/firebase.ts` — lazy Firebase singleton
- `src/lib/firestore.ts` — Firestore CRUD (getDayData, addMeal, removeMeal, updateMeal, getWeekData)
- `src/lib/usda.ts` — USDA FoodData API (searchFoods, getFoodByBarcode, NutritionFacts)
- `src/lib/goals.ts` — localStorage calorie goal persistence
- `src/lib/env.ts` — env var validation
- `src/components/AuthProvider.tsx` — Firebase Auth context
- `src/components/FoodSearch.tsx` — food search with macro preview
- `src/components/BarcodeScanner.tsx` — Quagga2 barcode scanner
- `src/components/MealList.tsx` — daily meal list with edit/remove
- `src/components/EditMealModal.tsx` — edit meal quantity/unit modal
- `src/components/CalorieCalculator.tsx` — Mifflin-St Jeor TDEE calculator
- `src/components/CalorieChart.tsx` — Recharts weekly bar chart
- `src/components/PWAInstaller.tsx` — PWA install prompt banner
- `src/components/NavBar.tsx` — top navigation
- `src/components/DayPicker.tsx` — day navigation

### Firestore Data Model
```
users/{uid}/days/{YYYY-MM-DD}
  totalCalories: number
  meals: Meal[]
  updatedAt: Timestamp
```

### Environment Variables
All prefixed `NEXT_PUBLIC_` (embedded at build time). See `SECRETS.md` for CI setup.

## Branch Strategy
- `main` → production (auto-deploys to Firebase)
- `develop` → integration
- `feature/*` → new features, branch from develop
- `fix/*` → bug fixes, branch from develop

## Testing
- Framework: Jest + Testing Library
- Run: `npm test`
- Coverage: `npm run test:coverage` (must be ≥ 90%)
- CI: `npm run test:ci`
- Test files: `src/**/__tests__/*.test.{ts,tsx}`

## Common Pitfalls
1. **Don't use `z.number()` for HTML inputs** — always `z.coerce.number()` (strings from DOM)
2. **Firebase lazy init** — never initialize at module level
3. **No trailing slash** — Firebase Hosting + Next.js static export
4. **USDA client-side only** — no API routes
5. **nutrition is optional** on Meal (older meals don't have it) — always null-check
