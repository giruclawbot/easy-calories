import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getFirebaseApp(): FirebaseApp | null {
  // Only initialize on the client — avoids prerender crash with placeholder keys
  if (typeof window === 'undefined') return null
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp()
  return app ? getAuth(app) : null
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp()
  return app ? getFirestore(app) : null
}

// Convenience lazy singletons — safe to call anywhere client-side
export const auth = typeof window !== 'undefined' ? (() => {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  return getAuth(app)
})() : null

export const db = typeof window !== 'undefined' ? (() => {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  return getFirestore(app)
})() : null
