'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/AuthProvider'

const copy = {
  es: {
    badge: '🌱 100% Gratis · Sin anuncios',
    heroLine1: 'Cuenta tus calorías.',
    heroLine2: 'Sin complicaciones.',
    heroBadge: '🌱 100% Gratis · Sin anuncios',
    heroSub: 'Busca entre 900,000+ alimentos, escanea códigos de barras y visualiza tu progreso semanal. Gratis, sin anuncios, funciona sin conexión.',
    ctaPrimary: 'Empezar gratis →',
    ctaSecondary: 'Ver cómo funciona ↓',
    proofItems: ['✓ Gratis para siempre', '✓ Sin anuncios', '✓ Funciona offline', '✓ iOS & Android'],
    statsItems: [['900,000+', 'Alimentos en base de datos'], ['8', 'Macros trackeados por comida'], ['100%', 'Gratis, sin suscripción']],
    featuresTitle: 'Todo lo que necesitas',
    featuresSub: 'Una app completa para tu nutrición diaria',
    features: [
      { icon: '🔍', title: 'Búsqueda inteligente', desc: '900,000+ alimentos de USDA + comunidad. Porciones automáticas para huevos, carnes, frutas y más.' },
      { icon: '📷', title: 'Escáner de código de barras', desc: 'Escanea cualquier producto y obtén su información nutricional al instante.' },
      { icon: '🍲', title: 'Recetas', desc: 'Agrupa alimentos en recetas y agrégalas a tu log con el número de porciones que quieras.' },
      { icon: '👥', title: 'Alimentos comunidad', desc: 'Agrega tus propios alimentos. Vota por los de otros — los más confiables muestran el badge ✅ Verificado.' },
      { icon: '🧮', title: 'Calculadora de calorías', desc: 'Calcula tu TDEE con Mifflin-St Jeor. Ajusta por objetivo: perder, mantener o ganar peso.' },
      { icon: '💧', title: 'Hidratación y suplementos', desc: 'Trackea tu agua diaria y suplementos opcionales, todo en un mismo lugar.' },
    ],
    stepsTitle: 'Empieza en 3 pasos',
    stepsSub: 'Configurarlo toma menos de 2 minutos',
    steps: [
      { n: '1', title: 'Crea tu cuenta', desc: 'Inicia sesión con Google en segundos. Sin formularios, sin contraseñas.' },
      { n: '2', title: 'Configura tu meta', desc: 'Ingresa tus datos y la calculadora determina tus calorías y macros ideales.' },
      { n: '3', title: 'Registra y progresa', desc: 'Busca, escanea o elige de tus recetas. Tu progreso semanal siempre visible.' },
    ],
    spot1Title: 'Una base de datos que crece contigo',
    spot1Desc: 'Los usuarios agregan alimentos locales y los votan. Los más confiables reciben el badge ✅ Verificado para que sepas qué tan buena es la información.',
    spot1Food: 'Tacos de Canasta',
    spot1FoodSub: 'por usuario · 150g · 1 taco',
    spot2Title: 'Tus recetas favoritas, siempre listas',
    spot2Desc: 'Crea recetas con todos sus ingredientes y agrégalas a tu log de un toque. La app calcula automáticamente los macros por porción.',
    pwaTitle: 'Instálala como una app nativa',
    pwaSub: 'Sin pasar por la App Store. Sin límites.',
    pwaWhyTitle: 'Por qué instalarlo',
    pwaWhy: ['Funciona sin internet', 'Instalable en iOS y Android', 'Sin pasar por App Store', 'Se actualiza automáticamente'],
    pwaHowTitle: 'Cómo instalarlo',
    pwaHow: [['1', 'Abre ezcals.dev en Safari o Chrome'], ['2', "Toca 'Compartir' o el menú del navegador"], ['3', "'Agregar a pantalla de inicio'"]],
    ctaTitle: 'Empieza a trackear hoy.',
    ctaSub: 'Sin tarjeta de crédito. Sin anuncios. Sin complicaciones.',
    ctaFooter: 'Únete a usuarios que ya cuidan su alimentación con Easy Calories.',
    footerTagline: 'Hecho con ❤️ para quienes cuidan su salud',
    footerLogin: 'Iniciar sesión',
    navLogin: 'Iniciar sesión',
    loading: 'Cargando...',
    mockTime: '9:41', mockHeader: 'Hoy · Calorías', mockGoal: '/ 2,200',
    mockMacros: [['P', '98g', '#3b82f6'], ['C', '180g', '#f59e0b'], ['G', '42g', '#ef4444']],
    mockMeals: [['🌅 Desayuno', '420 kcal'], ['🌞 Almuerzo', '680 kcal'], ['🌙 Cena', '356 kcal']],
    mockWater: ['💧 Agua', '1.8 / 2.5 L'],
    mockRecipeName: '🍲 Caldo de Pollo Casero',
    mockIngredients: [['Pechuga de pollo', '200g', '220 kcal'], ['Zanahoria', '80g', '33 kcal'], ['Papa', '100g', '77 kcal'], ['Caldo de verduras', '400ml', '20 kcal']],
    mockNutrCols: [['Cal', '#f9fafb'], ['Prot', '#3b82f6'], ['Carbs', '#f59e0b'], ['Grasa', '#ef4444']],
    mockVerified: '✅ Verificado',
  },
  en: {
    badge: '🌱 100% Free · No ads',
    heroLine1: 'Count your calories.',
    heroLine2: 'Without the hassle.',
    heroBadge: '🌱 100% Free · No ads',
    heroSub: 'Search 900,000+ foods, scan barcodes, and visualize your weekly progress. Free, no ads, works offline.',
    ctaPrimary: 'Start for free →',
    ctaSecondary: 'See how it works ↓',
    proofItems: ['✓ Free forever', '✓ No ads', '✓ Works offline', '✓ iOS & Android'],
    statsItems: [['900,000+', 'Foods in database'], ['8', 'Macros tracked per meal'], ['100%', 'Free, no subscription']],
    featuresTitle: 'Everything you need',
    featuresSub: 'A complete app for your daily nutrition',
    features: [
      { icon: '🔍', title: 'Smart search', desc: '900,000+ foods from USDA + community. Auto-portions for eggs, meats, fruits and more.' },
      { icon: '📷', title: 'Barcode scanner', desc: 'Scan any product and get its nutritional info instantly.' },
      { icon: '🍲', title: 'Recipes', desc: 'Group foods into recipes and add them to your log with the number of servings you want.' },
      { icon: '👥', title: 'Community foods', desc: 'Add your own foods. Vote for others — the most trusted ones get the ✅ Verified badge.' },
      { icon: '🧮', title: 'Calorie calculator', desc: 'Calculate your TDEE with Mifflin-St Jeor. Adjust for your goal: lose, maintain, or gain weight.' },
      { icon: '💧', title: 'Hydration & supplements', desc: 'Track your daily water and optional supplements, all in one place.' },
    ],
    stepsTitle: 'Get started in 3 steps',
    stepsSub: 'Takes less than 2 minutes to set up',
    steps: [
      { n: '1', title: 'Create your account', desc: 'Sign in with Google in seconds. No forms, no passwords.' },
      { n: '2', title: 'Set your goal', desc: 'Enter your data and the calculator determines your ideal calories and macros.' },
      { n: '3', title: 'Log and progress', desc: 'Search, scan, or pick from your recipes. Your weekly progress always visible.' },
    ],
    spot1Title: 'A database that grows with you',
    spot1Desc: 'Users add local foods and vote on them. The most trusted ones get the ✅ Verified badge so you know how reliable the info is.',
    spot1Food: 'Corn Tortilla Tacos',
    spot1FoodSub: 'by user · 150g · 1 taco',
    spot2Title: 'Your favorite recipes, always ready',
    spot2Desc: 'Create recipes with all their ingredients and add them to your log with one tap. The app automatically calculates macros per serving.',
    pwaTitle: 'Install it like a native app',
    pwaSub: 'No App Store required. No limits.',
    pwaWhyTitle: 'Why install it',
    pwaWhy: ['Works without internet', 'Installable on iOS and Android', 'No App Store required', 'Updates automatically'],
    pwaHowTitle: 'How to install',
    pwaHow: [['1', 'Open ezcals.dev in Safari or Chrome'], ['2', "Tap 'Share' or the browser menu"], ['3', "'Add to Home Screen'"]],
    ctaTitle: 'Start tracking today.',
    ctaSub: 'No credit card. No ads. No complications.',
    ctaFooter: 'Join users already taking care of their nutrition with Easy Calories.',
    footerTagline: 'Made with ❤️ for those who care about their health',
    footerLogin: 'Sign in',
    navLogin: 'Sign in',
    loading: 'Loading...',
    mockTime: '9:41', mockHeader: 'Today · Calories', mockGoal: '/ 2,200',
    mockMacros: [['P', '98g', '#3b82f6'], ['C', '180g', '#f59e0b'], ['F', '42g', '#ef4444']],
    mockMeals: [['🌅 Breakfast', '420 kcal'], ['🌞 Lunch', '680 kcal'], ['🌙 Dinner', '356 kcal']],
    mockWater: ['💧 Water', '1.8 / 2.5 L'],
    mockRecipeName: '🍲 Homemade Chicken Soup',
    mockIngredients: [['Chicken breast', '200g', '220 kcal'], ['Carrot', '80g', '33 kcal'], ['Potato', '100g', '77 kcal'], ['Vegetable broth', '400ml', '20 kcal']],
    mockNutrCols: [['Cal', '#f9fafb'], ['Prot', '#3b82f6'], ['Carbs', '#f59e0b'], ['Fat', '#ef4444']],
    mockVerified: '✅ Verified',
  },
} as const

