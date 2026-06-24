import { useState } from 'react'
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

const HOUR_HEIGHT_PX = 56
/** «Рабочее окно» по умолчанию — часы вне него схлопываются (BR-D-007 D). */
const DEFAULT_DAY_START_HOUR = 7
const DEFAULT_DAY_END_HOUR = 22
/** Сколько задач без слота показываем в дорожке до «… и ещё N». */
const UNSLOTTED_CAP = 4

const GRID_COLS = '56px repeat(7, minmax(0, 1fr))' as const

const GRID_BORDER = 'border-surface-variant'
const GRID_MUTED = 'text-on-surface-variant'
const GRID_SURFACE = 'bg-surface-container-lowest'

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i)
}

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

/** Заливка карточки цветом группы (hex #rrggbb → #rrggbb + alpha ~35%) — «весомая» карточка. */
function cardFill(hex: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}59` : hex
}

type Props = {
  weekDays: string[]
  tasks: Task[]
  todayKey: string
  priorityLabels: PriorityLabels
  locale: string
  canEdit: boolean
  onTaskClick: (taskId: string, columnDayKey: string) => void
  /** Клик по пустому слоту — открыть создание задачи с этим временем (BR-D-007/012). */
  onSlotClick?: (columnDayKey: string, startMinutes: number) => void
  /** Граница «утренних» ночных часов (по умолчанию 7 → схлоп 0:00–7:00). */
  dayStartHour?: number
  /** Граница «вечерних» ночных часов (по умолчанию 22 → схлоп 22:00–24:00). */
  dayEndHour?: number
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
  onSlotClick,
  dayStartHour = DEFAULT_DAY_START_HOUR,
  dayEndHour = DEFAULT_DAY_END_HOUR,
}: Props) {
  const { t } = useTranslation()
  const [showNightTop, setShowNightTop] = useState(false)
  const [showNightBottom, setShowNightBottom] = useState(false)

  const winStart = showNightTop ? 0 : dayStartHour
  const winEnd = showNightBottom ? 24 : dayEndHour
  const hours = range(winStart, winEnd)
  const gridHeight = (winEnd - winStart) * HOUR_HEIGHT_PX

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

  /** Сколько слотов попадает в схлопнутую ночную полосу (по всем дням недели). */
  function nightCount(side: 'top' | 'bottom'): number {
    let n = 0
    for (const day of weekDays) {
      for (const task of slottedTasks(day)) {
        const slot = getTaskSlotMinutes(task, day)
        if (!slot) continue
        const startHour = Math.floor(slot.start / 60)
        if (side === 'top' && startHour < dayStartHour) n += 1
        if (side === 'bottom' && startHour >= dayEndHour) n += 1
      }
    }
    return n
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

  function taskBlockClass(done: boolean, overdue: boolean): string {
    return cn(
      'absolute left-1 right-1 z-[2] overflow-hidden rounded-lg border border-l-[4px] px-1.5 py-1',
      'text-left text-[11px] leading-tight disabled:opacity-40 hover:brightness-110',
      done
        ? 'border-primary/30 bg-primary/10 text-on-surface-variant line-through opacity-75'
        : overdue
          ? 'border-tertiary/45 bg-tertiary-container/15 text-on-surface'
          : 'border-surface-variant text-on-surface',
    )
  }

  function NightBar({ side }: { side: 'top' | 'bottom' }) {
    const expanded = side === 'top' ? showNightTop : showNightBottom
    const toggle = side === 'top' ? setShowNightTop : setShowNightBottom
    const count = expanded ? 0 : nightCount(side)
    return (
      <button
        type="button"
        onClick={() => toggle((v) => !v)}
        className={cn(
          'flex w-full items-center justify-center gap-2 border-b py-1 text-label-sm',
          GRID_BORDER,
          'bg-surface-container-low/60 text-on-surface-variant hover:bg-surface-container',
        )}
      >
        <span aria-hidden>{expanded ? '▴' : '▾'}</span>
        <span>{expanded ? t('app.weekNightHide') : t('app.weekNightShow')}</span>
        {!expanded && count > 0 ? (
          <span className="rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">
            +{count}
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <div className="motivator-card flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden p-0">
      {/* Шапка дней + дорожка «без времени» */}
      <div
        className={cn('grid w-full min-w-0 border-x border-t', GRID_BORDER)}
        style={{ gridTemplateColumns: GRID_COLS, gridTemplateRows: 'auto auto' }}
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
              <div className="font-display text-[10px] uppercase text-on-surface-variant">
                {weekday}
              </div>
              <div className="mt-1 flex justify-center">
                <span
                  className={cn(
                    'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 font-display text-headline-md',
                    isToday ? 'bg-primary font-bold text-on-primary' : 'font-semibold text-on-surface',
                  )}
                >
                  {dayNum}
                </span>
              </div>
            </div>
          )
        })}

        {/* Дорожка «Без времени» */}
        <div
          className={cn(
            cellBorder,
            'flex items-start p-1 text-[9px] uppercase leading-none [overflow-wrap:anywhere]',
            GRID_MUTED,
          )}
        >
          {t('app.weekUnslotted')}
        </div>
        {weekDays.map((day) => {
          const uns = unslottedTasks(day)
          const visible = uns.slice(0, UNSLOTTED_CAP)
          const hidden = uns.length - visible.length
          return (
            <div
              key={`u-${day}`}
              className={columnClass(
                day,
                cn('flex min-h-[2rem] flex-col gap-1 border-b border-l p-1', GRID_BORDER, 'bg-surface-container-low/50'),
              )}
            >
              {uns.length === 0 ? (
                <span className={cn('text-[10px]', GRID_MUTED)}>—</span>
              ) : (
                <>
                  {visible.map((task) => {
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
                          'flex max-w-full items-center gap-1 truncate rounded-md border border-l-[3px] px-1.5 py-1',
                          'text-left text-[11px] disabled:opacity-40 hover:brightness-110',
                          done
                            ? 'border-primary/25 bg-primary/10 text-on-surface-variant line-through'
                            : overdue
                              ? 'border-tertiary/40 bg-tertiary-container/15 text-on-surface'
                              : 'border-surface-variant text-on-surface',
                        )}
                        style={{
                          borderLeftColor: accent,
                          backgroundColor: done || overdue ? undefined : cardFill(accent),
                        }}
                        onClick={() => onTaskClick(task.id, day)}
                      >
                        <span className="truncate">{task.title}</span>
                      </button>
                    )
                  })}
                  {hidden > 0 ? (
                    <span className={cn('px-1 text-[10px]', GRID_MUTED)}>
                      {t('app.backlogMore', { count: hidden })}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Скролл-зона: ночь-верх / рабочие часы / ночь-низ */}
      <div className="week-grid-v-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain border-x border-b border-surface-variant">
        <NightBar side="top" />

        <div className="grid w-full min-w-0" style={{ gridTemplateColumns: GRID_COLS }}>
          {/* Колонка часов */}
          <div className={cn('border-r pr-1', GRID_BORDER, GRID_SURFACE)} style={{ height: gridHeight }}>
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT_PX }}
                className={cn('border-t font-mono text-[11px] leading-none', 'border-surface-variant/50', GRID_MUTED)}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const slotted = slottedTasks(day).filter((task) => {
              const slot = getTaskSlotMinutes(task, day)
              if (!slot) return false
              const startHour = Math.floor(slot.start / 60)
              return startHour >= winStart && startHour < winEnd
            })
            return (
              <div
                key={day}
                className={columnClass(day, cn('relative border-l', GRID_BORDER, 'bg-surface-container-lowest/80'))}
                style={{ height: gridHeight }}
              >
                {hours.map((h, idx) => (
                  <div key={h} className="absolute left-0 right-0" style={{ top: idx * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}>
                    <div className="pointer-events-none absolute left-0 right-0 top-0 border-t border-surface-variant/40" />
                    {onSlotClick && canEdit ? (
                      <button
                        type="button"
                        aria-label={t('app.weekSlotAdd')}
                        onClick={() => onSlotClick(day, h * 60)}
                        className="absolute inset-0.5 z-[1] flex items-center justify-center rounded-md text-[11px] text-on-surface-variant/0 transition hover:border hover:border-dashed hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                      >
                        + {t('app.weekSlotAdd')}
                      </button>
                    ) : null}
                  </div>
                ))}
                {slotted.map((task) => {
                  const slot = getTaskSlotMinutes(task, day)!
                  const top = ((slot.start - winStart * 60) / 60) * HOUR_HEIGHT_PX
                  const height = Math.max(((slot.end - slot.start) / 60) * HOUR_HEIGHT_PX, 30)
                  const accent = TASK_COLOR_HEX[task.colorKey] ?? TASK_COLOR_HEX.zinc
                  const done = isMainTaskDoneForDay(task, day)
                  const overdue = !done && isPlannerTaskOverdue(task, day, todayKey, getAppNow())
                  const clock = formatSlotClock(task, day)
                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={!canEdit}
                      title={`${task.title} · ${priorityLabels[task.priorityRank]}`}
                      className={taskBlockClass(done, overdue)}
                      style={{
                        top,
                        height,
                        borderLeftColor: accent,
                        backgroundColor: done || overdue ? undefined : cardFill(accent),
                      }}
                      onClick={() => onTaskClick(task.id, day)}
                    >
                      {clock ? <span className="block text-mono-data text-[10px] opacity-80">{clock}</span> : null}
                      <span className="line-clamp-2 font-medium">{task.title}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        <NightBar side="bottom" />
      </div>

      <p className="shrink-0 border-x border-b border-surface-variant px-4 py-3 text-body-sm leading-snug text-on-surface-variant">
        {t('app.weekGridHint')}
      </p>
    </div>
  )
}
