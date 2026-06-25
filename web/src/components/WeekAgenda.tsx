import { useTranslation } from 'react-i18next'
import {
  getTaskSlotMinutes,
  isMainTaskDoneForDay,
  TASK_COLOR_HEX,
  taskHasOccurrenceOnDate,
  type Task,
} from '@motivator/core'
import { cn } from '@/lib/cn'

type Props = {
  weekDays: string[]
  tasks: Task[]
  todayKey: string
  locale: string
  canEdit: boolean
  onTaskClick: (taskId: string, dayKey: string) => void
}

function dayHeading(dateKey: string, locale: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  try {
    return dt.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' })
  } catch {
    return dateKey
  }
}

function slotClock(task: Task, day: string): string | null {
  const slot = getTaskSlotMinutes(task, day)
  if (!slot) return null
  return `${String(Math.floor(slot.start / 60)).padStart(2, '0')}:${String(slot.start % 60).padStart(2, '0')}`
}

/**
 * Недельная агенда (Phase 13): список задач по дням — альтернатива почасовой сетке
 * для тех, у кого нет жёсткого расписания. Один вертикальный поток секций-дней.
 */
export function WeekAgenda({ weekDays, tasks, todayKey, locale, canEdit, onTaskClick }: Props) {
  const { t } = useTranslation()

  function tasksForDay(day: string): Task[] {
    return tasks
      .filter((x) => taskHasOccurrenceOnDate(x, day))
      .sort((a, b) => {
        const da = isMainTaskDoneForDay(a, day)
        const db = isMainTaskDoneForDay(b, day)
        if (da !== db) return da ? 1 : -1
        const sa = getTaskSlotMinutes(a, day)?.start
        const sb = getTaskSlotMinutes(b, day)?.start
        if (sa != null && sb != null) return sa - sb
        if (sa != null) return -1
        if (sb != null) return 1
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      })
  }

  return (
    <div className="motivator-card flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto p-sm md:p-md">
      {weekDays.map((day) => {
        const dayTasks = tasksForDay(day)
        const isToday = day === todayKey
        return (
          <section key={day} className="py-1">
            <h3
              className={cn(
                'sticky top-0 z-[1] bg-surface-container py-1 text-label-md capitalize',
                isToday ? 'text-primary' : 'text-on-surface-variant',
              )}
            >
              {dayHeading(day, locale)}
            </h3>
            {dayTasks.length === 0 ? (
              <p className="px-1 py-1 text-body-sm text-on-surface-variant/70">
                {t('app.emptyPlannedDay')}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {dayTasks.map((task) => {
                  const accent = TASK_COLOR_HEX[task.colorKey] ?? TASK_COLOR_HEX.zinc
                  const done = isMainTaskDoneForDay(task, day)
                  const clock = slotClock(task, day)
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => onTaskClick(task.id, day)}
                        className="flex w-full items-center gap-2 rounded-md border border-surface-variant px-2 py-1.5 text-left hover:bg-surface-container-high disabled:opacity-40"
                        style={{ backgroundColor: done ? undefined : `${accent}1f` }}
                      >
                        <span
                          aria-hidden
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate text-body-sm',
                            done ? 'text-on-surface-variant line-through' : 'text-on-surface',
                          )}
                        >
                          {task.title}
                        </span>
                        {clock ? (
                          <span className="shrink-0 text-mono-data text-on-surface-variant">{clock}</span>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
