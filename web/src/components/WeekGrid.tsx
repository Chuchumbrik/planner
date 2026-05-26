import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { getAppNow } from '@/lib/appNow'
import { isPlannerTaskOverdue } from '@/lib/plannerTaskDayStatus'
import {
  getTaskSlotMinutes,
  isMainTaskDoneForDay,
  isPlannedTaskFullyCompleteForDay,
  TASK_COLOR_HEX,
  taskHasOccurrenceOnDate,
  type PriorityLabels,
  type Task,
} from '@motivator/core'

const HOUR_HEIGHT_PX = 42
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const GRID_COLS = '56px repeat(7, minmax(0, 1fr))' as const

const GRID_BORDER = 'border-surface-variant'
const GRID_MUTED = 'text-on-surface-variant'
const GRID_SURFACE = 'bg-surface-container-lowest'

function parseDayParts(dateKey: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateKey.split('-').map(Number)
  return { y, m: m - 1, d }
}

function dayHeader(dateKey: string, locale: string): { weekday: string; dayNum: string } {
  const { y, m, d } = parseDayParts(dateKey)
  const dt = new Date(y, m, d)
  try {
    return {
      weekday: dt.toLocaleDateString(locale, { weekday: 'short' }),
      dayNum: String(d),
    }
  } catch {
    return { weekday: '', dayNum: String(d) }
  }
}