type Lang = keyof typeof copy

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [lang, setLang] = useState<Lang>('es')
  const featuresRef = useRef<HTMLElement>(null)

  // Detect browser language once on mount
  useEffect(() => {
    const browserLang = navigator.language || 'es'
    setLang(browserLang.startsWith('en') ? 'en' : 'es')
  }, [])

  const t = copy[lang]

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div style={{ width: 40, height: 40, border: '3px solid #1f2937', borderTop: '3px solid #34d399', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p className="text-gray-400 text-sm">{t.loading}</p>
        </div>
      </div>
    )
  }

  if (user) return null

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease both; }
        .animate-fade-in { animation: fadeIn 0.8s ease both; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .feature-card {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: #064e3b !important;
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .cta-btn {
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }
        .cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(16,185,129,0.35);
        }
        .cta-btn:active { transform: translateY(0); }
        .secondary-btn {
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .secondary-btn:hover {
          background-color: rgba(52,211,153,0.08);
          color: #34d399;
        }
      `}</style>

      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 h-16"
        style={{
          background: scrolled ? 'rgba(3,7,18,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid #1f2937' : '1px solid transparent',
          transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
        }}
      >
        <div className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="Easy Calories" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-white text-base tracking-tight">Easy Calories</span>
        </div>
        <Link href="/login" className="cta-btn px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#10b981', color: '#fff' }}>
          {t.navLogin}
        </Link>
      </nav>

      <main style={{ background: '#030712', color: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* HERO */}
        <section className="relative min-h-screen flex items-center overflow-hidden grid-bg" style={{ paddingTop: 80 }}>
          {/* Radial glow */}
          <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
            pointerEvents: 'none', animation: 'pulse-glow 4s ease-in-out infinite',
          }} />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-16 w-full grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0s' }}>
                <span style={{ display: 'inline-block', background: 'rgba(52,211,153,0.12)', color: '#34d399', borderRadius: 999, padding: '4px 14px', fontSize: 13, fontWeight: 600, border: '1px solid rgba(52,211,153,0.2)', marginBottom: 20 }}>
                  {t.badge}
                </span>
              </div>
              <h1 className="animate-fade-in-up font-black leading-none tracking-tight" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', animationDelay: '0.1s' }}>
                {t.heroLine1}
                <br />
                <span style={{ background: 'linear-gradient(90deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {t.heroLine2}
                </span>
              </h1>
              <p className="animate-fade-in-up mt-5 text-gray-400 leading-relaxed" style={{ fontSize: '1.05rem', maxWidth: 480, animationDelay: '0.2s' }}>
                {t.heroSub}
              </p>
              <div className="animate-fade-in-up flex flex-wrap gap-3 mt-8" style={{ animationDelay: '0.3s' }}>
                <Link href="/login" className="cta-btn px-7 py-3.5 rounded-xl font-bold text-base" style={{ background: '#10b981', color: '#fff' }}>
                  {t.ctaPrimary}
                </Link>
                <button onClick={scrollToFeatures} className="secondary-btn px-6 py-3.5 rounded-xl font-semibold text-base text-gray-300" style={{ border: '1px solid #1f2937', background: 'transparent', cursor: 'pointer' }}>
                  {t.ctaSecondary}
                </button>
              </div>
              {/* Social proof */}
              <div className="animate-fade-in-up flex flex-wrap gap-x-5 gap-y-2 mt-8 text-sm" style={{ color: '#6b7280', animationDelay: '0.4s' }}>
                {t.proofItems.map(item => (
                  <span key={item} style={{ color: '#34d399', fontWeight: 500 }}>{item}</span>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center lg:justify-end animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="animate-float" style={{ width: 220, height: 440, background: '#111827', border: '6px solid #374151', borderRadius: 36, boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Status bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', padding: '0 4px' }}>
                  <span>{t.mockTime}</span><span>●●●</span>
                </div>
                {/* Header */}
                <div style={{ background: '#1f2937', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{t.mockHeader}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>1,456</span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{t.mockGoal}</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ marginTop: 8, height: 6, background: '#374151', borderRadius: 3 }}>
                    <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 3 }} />
                  </div>
                </div>
                {/* Macro pills */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {t.mockMacros.map(([l, v, c]) => (
                    <div key={l as string} style={{ flex: 1, background: '#1f2937', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: c as string, fontWeight: 700 }}>{l}</div>
                      <div style={{ fontSize: 11, color: '#d1d5db', fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {/* Meal cards */}
                {t.mockMeals.map(([meal, kcal]) => (
                  <div key={meal as string} style={{ background: '#1f2937', borderRadius: 10, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#d1d5db' }}>{meal}</span>
                    <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>{kcal}</span>
                  </div>
                ))}
                {/* Water */}
                <div style={{ background: '#172554', borderRadius: 10, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#93c5fd' }}>{t.mockWater[0]}</span>
                  <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>{t.mockWater[1]}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <div style={{ background: '#111827', borderTop: '1px solid #1f2937', borderBottom: '1px solid #1f2937', padding: '32px 16px' }}>
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
            {t.statsItems.map(([stat, label]) => (
              <div key={label}>
                <div style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#34d399' }}>{stat}</div>
                <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)', color: '#6b7280', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES GRID */}
        <section ref={featuresRef} id="features" style={{ padding: 'clamp(60px, 8vw, 100px) 16px' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#f9fafb' }}>{t.featuresTitle}</h2>
              <p style={{ color: '#6b7280', marginTop: 12, fontSize: '1rem' }}>{t.featuresSub}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {t.features.map(({ icon, title, desc }) => (
                <div key={title} className="feature-card" style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
                    {icon}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#f9fafb', marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/login" className="cta-btn inline-block px-8 py-4 rounded-xl font-bold text-base" style={{ background: '#10b981', color: '#fff' }}>
                Empezar gratis →
              </Link>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: 'clamp(60px, 8vw, 100px) 16px', background: '#0d1117' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#f9fafb' }}>{t.stepsTitle}</h2>
              <p style={{ color: '#6b7280', marginTop: 12 }}>{t.stepsSub}</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8 relative">
              {/* Dashed connector (desktop) */}
              <div className="hidden sm:block" style={{ position: 'absolute', top: 28, left: '17%', right: '17%', height: 2, borderTop: '2px dashed #1f2937', zIndex: 0 }} />
              {t.steps.map(({ n, title, desc }) => (
                <div key={n} className="relative text-center" style={{ zIndex: 1 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', color: '#34d399', margin: '0 auto 16px' }}>
                    {n}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#f9fafb', marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURE SPOTLIGHTS */}
        <section style={{ padding: 'clamp(60px, 8vw, 100px) 16px' }}>
          <div className="max-w-5xl mx-auto flex flex-col gap-20">

            {/* Spotlight A — Community Foods */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 900, color: '#f9fafb', lineHeight: 1.2 }}>
                  {t.spot1Title}
                </h2>
                <p style={{ color: '#6b7280', marginTop: 16, lineHeight: 1.7, fontSize: '1rem' }}>
                  {t.spot1Desc}
                </p>
              </div>
              {/* Mock card */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.95rem' }}>{t.spot1Food}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{t.spot1FoodSub}</div>
                  </div>
                  <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', borderRadius: 8, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(52,211,153,0.3)' }}>
                    {t.mockVerified}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {[['Cal', '240', '#f9fafb'], ['Prot', '8g', '#3b82f6'], ['Carbs', '32g', '#f59e0b'], ['Grasa', '9g', '#ef4444']].map(([l, v, c]) => (
                    <div key={l} style={{ flex: 1, background: '#1f2937', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{l}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #1f2937', paddingTop: 12 }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', borderRadius: 8, padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'default' }}>
                    👍 24
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1f2937', border: '1px solid #374151', color: '#6b7280', borderRadius: 8, padding: '6px 14px', fontSize: '0.85rem', cursor: 'default' }}>
                    👎 2
                  </button>
                </div>
              </div>
            </div>

              {/* Spotlight B — Recipes */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Mock first on mobile, second on desktop */}
              <div className="order-2 lg:order-1" style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 16, padding: 20 }}>
                <div style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 14, fontSize: '0.95rem' }}>{t.mockRecipeName}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {t.mockIngredients.map(([name, portion, kcal]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#d1d5db' }}>{name}</span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{portion}</span>
                        <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>{kcal}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid #1f2937', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Total</div>
                    <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1.1rem' }}>350 kcal</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[['P', '36g', '#3b82f6'], ['C', '28g', '#f59e0b'], ['G', '6g', '#ef4444']].map(([l, v, c]) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: c as string, fontWeight: 700 }}>{l}</div>
                        <div style={{ fontSize: '0.85rem', color: '#d1d5db', fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 900, color: '#f9fafb', lineHeight: 1.2 }}>
                  {t.spot2Title}
                </h2>
                <p style={{ color: '#6b7280', marginTop: 16, lineHeight: 1.7, fontSize: '1rem' }}>
                  {t.spot2Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PWA SECTION */}
        <section style={{ padding: 'clamp(60px, 8vw, 100px) 16px', background: '#0d1117' }}>
          <div className="max-w-4xl mx-auto">
            <div style={{ background: 'linear-gradient(135deg, #111827 0%, rgba(16,185,129,0.08) 100%)', border: '1px solid #1f2937', borderRadius: 24, padding: 'clamp(28px, 5vw, 48px)' }}>
              <div className="text-center mb-10">
                <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 900, color: '#f9fafb' }}>
                  {t.pwaTitle}
                </h2>
                <p style={{ color: '#6b7280', marginTop: 10 }}>{t.pwaSub}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h3 style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 14, fontSize: '0.95rem' }}>{t.pwaWhyTitle}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {t.pwaWhy.map(b => (
                      <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#34d399', fontWeight: 700, fontSize: '1rem' }}>✓</span>
                        <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: '#f9fafb', marginBottom: 14, fontSize: '0.95rem' }}>{t.pwaHowTitle}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {t.pwaHow.map(([n, step]) => (
                      <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ minWidth: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
                        <span style={{ color: '#d1d5db', fontSize: '0.9rem', paddingTop: 2 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section style={{ padding: 'clamp(80px, 10vw, 120px) 16px', textAlign: 'center' }}>
          <div className="max-w-2xl mx-auto">
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#f9fafb', lineHeight: 1.1 }}>
              {t.ctaTitle}
            </h2>
            <p style={{ color: '#6b7280', marginTop: 16, fontSize: '1.05rem' }}>
              {t.ctaSub}
            </p>
            <Link href="/login" className="cta-btn inline-block mt-8 px-10 py-4 rounded-2xl font-bold text-lg" style={{ background: '#10b981', color: '#fff' }}>
              {t.ctaPrimary}
            </Link>
            <p style={{ color: '#4b5563', marginTop: 16, fontSize: '0.875rem' }}>
              {t.ctaFooter}
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid #1f2937', padding: '40px 16px', background: '#030712' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <Image src="/logo.jpg" alt="Easy Calories" width={28} height={28} className="rounded-md" />
                <div>
                  <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.9rem' }}>Easy Calories</div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>{t.footerTagline}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Link href="/login" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }} className="hover:text-emerald-400 transition-colors">
                  {t.footerLogin}
                </Link>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #111827', marginTop: 24, paddingTop: 24, textAlign: 'center', fontSize: '0.8rem', color: '#4b5563' }}>
              © 2026 Jesus Enrique Dick Bustamante · ezcals.dev
            </div>
          </div>
        </footer>

      </main>
    </>
  )
}
