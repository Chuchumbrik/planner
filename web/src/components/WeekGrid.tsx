import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import {
  getTaskSlotMinutes,
  isMainTaskDoneForDay,
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

type Props = {
  weekDays: string[]
  tasks: Task[]
  priorityLabels: PriorityLabels
  locale: string
  canEdit: boolean
  onTaskClick: (taskId: string, columnDayKey: string) => void
}

export function WeekGrid({
  weekDays,
  tasks,
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
          return (
            <div
              key={day}
              className={cn(
                'border-b border-l p-2 text-center text-xs',
                GRID_BORDER,
                'bg-surface-container-low',
              )}
            >
              <div className={cn('font-display text-[10px] uppercase', GRID_MUTED)}>{weekday}</div>
              <div className="font-display text-sm font-bold text-on-surface">{dayNum}</div>
            </div>
          )
        })}

        <div className={cn(cellBorder, 'p-1')} />
        {weekDays.map((day) => {
          const uns = unslottedTasks(day)
          return (
            <div
              key={`u-${day}`}
              className={cn(
                'flex min-h-[2rem] flex-wrap content-start gap-1 border-b border-l p-1',
                GRID_BORDER,
                'bg-surface-container-low/50',
              )}
            >
              {uns.length === 0 ? (
                <span className={cn('text-[10px]', GRID_MUTED)}>—</span>
              ) : (
                uns.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    disabled={!canEdit}
                    title={task.title}
                    className={cn(
                      'max-w-full truncate rounded border border-outline-variant px-1.5 py-0.5',
                      'text-left text-[10px] text-on-surface-variant',
                      'hover:bg-surface-container-high disabled:opacity-40',
                    )}
                    onClick={() => onTaskClick(task.id, day)}
                  >
                    {task.title}
                  </button>
                ))
              )}
            </div>
          )
        })}

        <div
          className={cn('border-b border-r pr-1', GRID_BORDER, GRID_SURFACE)}
          style={{ gridRow: 3, gridColumn: 1 }}
        >
          <div style={{ height: gridHeight }}>
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
        </div>
        <div
          className="week-grid-v-scroll min-h-0 overflow-y-auto overscroll-y-contain border-b border-surface-variant"
          style={{
            gridRow: 3,
            gridColumn: '2 / -1',
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          }}
        >
          {weekDays.map((day) => {
            const slotted = slottedTasks(day)
            return (
              <div
                key={day}
                className={cn('relative border-l', GRID_BORDER, 'bg-surface-container-lowest/80')}
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
                  const height = Math.max(((slot.end - slot.start) / 60) * HOUR_HEIGHT_PX, 18)
                  const accent = TASK_COLOR_HEX[task.colorKey] ?? TASK_COLOR_HEX.zinc
                  const done = isMainTaskDoneForDay(task, day)
                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={!canEdit}
                      title={`${task.title} · ${priorityLabels[task.priorityRank]}`}
                      className={cn(
                        'absolute left-0.5 right-0.5 overflow-hidden rounded border border-l-[3px] px-1 py-0.5',
                        'text-left text-[10px] leading-tight shadow-sm disabled:opacity-40',
                        'border-surface-variant hover:bg-surface-container-high',
                        done
                          ? 'bg-primary/10 text-on-surface-variant line-through opacity-70'
                          : 'bg-surface-container text-on-surface',
                      )}
                      style={{ top, height, zIndex: 2, borderLeftColor: accent }}
                      onClick={() => onTaskClick(task.id, day)}
                    >
                      <span className="line-clamp-3 font-medium">{task.title}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      <p className="shrink-0 border-t border-surface-variant px-4 py-3 text-[11px] leading-snug text-on-surface-variant">
        {t('app.weekGridHint')}
      </p>
    </div>
  )
}
