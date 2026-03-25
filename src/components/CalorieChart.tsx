'use client'
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { useI18n } from '@/components/I18nProvider'

interface Props {
  data: Record<string, number>
  goal?: number
}

export const CalorieChart = React.memo(function CalorieChart({ data, goal = 2000 }: Props) {
  const { t, locale } = useI18n()
  const dateFnsLocale = locale === 'es' ? es : enUS

  const chartData = Object.entries(data).map(([date, calories]) => ({
    day: format(parseISO(date), 'EEE', { locale: dateFnsLocale }),
    calories,
    over: calories > goal,
  }))

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
        {t('dashboard.caloriesThisWeek')}
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#e5e7eb' }}
            itemStyle={{ color: '#34d399' }}
            formatter={/* istanbul ignore next */ (val) => [`${val} kcal`, t('chart.calories')]}
          />
          <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.over ? '#ef4444' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {t('chart.goalLine', { goal: String(goal) })}
      </p>
    </div>
  )
})
