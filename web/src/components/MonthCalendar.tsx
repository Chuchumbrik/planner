import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
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
    <div className="motivator-card w-full p-4 md:p-5">
      <div className="mb-3 grid grid-cols-7 gap-1.5 text-center font-display text-[10px] uppercase tracking-wide text-on-surface-variant">
        {weekDayLabels.map((wd, i) => (
          <div key={i}>{wd}</div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {matrix.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1.5">
            {row.map((cell, ci) => {
              if ('pad' in cell) {
                return <div key={`p-${ri}-${ci}`} className="min-h-[3.25rem]" />
              }
              const { dateKey } = cell
              const d = Number(dateKey.slice(8, 10))
              const n = taskCountByDay[dateKey] ?? 0
              const hasTasks = n > 0
              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!canEdit}
                  className={cn(
                    'flex min-h-[3.25rem] flex-col items-center justify-start rounded-lg border px-1 py-1.5',
                    'text-sm transition active:scale-[0.98] disabled:opacity-40',
                    hasTasks
                      ? 'border-primary/35 bg-primary/10 hover:bg-primary/15'
                      : 'border-surface-variant bg-surface-container-low hover:bg-surface-container',
                  )}
                  onClick={() => onPickDay(dateKey)}
                >
                  <span className="font-display font-semibold text-on-surface">{d}</span>
                  {hasTasks ? (
                    <span
                      className="mt-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-primary/40 bg-primary/20 px-1 font-mono text-[10px] font-medium text-primary"
                      title={t('app.monthDayTasks', { count: n })}
                    >
                      {n > 99 ? '99+' : n}
                    </span>
                  ) : (
                    <span className="mt-1 h-5 w-5 rounded border border-dashed border-outline-variant" />
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
