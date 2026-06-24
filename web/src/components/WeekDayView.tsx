import { useRef } from 'react'
import type { PriorityLabels, Task } from '@motivator/core'
import { cn } from '@/lib/cn'
import { WeekGrid } from './WeekGrid'

type Props = {
  /** Текущий показываемый день YYYY-MM-DD. */
  day: string
  tasks: Task[]
  todayKey: string
  priorityLabels: PriorityLabels
  locale: string
  canEdit: boolean
  onTaskClick: (taskId: string, columnDayKey: string) => void
  onSlotClick?: (columnDayKey: string, startMinutes: number) => void
  onPrevDay: () => void
  onNextDay: () => void
}

/** Порог горизонтального свайпа, px. */
const SWIPE_THRESHOLD = 50

function dayLabel(dateKey: string, locale: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  try {
    return dt.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  } catch {
    return dateKey
  }
}

/**
 * Мобильный вид недели (Phase 13, BR-D-010): один день на всю ширину со свайпом
 * по дням — вместо сжатия 7 колонок в нечитаемую сетку. Внутри переиспользует WeekGrid
 * с единственным днём (мягкая сетка: схлоп ночи, дорожка «без времени», карточки).
 */
export function WeekDayView({
  day,
  tasks,
  todayKey,
  priorityLabels,
  locale,
  canEdit,
  onTaskClick,
  onSlotClick,
  onPrevDay,
  onNextDay,
}: Props) {
  const touchStartX = useRef<number | null>(null)
  const isToday = day === todayKey

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    if (dx <= -SWIPE_THRESHOLD) onNextDay()
    else if (dx >= SWIPE_THRESHOLD) onPrevDay()
    touchStartX.current = null
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="‹"
          onClick={onPrevDay}
          className="motivator-chip h-9 w-9 justify-center"
        >
          ‹
        </button>
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-center text-label-md capitalize',
            isToday ? 'text-primary' : 'text-on-surface',
          )}
        >
          {dayLabel(day, locale)}
        </span>
        <button
          type="button"
          aria-label="›"
          onClick={onNextDay}
          className="motivator-chip h-9 w-9 justify-center"
        >
          ›
        </button>
      </div>

      <WeekGrid
        weekDays={[day]}
        tasks={tasks}
        todayKey={todayKey}
        priorityLabels={priorityLabels}
        locale={locale}
        canEdit={canEdit}
        onTaskClick={onTaskClick}
        onSlotClick={onSlotClick}
      />
    </div>
  )
}
