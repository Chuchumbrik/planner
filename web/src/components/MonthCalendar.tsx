import { useTranslation } from 'react-i18next'
import type { MonthMatrixCell } from '@motivator/core'

type Props = {
  matrix: MonthMatrixCell[][]
  taskCountByDay: Record<string, number>
  locale: string
  canEdit: boolean
  onPickDay: (dateKey: string) => void
}

export function MonthCalendar({
  matrix,
  taskCountByDay,
  locale,
  canEdit,
  onPickDay,
}: Props) {
  const { t } = useTranslation()

  const weekDayLabels = (() => {
    const base = new Date(2024, 0, 1)
    const monday = new Date(base)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      try {
        return d.toLocaleDateString(locale, { weekday: 'narrow' })
      } catch {
        return ''
      }
    })
  })()

  return (
    <div className="w-full">
      <div
        className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-zinc-500"
      >
        {weekDayLabels.map((wd, i) => (
          <div key={i}>{wd}</div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {matrix.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1">
            {row.map((cell, ci) => {
              if ('pad' in cell) {
                return <div key={`p-${ri}-${ci}`} className="min-h-[3rem]" />
              }
              const { dateKey } = cell
              const d = Number(dateKey.slice(8, 10))
              const n = taskCountByDay[dateKey] ?? 0
              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!canEdit}
                  className={`flex min-h-[3rem] flex-col items-center justify-start rounded-lg border px-1 py-1 text-sm transition hover:bg-zinc-900 disabled:opacity-40 ${
                    n > 0
                      ? 'border-emerald-800/50 bg-emerald-950/20'
                      : 'border-zinc-800 bg-zinc-950/40'
                  }`}
                  onClick={() => onPickDay(dateKey)}
                >
                  <span className="text-zinc-200">{d}</span>
                  {n > 0 ? (
                    <span
                      className="mt-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600/80 px-1 text-[10px] font-medium text-emerald-950"
                      title={t('app.monthDayTasks', { count: n })}
                    >
                      {n > 99 ? '99+' : n}
                    </span>
                  ) : (
                    <span className="mt-1 h-5 w-5 rounded-full border border-dashed border-zinc-800" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
