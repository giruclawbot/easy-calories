# Changelog

All notable changes to Easy Calories are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

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
