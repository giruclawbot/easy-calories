# 🥗 Easy Calories

Track your daily calorie intake easily with food search, barcode scanning, and weekly charts.

## Stack

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS** for styling
- **Firebase** — Auth (Google) + Firestore
- **USDA FoodData Central API** — food search + barcode lookup
- **@ericblade/quagga2** — client-side barcode scanner
- **React Hook Form + Zod** — form validation
- **Recharts** — weekly calorie bar chart
- **date-fns** — date utilities

## Features

- 🔐 Google Sign-In via Firebase Auth
- 🔍 Food search powered by USDA FoodData Central
- 📷 Barcode scanner (camera-based, works on mobile)
- 📊 Weekly calorie bar chart
- 📅 Day picker to view past meals
- ✅ Daily calorie goal tracking (default: 2000 kcal)

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/giruclawbot/easy-calories.git
cd easy-calories
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in method → **Google**
4. Enable **Firestore Database** → Start in production mode
5. Go to Project Settings → Your Apps → Add Web App
6. Copy the Firebase config values

### 3. Get USDA API Key

1. Go to [https://fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html)
2. Sign up for a free API key
3. Key is emailed instantly

### 4. Environment Variables

Create `.env.local` in the project root:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# USDA FoodData Central
USDA_API_KEY=your_usda_key
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

When prompted during `firebase init`:
- Public directory: `out` (if static) or use Firebase App Hosting for SSR
- For full Next.js SSR support, use [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

---

## Firestore Security Rules

Copy `firestore.rules` to your Firebase project:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## Data Structure

```
/users/{uid}/days/{YYYY-MM-DD}
  totalCalories: number
  meals: [
    {
      id: string
      foodName: string
      calories: number
      quantity: number
      unit: "g" | "oz" | "ml" | "porción"
      timestamp: string (ISO)
    }
  ]
  updatedAt: timestamp
```

---

## License

MIT
