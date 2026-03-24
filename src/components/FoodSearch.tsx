'use client'
import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { searchFoods, FoodItem, NutritionFacts } from '@/lib/usda'

const schema = z.object({
  query: z.string().min(2, 'Escribe al menos 2 caracteres'),
  quantity: z.number().min(1).max(5000),
  unit: z.enum(['g', 'oz', 'ml', 'porción']),
})

type FormData = z.infer<typeof schema>

interface Props {
  onAdd: (meal: { foodName: string; calories: number; quantity: number; unit: string; nutrition: NutritionFacts }) => void
}

export function FoodSearch({ onAdd }: Props) {
  const [results, setResults] = useState<FoodItem[]>([])
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [searching, setSearching] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 100, unit: 'g' },
  })

  const quantity = watch('quantity') || 100

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) return
    setSearching(true)
    const foods = await searchFoods(q)
    setResults(foods)
    setSearching(false)
  }, [])

  function onSubmit(data: FormData) {
    if (!selected) return
    const ratio = data.quantity / 100
    onAdd({
      foodName: selected.description,
      calories: Math.round(selected.nutrition.calories * ratio),
      quantity: data.quantity,
      unit: data.unit,
      nutrition: {
        calories: Math.round(selected.nutrition.calories * ratio * 10) / 10,
        protein: Math.round(selected.nutrition.protein * ratio * 10) / 10,
        carbs: Math.round(selected.nutrition.carbs * ratio * 10) / 10,
        fat: Math.round(selected.nutrition.fat * ratio * 10) / 10,
        fiber: Math.round(selected.nutrition.fiber * ratio * 10) / 10,
        sugar: Math.round(selected.nutrition.sugar * ratio * 10) / 10,
        sodium: Math.round(selected.nutrition.sodium * ratio * 10) / 10,
        cholesterol: Math.round(selected.nutrition.cholesterol * ratio * 10) / 10,
      },
    })
    setSelected(null)
    setResults([])
    setValue('query', '')
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="relative">
          <input
            {...register('query')}
            placeholder="Buscar alimento... ej: manzana, pollo, arroz"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 pr-10"
            onChange={e => {
              register('query').onChange(e)
              doSearch(e.target.value)
              setSelected(null)
            }}
          />
          {searching && (
            <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        {errors.query && <p className="text-red-400 text-xs mt-1">{errors.query.message}</p>}

        {results.length > 0 && !selected && (
          <ul role="listbox" className="mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            {results.map(food => (
              <li key={food.fdcId} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => { setSelected(food); setResults([]) }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0"
                >
                  <p className="text-white text-sm font-medium truncate">{food.description}</p>
                  <p className="text-gray-400 text-xs">{food.brandOwner ? `${food.brandOwner} · ` : ''}{food.nutrition.calories} kcal/100g</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-800 rounded-xl p-4 border border-emerald-800 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-white text-sm">{selected.description}</p>
              <p className="text-gray-400 text-xs">{selected.nutrition.calories} kcal/100g</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">×</button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <input
                {...register('quantity')}
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Cantidad"
              />
            </div>
            <select
              {...register('unit')}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="g">g</option>
              <option value="oz">oz</option>
              <option value="ml">ml</option>
              <option value="porción">porción</option>
            </select>
          </div>

          {/* Macro preview */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            {[
              { label: 'Proteína', value: selected.nutrition.protein * (quantity / 100), color: 'text-blue-400' },
              { label: 'Carbs', value: selected.nutrition.carbs * (quantity / 100), color: 'text-yellow-400' },
              { label: 'Grasa', value: selected.nutrition.fat * (quantity / 100), color: 'text-orange-400' },
              { label: 'Fibra', value: selected.nutrition.fiber * (quantity / 100), color: 'text-green-400' },
            ].map(m => (
              <div key={m.label} className="bg-gray-700 rounded-lg py-1.5">
                <p className={`font-bold ${m.color}`}>{Math.round(m.value * 10) / 10}g</p>
                <p className="text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-emerald-400 font-bold text-lg">
              ≈ {Math.round(selected.nutrition.calories * (quantity / 100))} kcal
            </p>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
            >
              Agregar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
