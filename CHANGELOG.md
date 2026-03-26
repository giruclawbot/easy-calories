# Changelog

All notable changes to Easy Calories are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.12.0] - 2026-03-26

### Fixed
- Barcode scanner: replaced broken USDA-text-search with Open Food Facts API cascade
  - Open Food Facts (world.openfoodfacts.org) queried first — 3M+ products, no API key, best US coverage
  - Falls back to USDA Branded Foods with strict `gtinUpc` match verification (prevents false positives)
  - `extractNutritionFromOFF()` maps OFF nutriments_100g format, converts sodium g→mg
  - BarcodeScanner shows "Buscando..." feedback while looking up product
- PWA cache: service worker completely rewritten
  - `scripts/inject-sw-version.mjs` injects unique cache name per build (pkg version + timestamp)
  - HTML/JSON → network-first, `_next/static` → cache-first (immutable), everything else → stale-while-revalidate
  - Old caches purged automatically on SW activate
  - `build` script runs inject-sw-version post-build
- EditMealModal: hardcoded Spanish strings replaced with `t()` calls
- Profile page: loading state was hardcoded "Cargando..." — now uses `t('common.loading')`

### Added
- EditMealModal: meal type selector — move a logged food to a different meal (Breakfast/Lunch/Dinner/Snack)
- i18n keys: `edit.title`, `edit.adjustQty`, `edit.moveTo`, `edit.save` in es.json + en.json
- Custom domain `ezcals.dev` — all metadata, OG tags, JSON-LD schema, README updated
- MIT License file (`LICENSE`) — © 2026 Jesus Enrique Dick Bustamante
- Copyright notice in app footer and repository metadata
- Sodium macro in dashboard macro summary (purple progress bar, 2300mg/day target)
- Firestore sync fix: `syncLocaleFromProfile()` in `I18nProvider` — Firestore is now source of truth for locale across devices; fixes language/unitSystem lost on new browsers

---

## [1.11.0] - 2026-03-26

### Added
- Smart portion units for food search: detect food category from name and show quick portion buttons (e.g., "1 huevo grande · 50g")
- `src/lib/portions.ts`: pure utility with `FOOD_CATEGORIES` database and `getPortionsForFood()` function
- 12 food categories covered: eggs, bread/tortillas, specific fruits (apple, banana, orange, strawberry, avocado), generic fruits, dairy, cheese, meat/poultry, grains/pasta, legumes, nuts/seeds, oils/fats, beverages, vegetables
- Bilingual labels (labelEs / labelEn) per portion unit, locale-aware display
- i18n keys: `food.quickPortions`, `food.customQty` in es.json and en.json
- 11 new unit tests in `src/lib/__tests__/portions.test.ts`

---

> 🤖 **FOR AI AGENTS — READ THIS BEFORE EVERY RELEASE:**
>
> Before bumping any version, you MUST:
> 1. Add an entry to this file under `## [Unreleased]` → move it to a new `## [x.y.z] - YYYY-MM-DD` section
> 2. Bump `version` in `package.json`
> 3. Run `npm run build` — must pass clean
> 4. Run `npm test -- --coverage` — coverage must be ≥ 90% on all files
> 5. Push to `develop`, merge to `main`, deploy to Firebase
> 6. Update the `[Unreleased]` section header to reflect the new baseline
>
> **Changelog entry format:**
> ```
> ## [1.x.x] - YYYY-MM-DD
> ### Added
> - Short description of new features
> ### Fixed
> - Short description of bug fixes
> ### Changed
> - Short description of changes
> ### Removed
> - Short description of removals
> ```

---

## [1.10.0] - 2026-03-26

### Added
- Data export feature: export daily and historical meals as CSV, Markdown, or PDF
- Dashboard export buttons for current day (CSV / MD / PDF)
- Profile page "Export history" section to download all logged data
- `getAllDaysData` Firestore helper to fetch all days for a user
- i18n keys for export UI (en + es)

---

## [1.9.0] - 2026-03-25
### Added
- Quick Add (frequent foods) section on Add Food page
- Tracks food usage in Firestore (`frequentFoods` subcollection)
- Shows most-used foods (≥2 uses) as ghost cards for one-tap adding
- Dismiss button to permanently hide a food from Quick Add

## [1.8.0] - 2026-03-25

### Added
- Meal type grouping: meals can now be tagged as `breakfast`, `lunch`, `dinner`, or `snack`
- Smart default meal type on Add Food page based on current time (5-10:59→breakfast, 11-14:59→lunch, 15-20:59→dinner, 21-4:59→snack)
- Visual meal type selector (4 buttons with emoji) above food search on Add page
- `MealList` grouped view: meals organized by type with emoji headers and calorie subtotals per group
- Toggle between "All" and "By meal" view modes in MealList
- Dashboard persists meal view preference in `localStorage` key `ec_meal_view`
- Backward compat: legacy meals without `mealType` fall into "Others" group; all-legacy data forces flat view
- i18n keys: `meals.*` (breakfast, lunch, dinner, snack, others, viewAll, viewGrouped, mealType, subtotal, noMeals) + `food.selectMealType`
- `mealType` field added to `Meal` interface (optional for full backward compat)

