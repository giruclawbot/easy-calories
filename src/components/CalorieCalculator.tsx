'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { GoalDetails } from '@/lib/firestore'
import { useI18n } from '@/components/I18nProvider'
import type { UnitSystem } from '@/lib/units'
import { kgToLbs, lbsToKg, cmToFtIn, ftInToCm, formatWeight } from '@/lib/units'

const schema = z.object({
  sex: z.enum(['male', 'female']),
  age: z.coerce.number().min(10).max(120),
  weightKg: z.coerce.number().min(20).max(300),
  heightCm: z.coerce.number().min(100).max(250),
  activity: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
  targetWeightKg: z.preprocess(
    (val) => (val === '' || val == null ? undefined : Number(val)),
    z.number().min(20).max(300).optional()
  ),
  ratePerWeek: z.enum(['slow', 'moderate', 'fast']).optional(),
})

type FormData = z.output<typeof schema>

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const RATE_DEFICIT: Record<string, number> = {
  slow: 275,
  moderate: 550,
  fast: 825,
}

interface Props {
  onGoalSet: (calorieGoal: number, goalDetails?: GoalDetails) => void
  onClose: () => void
  initialValues?: {
    weightKg?: number
    heightCm?: number
    age?: number
    sex?: 'male' | 'female'
    unitSystem?: UnitSystem
  }
}

