'use client'
import { User, signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/components/I18nProvider'

export function NavBar({ user }: { user: User }) {
  const router = useRouter()
  const { t } = useI18n()

  async function handleSignOut() {
    const firebaseAuth = getFirebaseAuth()
    if (firebaseAuth) await signOut(firebaseAuth)
    router.push('/login')
  }

  return (
    <nav aria-label="Navegación principal" className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image src="/logo.jpg" alt="Easy Calories" width={36} height={36} className="rounded-full" />
          <span className="font-bold text-white hidden sm:block">Easy Calories</span>
        </Link>
        <div className="flex items-center gap-3">
          {user.photoURL && (
            <Image
              src={user.photoURL}
              alt={user.displayName || 'User'}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm text-gray-300">{user.displayName}</span>
            <span className="text-xs text-gray-600">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
          </div>
          <Link href="/profile" className="text-gray-400 hover:text-white transition-colors text-sm">
            👤 {t('nav.profile')}
          </Link>
          <Link href="/dashboard/community" className="text-gray-400 hover:text-white transition-colors text-sm">
            🍎 {t('communityList.navLabel')}
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('nav.signOut')}
          </button>
        </div>
      </div>
    </nav>
  )
}
