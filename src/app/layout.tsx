import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { PWAInstaller } from '@/components/PWAInstaller'
import { I18nProvider } from '@/components/I18nProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://ezcals.dev'),
  title: {
    default: 'Easy Calories — Track as easy as possible',
    template: '%s | Easy Calories',
  },
  description: 'Track your daily calories as easy as possible. Search from 900,000+ foods, scan barcodes, and see your weekly progress. Free and works offline.',
  keywords: ['calorie tracker', 'calorie counter', 'food diary', 'nutrition tracker', 'macros', 'diet app', 'contador calorías', 'dieta', 'nutrición'],
  authors: [{ name: 'Jesus Enrique Dick Bustamante', url: 'https://ezcals.dev' }],
  creator: 'Jesus Enrique Dick Bustamante',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: { url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://ezcals.dev',
    siteName: 'Easy Calories',
    title: 'Easy Calories — Track as easy as possible',
    description: 'Track your daily calories as easy as possible. Search 900,000+ foods, scan barcodes, visualize weekly progress.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Easy Calories — Track as easy as possible',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Easy Calories — Track as easy as possible',
    description: 'Track your daily calories as easy as possible. Free calorie tracker with 900,000+ foods.',
    images: ['/og-image.jpg'],
    creator: '@giruclawbot',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Easy Calories',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Easy Calories',
              description: 'Track your daily calories as easy as possible.',
              url: 'https://ezcals.dev',
              applicationCategory: 'HealthApplication',
              operatingSystem: 'Any',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              author: { '@type': 'Person', name: 'Jesus Enrique Dick Bustamante' },
            }),
          }}
        />
        <AuthProvider><I18nProvider>{children}</I18nProvider></AuthProvider>
        <PWAInstaller />
      </body>
    </html>
  )
}