function formatSlotClock(task: Task, day: string): string | null {
  const slot = getTaskSlotMinutes(task, day)
  if (!slot) return null
  const h = Math.floor(slot.start / 60)
  const m = slot.start % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

type Props = {
  weekDays: string[]
  tasks: Task[]
  todayKey: string
  priorityLabels: PriorityLabels
  locale: string
  canEdit: boolean
  onTaskClick: (taskId: string, columnDayKey: string) => void
}

function dayColumnTone(day: string, todayKey: string): 'today' | 'past' | 'future' {
  if (day === todayKey) return 'today'
  if (day < todayKey) return 'past'
  return 'future'
}

export function WeekGrid({
  weekDays,
  tasks,
  todayKey,
  priorityLabels,
  locale,
  canEdit,
  onTaskClick,
}: Props) {
  const { t } = useTranslation()
  const gridHeight = 24 * HOUR_HEIGHT_PX

  function tasksForDay(day: string) {
    return tasks.filter((x) => taskHasOccurrenceOnDate(x, day))
  }

  function slottedTasks(day: string) {
    const slotted = tasksForDay(day).filter((x) => getTaskSlotMinutes(x, day) != null)
    return slotted.sort((a, b) => {
      const da = isMainTaskDoneForDay(a, day)
      const db = isMainTaskDoneForDay(b, day)
      if (da !== db) return da ? 1 : -1
      const sa = getTaskSlotMinutes(a, day)!.start
      const sb = getTaskSlotMinutes(b, day)!.start
      return sa - sb
    })
  }

  function unslottedTasks(day: string) {
    const uns = tasksForDay(day).filter((x) => getTaskSlotMinutes(x, day) == null)
    return uns.sort((a, b) => {
      const da = isMainTaskDoneForDay(a, day)
      const db = isMainTaskDoneForDay(b, day)
      if (da !== db) return da ? 1 : -1
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    })
  }

  const cellBorder = `border-b border-r ${GRID_BORDER}`

  function columnClass(day: string, base: string): string {
    const tone = dayColumnTone(day, todayKey)
    return cn(
      base,
      tone === 'today' && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
      tone === 'past' && 'opacity-[0.72]',
    )
  }

  function taskBlockClass(task: Task, day: string, done: boolean): string {
    const overdue = !done && isPlannerTaskOverdue(task, day, todayKey, getAppNow())
    return cn(
      'absolute left-0.5 right-0.5 overflow-hidden rounded border border-l-[3px] px-1 py-0.5',
      'text-left text-[10px] leading-tight disabled:opacity-40',
      'hover:bg-surface-container-high',
      done
        ? 'border-primary/30 bg-primary/10 text-on-surface-variant line-through opacity-75'
        : overdue
          ? 'border-tertiary/40 bg-tertiary-container/10 text-on-surface'
          : 'border-surface-variant bg-surface-container text-on-surface',
    )
  }

  return (
    <div className="motivator-card flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden p-0">
      <div
        className={cn('grid w-full min-w-0 border-x border-t', GRID_BORDER)}
        style={{
          gridTemplateColumns: GRID_COLS,
          gridTemplateRows: `auto auto minmax(200px, min(78dvh, 900px))`,
        }}
      >
        <div className={cn(cellBorder, 'p-2', GRID_MUTED)} />
        {weekDays.map((day) => {
          const { weekday, dayNum } = dayHeader(day, locale)
          const isToday = day === todayKey
          return (
            <div
              key={day}
              className={columnClass(
                day,
                cn('border-b border-l p-2 text-center text-xs', GRID_BORDER, 'bg-surface-container-low'),
              )}
            >
              <div
                className={cn(
                  'font-display text-[10px] uppercase',
                  isToday ? 'text-primary' : GRID_MUTED,
                )}
              >
                {weekday}
              </div>
              <div
                className={cn(
                  'font-display text-headline-md',
                  isToday ? 'font-bold text-primary' : 'font-semibold text-on-surface',
                )}
              >
                {dayNum}
              </div>
            </div>
          )
        })}

        <div className={cn(cellBorder, 'p-1')} />
        {weekDays.map((day) => {
          const uns = unslottedTasks(day)
          return (
            <div
              key={`u-${day}`}
              className={columnClass(
                day,
                cn(
                  'flex min-h-[2rem] flex-wrap content-start gap-1 border-b border-l p-1',
                  GRID_BORDER,
                  'bg-surface-container-low/50',
                ),
              )}
            >
              {uns.length === 0 ? (
                <span className={cn('text-[10px]', GRID_MUTED)}>—</span>
              ) : (
                uns.map((task) => {
                  const accent = TASK_COLOR_HEX[task.colorKey] ?? TASK_COLOR_HEX.zinc
                  const done = isPlannedTaskFullyCompleteForDay(task, day)
                  const overdue = !done && isPlannerTaskOverdue(task, day, todayKey, getAppNow())
                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={!canEdit}
                      title={task.title}
                      className={cn(
                        'flex max-w-full items-center gap-1 truncate rounded border border-l-2 px-1.5 py-0.5',
                        'text-left text-[10px] disabled:opacity-40',
                        done
                          ? 'border-primary/25 bg-primary/10 text-on-surface-variant line-through'
                          : overdue
                            ? 'border-tertiary/35 bg-tertiary-container/10 text-on-surface'
                            : 'border-surface-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
                      )}
                      style={{ borderLeftColor: accent }}
                      onClick={() => onTaskClick(task.id, day)}
                    >
                      {task.title}
                    </button>
                  )
                })
              )}
            </div>
          )
        })}

        <div
          className="week-grid-v-scroll min-h-0 overflow-y-auto overscroll-y-contain border-b border-surface-variant"
          style={{
            gridRow: 3,
            gridColumn: '1 / -1',
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
          }}
        >
        <div
          className={cn('border-b border-r pr-1', GRID_BORDER, GRID_SURFACE)}
          style={{ height: gridHeight }}
        >
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_HEIGHT_PX }}
              className={cn(
                'border-t font-mono text-[11px] leading-none',
                'border-surface-variant/50',
                GRID_MUTED,
              )}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {weekDays.map((day) => {
          const slotted = slottedTasks(day)
          return (
            <div
              key={day}
              className={columnClass(
                day,
                cn('relative border-l', GRID_BORDER, 'bg-surface-container-lowest/80'),
              )}
              style={{ height: gridHeight }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute left-0 right-0 border-t border-surface-variant/40"
                  style={{ top: h * HOUR_HEIGHT_PX }}
                />
              ))}
              {slotted.map((task) => {
                const slot = getTaskSlotMinutes(task, day)
                if (!slot) return null
                const top = (slot.start / 60) * HOUR_HEIGHT_PX
                const height = Math.max(((slot.end - slot.start) / 60) * HOUR_HEIGHT_PX, 22)
                const accent = TASK_COLOR_HEX[task.colorKey] ?? TASK_COLOR_HEX.zinc
                const done = isMainTaskDoneForDay(task, day)
                const clock = formatSlotClock(task, day)
                return (
                  <button
                    key={task.id}
                    type="button"
                    disabled={!canEdit}
                    title={`${task.title} · ${priorityLabels[task.priorityRank]}`}
                    className={taskBlockClass(task, day, done)}
                    style={{ top, height, zIndex: 2, borderLeftColor: accent }}
                    onClick={() => onTaskClick(task.id, day)}
                  >
                    {clock ? (
                      <span className="text-mono-data text-[9px] text-on-surface-variant">{clock}</span>
                    ) : null}
                    <span className="line-clamp-2 font-medium">{task.title}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
        </div>
      </div>
      <p className="shrink-0 border-t border-surface-variant px-4 py-3 text-body-sm leading-snug text-on-surface-variant">
        {t('app.weekGridHint')}
      </p>
    </div>
  )
}
