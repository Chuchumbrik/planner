import { monthLabel, monthWeekMatrix } from '@motivator/core'
import { cn } from '@/lib/cn'

type Props = {
  /** Полный год, напр. 2026 */
  year: number
  /** 0-based индекс месяца */
  monthIndex: number
  /** YYYY-MM-DD выбранного дня */
  selectedDay: string
  /** YYYY-MM-DD «сегодня» */
  todayKey: string
  locale: string
  onPickDay: (dateKey: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

const WEEKDAY_LETTERS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В']

/** Компактный мини-календарь — навигатор дат в левой панели планировщика (Phase 13, BR-D-010). */
export function PlannerLeftPanelMiniCal({
  year,
  monthIndex,
  selectedDay,
  todayKey,
  locale,
  onPickDay,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const matrix = monthWeekMatrix(year, monthIndex)

  return (
    <section className="flex flex-col gap-2" aria-label={monthLabel(year, monthIndex, locale)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="‹"
          onClick={onPrevMonth}
          className="motivator-chip h-7 w-7 justify-center"
        >
          ‹
        </button>
        <span className="text-label-md capitalize text-on-surface">
          {monthLabel(year, monthIndex, locale)}
        </span>
        <button
          type="button"
          aria-label="›"
          onClick={onNextMonth}
          className="motivator-chip h-7 w-7 justify-center"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_LETTERS.map((d, i) => (
          <span key={i} className="text-label-sm text-on-surface-variant" aria-hidden>
            {d}
          </span>
        ))}
        {matrix.flat().map((cell, i) => {
          if ('pad' in cell) return <span key={`pad-${i}`} aria-hidden />
          const day = Number(cell.dateKey.slice(8, 10))
          const isToday = cell.dateKey === todayKey
          const isSelected = cell.dateKey === selectedDay
          return (
            <button
              key={cell.dateKey}
              type="button"
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => onPickDay(cell.dateKey)}
              className={cn(
                'flex h-7 w-full items-center justify-center rounded-motivator-lg text-body-sm tabular-nums',
                'text-on-surface hover:bg-surface-container-high',
                isSelected && 'bg-primary text-on-primary',
                !isSelected && isToday && 'border border-primary/50 text-primary',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}
