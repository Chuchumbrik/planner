import type { Task, TaskGroup } from '@motivator/core'
import { cn } from '@/lib/cn'
import { CategoriesBlock } from './CategoriesBlock'
import { PlannerLeftPanelMiniCal } from './PlannerLeftPanelMiniCal'
import { TodayAgendaBlock } from './TodayAgendaBlock'

type Props = {
  groups: TaskGroup[]
  disabled?: boolean
  // мини-календарь
  year: number
  monthIndex: number
  selectedDay: string
  todayKey: string
  locale: string
  onPickDay: (dateKey: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  // агенда
  todayTasks: Task[]
  onTaskClick: (taskId: string) => void
  /** inline — в потоке (≥1280px); drawer — overlay на узких экранах. */
  variant?: 'inline' | 'drawer'
  isOpen?: boolean
  onClose?: () => void
}

/**
 * Левая панель планировщика (Phase 13, BR-D-010): мини-календарь + Categories + Сегодня.
 * inline — постоянная колонка ≥1280px; drawer — выезжающая панель на узких экранах.
 */
export function PlannerLeftPanel({
  groups,
  disabled = false,
  year,
  monthIndex,
  selectedDay,
  todayKey,
  locale,
  onPickDay,
  onPrevMonth,
  onNextMonth,
  todayTasks,
  onTaskClick,
  variant = 'inline',
  isOpen = false,
  onClose,
}: Props) {
  const pickDay = (dateKey: string) => {
    onPickDay(dateKey)
    if (variant === 'drawer') onClose?.()
  }

  const content = (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <PlannerLeftPanelMiniCal
        year={year}
        monthIndex={monthIndex}
        selectedDay={selectedDay}
        todayKey={todayKey}
        locale={locale}
        onPickDay={pickDay}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
      <CategoriesBlock groups={groups} disabled={disabled} />
      <TodayAgendaBlock tasks={todayTasks} onTaskClick={onTaskClick} />
    </div>
  )

  if (variant === 'inline') {
    return (
      <aside
        aria-label="planner-left-panel"
        className="hidden w-[280px] shrink-0 border-r border-surface-variant bg-surface-container-lowest xl:block"
      >
        {content}
      </aside>
    )
  }

  // drawer
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[52] xl:hidden" role="dialog" aria-modal="true" aria-label="planner-left-panel">
      <button
        type="button"
        aria-label="close"
        className="absolute inset-0 bg-black/50"
        onClick={() => onClose?.()}
      />
      <aside
        className={cn(
          'absolute left-14 top-0 z-[53] h-dvh w-[280px] max-w-[85vw]',
          'border-r border-surface-variant bg-surface-container-lowest shadow-2xl',
        )}
      >
        {content}
      </aside>
    </div>
  )
}
