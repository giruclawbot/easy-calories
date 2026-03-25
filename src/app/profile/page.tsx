'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { getUserProfile, saveUserProfile, UserProfile, GoalDetails } from '@/lib/firestore'
import { useI18n } from '@/components/I18nProvider'
import { locales } from '@/lib/i18n'
import { CalorieCalculator } from '@/components/CalorieCalculator'

const LOCALE_LABELS: Record<string, string> = { es: 'Español', en: 'English' }

const PACE_LABELS: Record<string, Record<string, string>> = {
  es: { slow: 'Lento', moderate: 'Moderado', fast: 'Rápido' },
  en: { slow: 'Slow', moderate: 'Moderate', fast: 'Fast' },
}

const GOAL_TYPE_LABELS: Record<string, Record<string, string>> = {
  es: { lose: 'Perder peso', maintain: 'Mantener', gain: 'Ganar peso' },
  en: { lose: 'Lose weight', maintain: 'Maintain', gain: 'Gain weight' },
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { t, locale, setLocale } = useI18n()
  const [profile, setProfile] = useState<UserProfile>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    getUserProfile(user.uid).then(p => {
      if (p) setProfile(p)
      setLoading(false)
    })
  }, [user, router])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await saveUserProfile(user.uid, profile)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleGoalSet(calorieGoal: number, goalDetails?: GoalDetails) {
    if (!user) return
    const mergedGoalDetails: GoalDetails = goalDetails
      ? { ...goalDetails, calorieGoal }
      : { calorieGoal, goalType: 'maintain' }
    const updated = { ...profile, calorieGoal, goalDetails: mergedGoalDetails }
    setProfile(updated)
    await saveUserProfile(user.uid, updated)
    setShowCalculator(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Cargando...</div>

  const gd = profile.goalDetails
  const paceLabel = gd?.ratePerWeek ? (PACE_LABELS[locale]?.[gd.ratePerWeek] ?? gd.ratePerWeek) : null
  const goalTypeLabel = gd?.goalType ? (GOAL_TYPE_LABELS[locale]?.[gd.goalType] ?? gd.goalType) : null

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm">{t('profile.back')}</button>
          <h1 className="text-xl font-bold">{t('profile.title')}</h1>
        </div>

        {/* Personal data */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{t('profile.personalData')}</h2>

          {/* Sex */}
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">{t('profile.sex')}</label>
            <div className="flex gap-3">
              {(['male', 'female'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setProfile(p => ({ ...p, sex: s }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${profile.sex === s ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  {t(`profile.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Age / Weight / Height */}
          {([
            { key: 'age', label: t('profile.age'), unit: '' },
            { key: 'weightKg', label: t('profile.weight'), unit: 'kg' },
            { key: 'heightCm', label: t('profile.height'), unit: 'cm' },
          ] as const).map(({ key, label, unit }) => (
            <div key={key}>
              <label className="text-sm text-gray-400 block mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type="number"
                  value={(profile[key as keyof UserProfile] as number | undefined) ?? ''}
                  onChange={e => setProfile(p => ({ ...p, [key]: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-12"
                />
                {unit && <span className="absolute right-3 top-2.5 text-xs text-gray-500">{unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Language */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{t('profile.language')}</h2>
          <div className="flex gap-3">
            {locales.map(l => (
              <button
                key={l}
                onClick={() => { setLocale(l); setProfile(p => ({ ...p, locale: l })) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${locale === l ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Goal details */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{t('profile.myGoal')}</h2>
            <button onClick={() => setShowCalculator(true)} className="text-xs text-emerald-400 hover:text-emerald-300">
              {t('profile.editGoal')}
            </button>
          </div>

          {gd ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-500">{t('profile.calorieGoal')}</p>
                <p className="text-lg font-bold text-emerald-400">{gd.calorieGoal} kcal</p>
              </div>
              {gd.goalType && (
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="text-sm font-semibold text-white">{goalTypeLabel}</p>
                </div>
              )}
              {gd.targetWeightKg && (
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{t('profile.targetWeight')}</p>
                  <p className="text-lg font-bold text-white">{gd.targetWeightKg} kg</p>
                </div>
              )}
              {paceLabel && (
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{t('profile.weeklyPace')}</p>
                  <p className="text-sm font-semibold text-white">{paceLabel}</p>
                </div>
              )}
              {gd.weeksToGoal && (
                <div className="bg-gray-800 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-gray-500">{t('profile.timeline')}</p>
                  <p className="text-sm font-semibold text-white">
                    {gd.weeksToGoal < 4
                      ? `~${gd.weeksToGoal} ${t('dashboard.weeks')}`
                      : `~${Math.round(gd.weeksToGoal / 4.3)} ${t('dashboard.months')}`}
                  </p>
                </div>
              )}
              {gd.bmr && (
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500">BMR</p>
                  <p className="text-sm font-semibold text-gray-300">{gd.bmr} kcal</p>
                </div>
              )}
              {gd.tdee && (
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500">TDEE</p>
                  <p className="text-sm font-semibold text-gray-300">{gd.tdee} kcal</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-3">{t('profile.noGoal')}</p>
              <button onClick={() => setShowCalculator(true)} className="text-emerald-400 text-sm hover:text-emerald-300">
                {t('profile.configureGoal')}
              </button>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saved ? `✓ ${t('profile.saved')}` : saving ? '...' : t('profile.save')}
        </button>
      </div>

      {showCalculator && (
        <CalorieCalculator
          onGoalSet={handleGoalSet}
          onClose={() => setShowCalculator(false)}
          initialValues={{
            weightKg: profile.weightKg,
            heightCm: profile.heightCm,
            age: profile.age,
            sex: profile.sex,
          }}
        />
      )}
    </div>
  )
}
