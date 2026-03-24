export function assertEnv() {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_USDA_API_KEY',
  ]
  const missing = required.filter(k => !process.env[k] || process.env[k] === 'REPLACE_ME')
  if (missing.length > 0) {
    console.warn(`[Easy Calories] Missing env vars: ${missing.join(', ')}`)
  }
}
