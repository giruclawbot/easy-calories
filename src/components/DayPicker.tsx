'use client'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useI18n } from '@/components/I18nProvider'

interface Props {
  selectedDate: string
  onChange: (date: string) => void
}

export function DayPicker({ selectedDate, onChange }: Props) {
  const { t, locale } = useI18n()
  const date = parseISO(selectedDate)
  const today = format(new Date(), 'yyyy-MM-dd')
  const dateFnsLocale = locale === 'es' ? es : undefined

  return (
    <div className="flex items-center justify-between bg-gray-900 rounded-xl border border-gray-800 px-4 py-3">
      <button
        onClick={() => onChange(format(subDays(date, 1), 'yyyy-MM-dd'))}
        className="text-gray-400 hover:text-white transition-colors px-2 py-1"
        aria-label="Día anterior"
      >
        ‹
      </button>
      <div className="text-center">
        <p className="font-semibold text-white capitalize">
          {selectedDate === today
            ? `📅 ${t('common.today')}`
            : format(date, "EEEE d 'de' MMMM", { locale: dateFnsLocale })}
        </p>
        {selectedDate !== today && (
          <button
            onClick={() => onChange(today)}
            className="text-xs text-emerald-500 hover:text-emerald-300"
          >
            {t('common.today')}
          </button>
        )}
      </div>
      <button
        onClick={() => onChange(format(addDays(date, 1), 'yyyy-MM-dd'))}
        disabled={selectedDate >= today}
        className="text-gray-400 hover:text-white transition-colors px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Día siguiente"
      >
        ›
      </button>
    </div>
  )
}
