import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { PlannerDaySummary } from '@/lib/plannerPeriodStats'
import type { MonthMatrixCell } from '@motivator/core'

type Props = {
  matrix: MonthMatrixCell[][]
  daySummaries: Record<string, PlannerDaySummary>
  todayKey: string
  locale: string
  canEdit: boolean
  onPickDay: (dateKey: string) => void
}

export function MonthCalendar({
  matrix,
  daySummaries,
  todayKey,
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
    <div className="motivator-card w-full p-sm md:p-md">
      <div className="mb-3 grid grid-cols-7 gap-1.5 text-center text-label-sm uppercase text-on-surface-variant">
        {weekDayLabels.map((wd, i) => (
          <div key={i}>{wd}</div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {matrix.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1.5">
            {row.map((cell, ci) => {
              if ('pad' in cell) {
                return <div key={`p-${ri}-${ci}`} className="min-h-[3.75rem]" />
              }
              const { dateKey } = cell
              const d = Number(dateKey.slice(8, 10))
              const summary = daySummaries[dateKey] ?? { total: 0, done: 0, overdue: 0, taskColors: [] }
              const { total, done, overdue } = summary
              const isToday = dateKey === todayKey
              const isPast = dateKey < todayKey
              const open = total - done

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!canEdit}
                  className={cn(
                    'flex min-h-[3.75rem] flex-col items-center justify-start rounded-card border px-1 py-1.5',
                    'text-sm transition active:scale-[0.98] disabled:opacity-40',
                    isToday
                      ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/25'
                      : total > 0
                        ? overdue > 0
                          ? 'border-tertiary/35 bg-tertiary-container/10 hover:bg-tertiary-container/15'
                          : 'border-primary/25 bg-primary/10 hover:bg-primary/15'
                        : 'border-surface-variant bg-surface-container-low hover:bg-surface-container',
                    isPast && !isToday && 'opacity-75',
                  )}
                  onClick={() => onPickDay(dateKey)}
                >
                  <span
                    className={cn(
                      'font-display text-sm font-semibold',
                      isToday ? 'text-primary' : 'text-on-surface',
                    )}
                  >
                    {d}
                  </span>
                  {total > 0 ? (
                    <div className="mt-1 flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          'flex h-5 min-w-[1.35rem] items-center justify-center rounded border px-1 font-mono text-[10px] font-medium',
                          overdue > 0
                            ? 'border-tertiary/40 bg-tertiary-container/15 text-tertiary'
                            : 'border-primary/35 bg-primary/15 text-primary',
                        )}
                        title={t('app.monthDayTasks', { count: total })}
                      >
                        {total > 99 ? '99+' : total}
                      </span>
                      {open > 0 ? (
                        <span className="text-[9px] leading-none text-on-surface-variant">
                          {overdue > 0
                            ? t('app.monthDayOverdueShort', { count: overdue })
                            : t('app.monthDayOpenShort', { count: open })}
                        </span>
                      ) : (
                        <span className="text-[9px] leading-none text-primary/80">
                          {t('app.monthDayDoneShort')}
                        </span>
                      )}
                      {summary.taskColors.length > 0 ? (
                        <div
                          className="flex max-w-full flex-wrap items-center justify-center gap-0.5"
                          aria-hidden
                        >
                          {summary.taskColors.map((hex) => (
                            <span
                              key={hex}
                              style={{ backgroundColor: hex }}
                              className="h-1.5 w-1.5 rounded-full"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
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
