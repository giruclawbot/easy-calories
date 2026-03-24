'use client'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  selectedDate: string
  onChange: (date: string) => void
}

export function DayPicker({ selectedDate, onChange }: Props) {
  const date = parseISO(selectedDate)
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex items-center justify-between bg-gray-900 rounded-xl border border-gray-800 px-4 py-3">
      <button
        onClick={() => onChange(format(subDays(date, 1), 'yyyy-MM-dd'))}
        className="text-gray-400 hover:text-white transition-colors px-2 py-1"
      >
        ‹
      </button>
      <div className="text-center">
        <p className="font-semibold text-white capitalize">
          {selectedDate === today ? '📅 Hoy' : format(date, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        {selectedDate !== today && (
          <button
            onClick={() => onChange(today)}
            className="text-xs text-emerald-500 hover:text-emerald-300"
          >
            Ir a hoy
          </button>
        )}
      </div>
      <button
        onClick={() => onChange(format(addDays(date, 1), 'yyyy-MM-dd'))}
        disabled={selectedDate >= today}
        className="text-gray-400 hover:text-white transition-colors px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  )
}