export function CalorieCalculator({ onGoalSet, onClose, initialValues }: Props) {
  const { t } = useI18n()
  const unitSystem: UnitSystem = initialValues?.unitSystem ?? 'metric'
  const isImperial = unitSystem === 'imperial'

  const [result, setResult] = useState<{
    bmr: number
    tdee: number
    recommended: number
    weeksToGoal: number | null
    targetWeightKg?: number
    goal: string
  } | null>(null)
  const [pendingGoalDetails, setPendingGoalDetails] = useState<GoalDetails | null>(null)

  // Compute display defaults
  const defaultWeightDisplay = initialValues?.weightKg
    ? isImperial ? kgToLbs(initialValues.weightKg) : initialValues.weightKg
    : undefined
  const defaultHeightDisplay = initialValues?.heightCm
    ? isImperial ? undefined : initialValues.heightCm
    : undefined
  const defaultHeightFt = initialValues?.heightCm ? cmToFtIn(initialValues.heightCm).ft : undefined
  const defaultHeightIn = initialValues?.heightCm ? cmToFtIn(initialValues.heightCm).inches : undefined

  const [heightFt, setHeightFt] = useState<number | ''>(defaultHeightFt ?? '')
  const [heightIn, setHeightIn] = useState<number | ''>(defaultHeightIn ?? '')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      sex: initialValues?.sex ?? 'male',
      age: initialValues?.age,
      weightKg: isImperial ? undefined : initialValues?.weightKg,
      heightCm: isImperial ? undefined : initialValues?.heightCm,
      activity: 'moderate',
      goal: 'maintain',
      ratePerWeek: 'moderate',
    },
  })

  // For imperial display, we keep a display weight state
  const [displayWeightLbs, setDisplayWeightLbs] = useState<number | ''>(defaultWeightDisplay ?? '')
  const [displayTargetLbs, setDisplayTargetLbs] = useState<number | ''>('')

  const goalValue = watch('goal')

  const ACTIVITY_LABELS: Record<string, string> = {
    sedentary: t('calculator.sedentary') || 'Sedentario (sin ejercicio)',
    light: t('calculator.light') || 'Ligero (1-3 días/semana)',
    moderate: t('calculator.moderate') || 'Moderado (3-5 días/semana)',
    active: t('calculator.active') || 'Activo (6-7 días/semana)',
    very_active: t('calculator.veryActive') || 'Muy activo (2x/día)',
  }

  const RATE_LABELS: Record<string, string> = {
    slow: t('calculator.slow'),
    moderate: t('calculator.moderate_rate') || t('calculator.moderate'),
    fast: t('calculator.fast'),
  }

  function handleWeightLbsChange(lbs: number | '') {
    setDisplayWeightLbs(lbs)
    if (lbs !== '') {
      setValue('weightKg', lbsToKg(lbs))
    }
  }

  function handleHeightFtChange(ft: number | '') {
    setHeightFt(ft)
    const inches = typeof heightIn === 'number' ? heightIn : 0
    if (ft !== '') {
      setValue('heightCm', ftInToCm(ft, inches))
    }
  }

  function handleHeightInChange(inches: number | '') {
    setHeightIn(inches)
    const ft = typeof heightFt === 'number' ? heightFt : 0
    if (inches !== '') {
      setValue('heightCm', ftInToCm(ft, inches))
    }
  }

  function handleTargetLbsChange(lbs: number | '') {
    setDisplayTargetLbs(lbs)
    if (lbs !== '') {
      setValue('targetWeightKg', lbsToKg(lbs))
    } else {
      setValue('targetWeightKg', undefined)
    }
  }

  function calculate(data: FormData) {
    let bmr: number
    if (data.sex === 'male') {
      bmr = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age + 5
    } else {
      bmr = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age - 161
    }
    const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[data.activity])

    let recommended = tdee
    let weeklyChange = 0
    let weeksToGoal: number | null = null
    const rate = data.ratePerWeek || 'moderate'

    if (data.goal === 'lose') {
      const deficit = RATE_DEFICIT[rate]
      recommended = Math.max(1200, tdee - deficit)
      weeklyChange = -deficit / 7700
      if (data.targetWeightKg && data.targetWeightKg < data.weightKg) {
        const kgToLose = data.weightKg - data.targetWeightKg
        weeksToGoal = Math.ceil(kgToLose / Math.abs(weeklyChange * 7))
      }
    } else if (data.goal === 'gain') {
      const surplus = RATE_DEFICIT[rate]
      recommended = tdee + surplus
      weeklyChange = surplus / 7700
      if (data.targetWeightKg && data.targetWeightKg > data.weightKg) {
        const kgToGain = data.targetWeightKg - data.weightKg
        weeksToGoal = Math.ceil(kgToGain / (weeklyChange * 7))
      }
    }

    recommended = Math.round(recommended)

    const goalDetails: GoalDetails = {
      calorieGoal: recommended,
      goalType: data.goal,
      targetWeightKg: data.targetWeightKg,
      ratePerWeek: data.ratePerWeek as GoalDetails['ratePerWeek'],
      weeksToGoal: weeksToGoal ?? undefined,
      bmr: Math.round(bmr),
      tdee,
    }

    setResult({
      bmr: Math.round(bmr),
      tdee,
      recommended,
      weeksToGoal,
      targetWeightKg: data.targetWeightKg,
      goal: data.goal,
    })
    setPendingGoalDetails(goalDetails)
  }

  function applyGoal() {
    if (!result) return
    onGoalSet(result.recommended, pendingGoalDetails ?? undefined)
    onClose()
  }

  const weightUnit = isImperial ? t('calculator.unitKg').replace('kg', 'lbs') || 'lbs' : t('calculator.unitKg')
  const ageUnit = t('calculator.unitAge')

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="calc-title">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800 my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 id="calc-title" className="font-bold text-white text-lg">{t('calculator.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl" aria-label="Cerrar calculadora">×</button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit(calculate)} className="p-5 space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5" htmlFor="calc-sex">{t('calculator.sex')}</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map(s => (
                  <label key={s} className="flex-1 cursor-pointer">
                    <input type="radio" {...register('sex')} value={s} className="sr-only peer" />
                    <div className="text-center py-2 rounded-lg border border-gray-700 peer-checked:border-emerald-500 peer-checked:bg-emerald-900/30 text-sm text-gray-300 peer-checked:text-emerald-300 transition-colors">
                      {s === 'male' ? `♂ ${t('calculator.male')}` : `♀ ${t('calculator.female')}`}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <label htmlFor="calc-age" className="text-xs text-gray-400 block mb-1">{t('calculator.age')}</label>
              <div className="relative">
                <input
                  id="calc-age"
                  {...register('age')}
                  type="number"
                  placeholder="30"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-10"
                  aria-describedby={errors.age ? 'calc-age-error' : undefined}
                />
                <span className="absolute right-2 top-2.5 text-xs text-gray-500">{ageUnit}</span>
              </div>
              {errors.age && <p id="calc-age-error" className="text-red-400 text-xs mt-0.5" role="alert">{t('common.required')}</p>}
            </div>

            {/* Weight */}
            {isImperial ? (
              <div>
                <label htmlFor="calc-weight" className="text-xs text-gray-400 block mb-1">{t('calculator.weightLbs')}</label>
                <div className="relative">
                  <input
                    id="calc-weight"
                    type="number"
                    value={displayWeightLbs}
                    onChange={e => handleWeightLbsChange(e.target.value ? Number(e.target.value) : '')}
                    placeholder="154"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-10"
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-gray-500">lbs</span>
                </div>
                {/* hidden field for form */}
                <input type="hidden" {...register('weightKg')} />
                {errors.weightKg && <p className="text-red-400 text-xs mt-0.5" role="alert">{t('common.required')}</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="calc-weight" className="text-xs text-gray-400 block mb-1">{t('calculator.weight').split(' ')[0]}</label>
                <div className="relative">
                  <input
                    id="calc-weight"
                    {...register('weightKg')}
                    type="number"
                    placeholder="70"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-8"
                    aria-describedby={errors.weightKg ? 'calc-weight-error' : undefined}
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-gray-500">{t('calculator.unitKg')}</span>
                </div>
                {errors.weightKg && <p id="calc-weight-error" className="text-red-400 text-xs mt-0.5" role="alert">{t('common.required')}</p>}
              </div>
            )}

            {/* Height */}
            {isImperial ? (
              <div>
                <label className="text-xs text-gray-400 block mb-1">{t('calculator.heightFt')}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={heightFt}
                      onChange={e => handleHeightFtChange(e.target.value ? Number(e.target.value) : '')}
                      placeholder="5"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-8"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-gray-500">{t('calculator.unitFt')}</span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={heightIn}
                      onChange={e => handleHeightInChange(e.target.value ? Number(e.target.value) : '')}
                      placeholder="7"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-8"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-gray-500">{t('calculator.unitIn')}</span>
                  </div>
                </div>
                <input type="hidden" {...register('heightCm')} />
                {errors.heightCm && <p className="text-red-400 text-xs mt-0.5" role="alert">{t('common.required')}</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="calc-height" className="text-xs text-gray-400 block mb-1">{t('calculator.height').split(' ')[0]}</label>
                <div className="relative">
                  <input
                    id="calc-height"
                    {...register('heightCm')}
                    type="number"
                    placeholder="170"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-8"
                    aria-describedby={errors.heightCm ? 'calc-height-error' : undefined}
                  />
                  <span className="absolute right-2 top-2.5 text-xs text-gray-500">{t('calculator.unitCm')}</span>
                </div>
                {errors.heightCm && <p id="calc-height-error" className="text-red-400 text-xs mt-0.5" role="alert">{t('common.required')}</p>}
              </div>
            )}

            <div>
              <label htmlFor="calc-activity" className="text-sm text-gray-400 block mb-1.5">{t('calculator.activity')}</label>
              <select id="calc-activity" {...register('activity')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
                {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1.5">{t('calculator.goal')}</label>
              <div className="grid grid-cols-3 gap-2">
                {([['lose', `📉 ${t('calculator.lose')}`], ['maintain', `⚖️ ${t('calculator.maintain')}`], ['gain', `📈 ${t('calculator.gain')}`]] as const).map(([v, l]) => (
                  <label key={v} className="cursor-pointer">
                    <input type="radio" {...register('goal')} value={v} className="sr-only peer" />
                    <div className="text-center py-2 rounded-lg border border-gray-700 peer-checked:border-emerald-500 peer-checked:bg-emerald-900/30 text-xs text-gray-300 peer-checked:text-emerald-300 transition-colors">
                      {l}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {(goalValue === 'lose' || goalValue === 'gain') && (
              <>
                <div>
                  <label htmlFor="calc-target" className="text-sm text-gray-400 block mb-1.5">
                    {isImperial ? t('calculator.targetWeightLbs') : t('calculator.targetWeight')}
                  </label>
                  {isImperial ? (
                    <div className="relative">
                      <input
                        id="calc-target"
                        type="number"
                        value={displayTargetLbs}
                        onChange={e => handleTargetLbsChange(e.target.value ? Number(e.target.value) : '')}
                        placeholder={goalValue === 'lose' ? 'e.g. 143' : 'e.g. 176'}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-10"
                      />
                      <span className="absolute right-2 top-2.5 text-xs text-gray-500">lbs</span>
                      <input type="hidden" {...register('targetWeightKg')} />
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id="calc-target"
                        {...register('targetWeightKg')}
                        type="number"
                        placeholder={goalValue === 'lose' ? 'ej: 65' : 'ej: 80'}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-10"
                      />
                      <span className="absolute right-2 top-2.5 text-xs text-gray-500">{t('calculator.unitKg')}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1.5">{t('calculator.weeklyPace')}</label>
                  <div className="space-y-2">
                    {Object.entries(RATE_LABELS).map(([v, l]) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" {...register('ratePerWeek')} value={v} className="sr-only peer" />
                        <div className="w-4 h-4 rounded-full border-2 border-gray-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-gray-300 peer-checked:text-emerald-300">{l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors">
              {t('calculator.calculate')}
            </button>
          </form>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: t('calculator.bmr'), value: result.bmr, desc: t('calculator.bmrDesc'), highlight: false },
                { label: t('calculator.tdee'), value: result.tdee, desc: t('calculator.tdeeDesc'), highlight: false },
                { label: t('calculator.recommended'), value: result.recommended, desc: t('calculator.recommendedDesc'), highlight: true },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 border ${s.highlight ? 'border-emerald-600 bg-emerald-900/30' : 'border-gray-800 bg-gray-800'}`}>
                  <p className={`text-2xl font-bold ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">{t('calculator.formula')}</p>

            {result.recommended < 1500 && (
              <p className="text-xs text-yellow-400 text-center">{t('calculator.lowGoalWarning')}</p>
            )}

            {result.weeksToGoal && result.targetWeightKg && (
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <p className="text-white text-sm">
                  🎯 {t('calculator.estimatedGoal', { weight: formatWeight(result.targetWeightKg, unitSystem) })}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {result.weeksToGoal < 4
                    ? `${result.weeksToGoal} ${t('dashboard.weeks')}`
                    : `${Math.round(result.weeksToGoal / 4.3)} ${t('dashboard.months')}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('calculator.basedOnPace')}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setResult(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm transition-colors">
                {t('calculator.recalculate')}
              </button>
              <button onClick={applyGoal} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {t('calculator.useGoal')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