---

## [1.7.0] - 2026-03-25

### Added
- Imperial/metric unit system toggle (`unitSystem: 'metric' | 'imperial'`) in `UserProfile` (Firestore)
- `src/lib/units.ts`: `kgToLbs`, `lbsToKg`, `cmToFtIn`, `ftInToCm`, `formatWeight`, `formatHeight` helpers
- Profile page: unit system selector (Metric / Imperial) — weight and height auto-convert on toggle; stored always as kg/cm in Firestore
- CalorieCalculator: imperial mode shows weight in lbs, height as ft + in fields; internal calculations still use kg/cm via Mifflin-St Jeor
- Dashboard: target weight displayed using `formatWeight()` respecting user's unit system
- i18n: new keys — `calculator.unitAge/unitKg/unitCm/unitFt/unitIn/bmrDesc/tdeeDesc/recommendedDesc/formula/recalculate/weightLbs/heightFt/targetWeightLbs`
- i18n: new keys — `profile.goalType/unitSystem/metric/imperial/weightLbs/heightImperial`
- i18n: new keys — `common.today/required`
- Unit tests for all `units.ts` conversion functions (`src/lib/__tests__/units.test.ts`)

### Fixed
- CalorieCalculator: hardcoded strings replaced with i18n keys (`años`, `Metabolismo basal`, `Gasto total`, `Recomendada`, `Basado en Mifflin-St Jeor...`, `← Recalcular`, `Requerido`)
- Profile page: `Tipo` label now uses `t('profile.goalType')`; loading state uses `t('common.loading')`; PACE_LABELS/GOAL_TYPE_LABELS replaced with `t()` calls
- DayPicker: hardcoded "Hoy" / "Ir a hoy" replaced with `t('common.today')`
- CalorieCalculator `estimatedGoal` interpolation now shows correct unit in result (`{weight}` without hardcoded kg suffix)

---

## [1.6.0] - 2026-03-25

### Added
- Dashboard: goal type badge showing current objective (📉 Losing weight / ⚖️ Maintaining / 📈 Gaining weight), color-coded and translated ES/EN
- i18n: `dashboard.goalTypeLose`, `dashboard.goalTypeMaintain`, `dashboard.goalTypeGain` keys (ES + EN)
- i18n: `dashboard.caloriesThisWeek`, `chart.calories`, `chart.goalLine` keys for CalorieChart (ES + EN)
- i18n: `profile.back` key so Back button translates correctly in EN

### Fixed
- CalorieChart "Calorías esta semana" title was hardcoded in Spanish — now uses `useI18n()` with `date-fns` locale switching (day labels follow app language)
- Profile page "← Volver" button was hardcoded in Spanish — now uses `t('profile.back')`
- `favicon.ico` was showing Next.js default logo — replaced with app icon
- `package-lock.json` out of sync caused `npm ci` failures in CI — synced and added missing `@swc/helpers@0.5.19`
- Jest global mock for `useI18n` now uses real `es.json` translations — fixes 12 failing tests in v1.5.1
- `CalorieCalculator.test.tsx` goal label text updated to match full translations (`Perder peso`, `Ganar peso`)
- `I18nProvider.test.tsx` uses `jest.unmock` to bypass global mock for its own unit tests

### Changed
- Dashboard layout: "Your Goal" and "Macro Summary" sections moved below the meals list and weekly chart
- Firebase Hosting: `Cache-Control` headers added — HTML/JSON serve `no-cache`, JS/CSS serve `immutable` with content hash, `sw.js` serves `no-cache` for PWA freshness

---

## [1.5.0] - 2026-03-24

### Added
- User Profile page (/profile): personal data (sex, age, weight, height), language selector, goal details view
- Goal details stored in Firestore (goalType, targetWeightKg, ratePerWeek, weeksToGoal, BMR, TDEE)
- CalorieCalculator pre-fills with saved profile data when opened (initialValues prop)
- Goal details panel in dashboard (calorie goal, target weight, estimated timeline)
- Macro targets calculated from user profile (WHO/AMDR standards): protein based on body weight, carbs/fat % of TDEE, fiber 14g/1000kcal, sugar <10% energy
- Macro progress bars with current/target values per macro
- i18n foundation: I18nProvider, es.json + en.json, useI18n() hook, loadMessages(), t() helper
- Language selector in Profile page (ES/EN, persisted in Firestore + localStorage)
- NavBar link to Profile page

### Changed
- CalorieCalculator onGoalSet now receives full GoalDetails object as second argument
- Dashboard loads full UserProfile instead of simple calorieGoal
- Macro totals panel redesigned with progress bars and per-macro targets
- UserSettings replaced by UserProfile with backward compat aliases

