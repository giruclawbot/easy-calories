'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { setStoredGoal } from '@/lib/goals'

const schema = z.object({
  sex: z.enum(['male', 'female']),
  age: z.coerce.number().min(10).max(120),
  weightKg: z.coerce.number().min(20).max(300),
  heightCm: z.coerce.number().min(100).max(250),
  activity: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
})

type FormData = z.output<typeof schema>

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario (sin ejercicio)',
  light: 'Ligero (1-3 días/semana)',
  moderate: 'Moderado (3-5 días/semana)',
  active: 'Activo (6-7 días/semana)',
  very_active: 'Muy activo (2x/día)',
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

interface Props {
  onGoalSet: (goal: number) => void
  onClose: () => void
}

export function CalorieCalculator({ onGoalSet, onClose }: Props) {
  const [result, setResult] = useState<{ bmr: number; tdee: number; recommended: number } | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { sex: 'male', activity: 'moderate', goal: 'maintain' },
  })

  function calculate(data: FormData) {
    let bmr: number
    if (data.sex === 'male') {
      bmr = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age + 5
    } else {
      bmr = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age - 161
    }
    const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[data.activity])
    let recommended = tdee
    if (data.goal === 'lose') recommended = tdee - 500
    if (data.goal === 'gain') recommended = tdee + 300
    recommended = Math.max(1200, recommended)
    setResult({ bmr: Math.round(bmr), tdee, recommended })
  }

  function applyGoal() {
    if (!result) return
    setStoredGoal(result.recommended)
    onGoalSet(result.recommended)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="calc-title">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800 my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 id="calc-title" className="font-bold text-white text-lg">🧮 Calculadora de calorías</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl" aria-label="Cerrar calculadora">×</button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit(calculate)} className="p-5 space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5" htmlFor="calc-sex">Sexo biológico</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map(s => (
                  <label key={s} className="flex-1 cursor-pointer">
                    <input type="radio" {...register('sex')} value={s} className="sr-only peer" />
                    <div className="text-center py-2 rounded-lg border border-gray-700 peer-checked:border-emerald-500 peer-checked:bg-emerald-900/30 text-sm text-gray-300 peer-checked:text-emerald-300 transition-colors">
                      {s === 'male' ? '♂ Hombre' : '♀ Mujer'}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'age', label: 'Edad', placeholder: '30', suffix: 'años', id: 'calc-age' },
                { name: 'weightKg', label: 'Peso', placeholder: '70', suffix: 'kg', id: 'calc-weight' },
                { name: 'heightCm', label: 'Altura', placeholder: '170', suffix: 'cm', id: 'calc-height' },
              ].map(f => (
                <div key={f.name}>
                  <label htmlFor={f.id} className="text-xs text-gray-400 block mb-1">{f.label}</label>
                  <div className="relative">
                    <input
                      id={f.id}
                      {...register(f.name as keyof FormData)}
                      type="number"
                      placeholder={f.placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pr-8"
                      aria-describedby={errors[f.name as keyof FormData] ? `${f.id}-error` : undefined}
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-gray-500">{f.suffix}</span>
                  </div>
                  {errors[f.name as keyof FormData] && (
                    <p id={`${f.id}-error`} className="text-red-400 text-xs mt-0.5" role="alert">Requerido</p>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="calc-activity" className="text-sm text-gray-400 block mb-1.5">Nivel de actividad</label>
              <select id="calc-activity" {...register('activity')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
                {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Objetivo</label>
              <div className="grid grid-cols-3 gap-2">
                {([['lose', '📉 Perder'], ['maintain', '⚖️ Mantener'], ['gain', '📈 Ganar']] as const).map(([v, l]) => (
                  <label key={v} className="cursor-pointer">
                    <input type="radio" {...register('goal')} value={v} className="sr-only peer" />
                    <div className="text-center py-2 rounded-lg border border-gray-700 peer-checked:border-emerald-500 peer-checked:bg-emerald-900/30 text-xs text-gray-300 peer-checked:text-emerald-300 transition-colors">
                      {l}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors">
              Calcular mi meta
            </button>
          </form>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'BMR', value: result.bmr, desc: 'Metabolismo basal', highlight: false },
                { label: 'TDEE', value: result.tdee, desc: 'Gasto total', highlight: false },
                { label: 'Meta', value: result.recommended, desc: 'Recomendada', highlight: true },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 border ${s.highlight ? 'border-emerald-600 bg-emerald-900/30' : 'border-gray-800 bg-gray-800'}`}>
                  <p className={`text-2xl font-bold ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">Basado en Mifflin-St Jeor · Ajustado por actividad y objetivo</p>
            <div className="flex gap-2">
              <button onClick={() => setResult(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm transition-colors">
                ← Recalcular
              </button>
              <button onClick={applyGoal} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Usar esta meta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
