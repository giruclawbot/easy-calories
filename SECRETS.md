# GitHub Secrets Setup

Go to: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|-------------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `giru-easy-calories.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `giru-easy-calories` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `giru-easy-calories.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase console |
| `NEXT_PUBLIC_USDA_API_KEY` | Your USDA FoodData Central API key |
| `FIREBASE_SERVICE_ACCOUNT` | JSON service account from Firebase console (see below) |

## Getting FIREBASE_SERVICE_ACCOUNT

1. Go to [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com/project/giru-easy-calories/settings/serviceaccounts/adminsdk)
2. Click **Generate new private key**
3. Copy the entire JSON content
4. Paste as the `FIREBASE_SERVICE_ACCOUNT` secret value

## Note on NEXT_PUBLIC_ secrets

These are embedded in the client bundle at build time — that's intentional and standard practice for Firebase web apps. The Firebase API key is **not a secret** in the traditional sense; it identifies your project but Firebase Security Rules control data access.