---

## [1.4.0] - 2026-03-24

### Added
- Calorie goal stored in Firestore (offline-first with localStorage cache)
- CalorieCalculator: target weight field and weekly pace selector (slow/moderate/fast)
- Estimated weeks/months to reach target weight
- Health standards: WHO-based minimum floor (1200 kcal), safety warnings
- Debounce (400ms) on food search to reduce unnecessary API calls
- React.memo on CalorieChart to prevent unnecessary re-renders
- useMemo for last7Days array in dashboard
- Optimistic UI for meal removal
- README.md fully rewritten with architecture docs, data model, offline-first explanation

### Changed
- Goals: localStorage is now a cache layer, Firestore is the source of truth
- CalorieCalculator: deficit now uses rate-based approach (slow/moderate/fast)

---

## [Unreleased]

_(Add new changes here during development)_

---

## [1.3.1] - 2026-03-24

### Added
- CHANGELOG.md with full version history
- AGENTS.md — AI agent instructions and release checklist
- Unit tests with ≥ 90% coverage (Jest + Testing Library)
- CI test step in `.github/workflows/ci.yml`

---

## [1.3.0] - 2026-03-24

### Added
- Real app logo in NavBar (rounded) and login page
- Slogan "Track as easy as possible" on login screen
- Favicon (16/32/48px multi-size ICO) generated from logo
- PWA icons: 192px, 512px, 180px (apple-touch-icon)
- Open Graph image (1200×630) for link previews
- Full SEO metadata: title template, OpenGraph, Twitter Card, JSON-LD WebApplication structured data
- Keywords, author, robots meta tags

---

## [1.2.1] - 2026-03-24

### Fixed
- Quantity input bug: `z.coerce.number()` — HTML inputs return strings, Zod rejected them without coerce

### Added
- Daily macro totals panel in dashboard (Protein · Carbs · Fat · Fiber · Sugar)
- Edit meal modal: adjust quantity/unit of any registered meal, recalculates macros in real-time
- `updateMeal()` function in Firestore layer
- ✏️ edit button in MealList component

---

## [1.2.0] - 2026-03-24

### Added
- PWA: manual service worker (`public/sw.js`, cache-first strategy, offline support)
- Web App Manifest (`public/manifest.json`) with name, icons, theme color, standalone display
- `PWAInstaller` component: install banner with `beforeinstallprompt` event
- Full nutrition facts per food: protein, carbs, fat, fiber, sugar, sodium, cholesterol (8 fields)
- Macro preview in FoodSearch: shows scaled macros before adding a meal
- Macro display per meal in MealList (P/C/F inline badges)
- `NutritionFacts` interface in `src/lib/usda.ts`
- `extractNutrition()` helper using USDA nutrient IDs

### Fixed
- Dashboard 404 on Firebase Hosting: removed `trailingSlash: true`, added `cleanUrls: true` in `firebase.json`

---

## [1.1.1] - 2026-03-24

### Fixed
- Firebase initializing at module level during static prerender crash (`auth/invalid-api-key` in CI)
- Fix: lazy init with `typeof window !== 'undefined'` guard
- `getFirebaseAuth()` and `getFirebaseDb()` lazy factory functions
- Updated `AuthProvider`, `NavBar`, `login/page.tsx`, `firestore.ts` to use lazy getters

---

## [1.1.0] - 2026-03-24

### Added
- Calorie calculator modal (Mifflin-St Jeor + TDEE): sex, age, weight, height, activity level, goal (lose/maintain/gain)
- Custom calorie goal persisted in `localStorage`
- ⚙️ goal settings button in dashboard header
- App version badge (`v1.1.0`) in NavBar and dashboard footer
- GitFlow branch strategy: `develop` branch + `CONTRIBUTING.md`
- GitHub Actions CI/CD: `deploy.yml` (auto-deploy on `main`) + `ci.yml` (lint+typecheck+build on PRs)
- `SECRETS.md`: documents all required GitHub secrets for CI
- Security: `.env.local` removed from git index, `src/lib/env.ts` validates env vars at runtime
- Accessibility: `aria-label`, `role="dialog"`, `role="listbox"`, `nav aria-label`, `role="list/listitem"` across all components

---

## [1.0.0] - 2026-03-24

### Added
- Initial release
- Google Sign-In via Firebase Auth
- Firestore data layer: meals per day, total calories, weekly summary
- USDA FoodData Central search (900,000+ foods, client-side, CORS-compatible)
- Barcode scanner via Quagga2 (camera-based)
- Weekly calorie chart with Recharts (green/red bars vs goal)
- Day navigator with date-fns DayPicker
- Dark theme mobile-first UI with Tailwind CSS
- Firebase Hosting deployment
- Firestore security rules: users can only read/write their own data
- Static export (`output: 'export'`) for Firebase Hosting compatibility
- API routes removed (incompatible with static export); USDA called client-side directly
