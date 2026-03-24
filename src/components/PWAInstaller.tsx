'use client'
import { useEffect, useState } from 'react'

export function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    /* istanbul ignore next */
    if (!installPrompt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (installPrompt as any).prompt()
    setShowBanner(false)
    setInstallPrompt(null)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-gray-900 border border-emerald-800 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <span className="text-2xl">🥗</span>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Instalar Easy Calories</p>
          <p className="text-gray-400 text-xs">Accede rápido desde tu pantalla</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBanner(false)} className="text-gray-500 hover:text-white text-sm px-2" aria-label="Cerrar banner de instalación">✕</button>
          <button onClick={install} className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors">
            Instalar
          </button>
        </div>
      </div>
    </div>
  )
}
