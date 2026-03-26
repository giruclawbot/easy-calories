'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { getUserProfile, saveUserProfile, getAllDaysData, UserProfile, GoalDetails } from '@/lib/firestore'
import { useI18n } from '@/components/I18nProvider'
import { locales } from '@/lib/i18n'
import { CalorieCalculator } from '@/components/CalorieCalculator'
import type { UnitSystem } from '@/lib/units'
import { kgToLbs, lbsToKg, cmToFtIn, ftInToCm, formatWeight } from '@/lib/units'
import { exportHistoricalCSV, exportHistoricalMarkdown, exportHistoricalPDF, HistoricalExportData } from '@/lib/export'

const LOCALE_LABELS: Record<string, string> = { es: 'Español', en: 'English' }

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { t, locale, setLocale, syncLocaleFromProfile } = useI18n()
  const [profile, setProfile] = useState<UserProfile>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exportLoading, setExportLoading] = useState<'csv' | 'markdown' | 'pdf' | null>(null)
  const [showCalculator, setShowCalculator] = useState(false)

  // Display states for imperial
  const [displayWeightLbs, setDisplayWeightLbs] = useState<number | ''>('')
  const [displayHeightFt, setDisplayHeightFt] = useState<number | ''>('')
  const [displayHeightIn, setDisplayHeightIn] = useState<number | ''>('')
  const [displayTargetLbs, setDisplayTargetLbs] = useState<number | ''>('')

  const unitSystem: UnitSystem = profile.unitSystem ?? 'metric'
  const isImperial = unitSystem === 'imperial'

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    getUserProfile(user.uid).then(p => {
      if (p) {
        setProfile(p)
        syncDisplayValues(p, p.unitSystem ?? 'metric')
        // Sync locale from Firestore — ensures correct language on new browsers
        syncLocaleFromProfile(p.locale)
      }
      setLoading(false)
    })
  }, [user, router])

  function syncDisplayValues(p: UserProfile, system: UnitSystem) {
    if (system === 'imperial') {
      if (p.weightKg) setDisplayWeightLbs(kgToLbs(p.weightKg))
      if (p.heightCm) {
        const { ft, inches } = cmToFtIn(p.heightCm)
        setDisplayHeightFt(ft)
        setDisplayHeightIn(inches)
      }
      if (p.goalDetails?.targetWeightKg) setDisplayTargetLbs(kgToLbs(p.goalDetails.targetWeightKg))
    }
  }

  function handleUnitSystemChange(system: UnitSystem) {
    setProfile(p => ({ ...p, unitSystem: system }))
    syncDisplayValues(profile, system)
  }

  function handleWeightChange(val: number | '') {
    if (isImperial) {
      setDisplayWeightLbs(val)
      setProfile(p => ({ ...p, weightKg: val !== '' ? lbsToKg(val) : undefined }))
    } else {
      setProfile(p => ({ ...p, weightKg: val !== '' ? val : undefined }))
    }
  }

  function handleHeightFtChange(ft: number | '') {
    setDisplayHeightFt(ft)
    const inches = typeof displayHeightIn === 'number' ? displayHeightIn : 0
    if (ft !== '') {
      setProfile(p => ({ ...p, heightCm: ftInToCm(ft, inches) }))
    }
  }

  function handleHeightInChange(inches: number | '') {
    setDisplayHeightIn(inches)
    const ft = typeof displayHeightFt === 'number' ? displayHeightFt : 0
    if (inches !== '') {
      setProfile(p => ({ ...p, heightCm: ftInToCm(ft, inches) }))
    }
  }

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
    if (isImperial && mergedGoalDetails.targetWeightKg) {
      setDisplayTargetLbs(kgToLbs(mergedGoalDetails.targetWeightKg))
    }
    await saveUserProfile(user.uid, updated)
    setShowCalculator(false)
  }

  async function handleExportHistory(fmt: 'csv' | 'markdown' | 'pdf') {
    if (!user) return
    setExportLoading(fmt)
    try {
      const allDays = await getAllDaysData(user.uid)
      const days = Object.entries(allDays).map(([date, dayData]) => ({
        date,
        meals: dayData.meals ?? [],
        totalCalories: dayData.totalCalories ?? 0,
      }))
      const data: HistoricalExportData = { days, profile }
      if (fmt === 'csv') exportHistoricalCSV(data, locale)
      else if (fmt === 'markdown') exportHistoricalMarkdown(data, locale)
      else exportHistoricalPDF(data, locale)
    } finally {
      setExportLoading(null)
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">{t('common.loading')}</div>

  const gd = profile.goalDetails
  const goalTypeLabel = gd?.goalType ? t(`calculator.${gd.goalType}`) : null
  const paceLabel = gd?.ratePerWeek ? t(`calculator.${gd.ratePerWeek === 'moderate' ? 'moderate_rate' : gd.ratePerWeek}`) : null

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

          {/* Age */}
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">{t('profile.age')}</label>
            <input
              type="number"
              value={profile.age ?? ''}
              onChange={e => setProfile(p => ({ ...p, age: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">
              {isImperial ? t('profile.weightLbs') : t('profile.weight')}
            </label>
            <div className="relative">
              {isImperial ? (
                <input
                  type="number"
                  value={displayWeightLbs}
                  onChange={e => handleWeightChange(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-12"
                />
              ) : (
                <input
                  type="number"
                  value={profile.weightKg ?? ''}
                  onChange={e => handleWeightChange(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-12"
                />
              )}
              <span className="absolute right-3 top-2.5 text-xs text-gray-500">{isImperial ? 'lbs' : 'kg'}</span>
            </div>
          </div>

          {/* Height */}
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">
              {isImperial ? t('profile.heightImperial') : t('profile.height')}
            </label>
            {isImperial ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={displayHeightFt}
                    onChange={e => handleHeightFtChange(e.target.value ? Number(e.target.value) : '')}
                    placeholder="5"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-8"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-gray-500">ft</span>
                </div>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={displayHeightIn}
                    onChange={e => handleHeightInChange(e.target.value ? Number(e.target.value) : '')}
                    placeholder="7"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-8"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-gray-500">in</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  value={profile.heightCm ?? ''}
                  onChange={e => setProfile(p => ({ ...p, heightCm: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-12"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500">cm</span>
              </div>
            )}
          </div>
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

        {/* Unit system */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{t('profile.unitSystem')}</h2>
          <div className="flex gap-3">
            {(['metric', 'imperial'] as const).map(sys => (
              <button
                key={sys}
                onClick={() => handleUnitSystemChange(sys)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${unitSystem === sys ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {t(`profile.${sys}`)}
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
                  <p className="text-xs text-gray-500">{t('profile.goalType')}</p>
                  <p className="text-sm font-semibold text-white">{goalTypeLabel}</p>
                </div>
              )}
              {gd.targetWeightKg && (
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{t('profile.targetWeight')}</p>
                  <p className="text-lg font-bold text-white">{formatWeight(gd.targetWeightKg, unitSystem)}</p>
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

        {/* Export history */}
        <div className="bg-gray-900 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{t('export.history')}</h2>
          <p className="text-xs text-gray-500">{t('export.historyDesc')}</p>
          <div className="flex gap-2">
            {(['csv', 'markdown', 'pdf'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => handleExportHistory(fmt)}
                disabled={exportLoading !== null}
                className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-xs font-medium transition-colors"
              >
                {exportLoading === fmt
                  ? t('export.loading')
                  : fmt === 'csv' ? `📄 ${t('export.csv')}`
                  : fmt === 'markdown' ? `📝 ${t('export.markdown')}`
                  : `🖨️ ${t('export.pdf')}`}
              </button>
            ))}
          </div>
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
            unitSystem: profile.unitSystem,
          }}
        />
      )}
    </div>
  )
}
