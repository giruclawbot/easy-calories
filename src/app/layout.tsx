import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { PWAInstaller } from '@/components/PWAInstaller'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Easy Calories — Registro de calorías fácil',
  description: 'Registra tus calorías diarias fácilmente. Busca alimentos, escanea códigos de barras y visualiza tu progreso.',
  keywords: 'calorías, dieta, nutrición, contador calorías, salud',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Easy Calories',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <PWAInstaller />
      </body>
    </html>
  )
}
