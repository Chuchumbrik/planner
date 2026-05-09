import { useTranslation } from 'react-i18next'
import {
  getTaskSlotMinutes,
  isMainTaskDoneForDay,
  TASK_COLOR_HEX,
  taskOccursOnDate,
  type PriorityLabels,
  type Task,
} from '@motivator/core'

const HOUR_HEIGHT_PX = 36
const HOURS = Array.from({ length: 24 }, (_, i) => i)

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
  /** columnDayKey — календарный день колонки (для повторов и отметки «выполнено за день») */
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
    return tasks.filter((x) => taskOccursOnDate(x, day))
  }

  function slottedTasks(day: string) {
    return tasksForDay(day).filter((x) => getTaskSlotMinutes(x, day) != null)
  }

  function unslottedTasks(day: string) {
    return tasksForDay(day).filter(
      (x) => getTaskSlotMinutes(x, day) == null && !isMainTaskDoneForDay(x, day),
    )
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto text-center">
        <div className="inline-block min-w-[720px] text-left">
        <div
          className="grid border-b border-zinc-800 text-xs"
          style={{ gridTemplateColumns: `56px repeat(7, minmax(0,1fr))` }}
        >
          <div className="p-2 text-zinc-600" />
          {weekDays.map((day) => {
            const { weekday, dayNum } = dayHeader(day, locale)
            return (
              <div
                key={day}
                className="border-l border-zinc-800 p-2 text-center text-zinc-200"
              >
                <div className="text-[10px] uppercase text-zinc-500">{weekday}</div>
                <div className="text-sm font-semibold">{dayNum}</div>
              </div>
            )
          })}
        </div>

        <div
          className="grid border-b border-zinc-800"
          style={{ gridTemplateColumns: `56px repeat(7, minmax(0,1fr))` }}
        >
          <div className="p-1" />
          {weekDays.map((day) => {
            const uns = unslottedTasks(day)
            return (
              <div
                key={`u-${day}`}
                className="flex min-h-[2rem] flex-wrap content-start gap-1 border-l border-zinc-800 p-1"
              >
                {uns.length === 0 ? (
                  <span className="text-[10px] text-zinc-700">—</span>
                ) : (
                  uns.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      disabled={!canEdit}
                      title={task.title}
                      className="max-w-full truncate rounded bg-zinc-800/90 px-1.5 py-0.5 text-left text-[10px] text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
                      onClick={() => onTaskClick(task.id, day)}
                    >
                      {task.title}
                    </button>
                  ))
                )}
              </div>
            )
          })}
        </div>

        <div className="flex max-h-[min(70vh,900px)]">
          <div className="sticky left-0 z-10 w-14 shrink-0 border-r border-zinc-800 bg-zinc-950 pr-1">
            <div style={{ height: gridHeight }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT_PX }}
                  className="border-t border-zinc-800/60 text-[10px] leading-none text-zinc-600"
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          <div
            className="grid flex-1"
            style={{ gridTemplateColumns: `repeat(7, minmax(0,1fr))` }}
          >
            {weekDays.map((day) => {
              const slotted = slottedTasks(day)
              return (
                <div
                  key={day}
                  className="relative border-l border-zinc-800"
                  style={{ height: gridHeight }}
                >
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute left-0 right-0 border-t border-zinc-800/40"
                      style={{ top: h * HOUR_HEIGHT_PX }}
                    />
                  ))}
                  {slotted.map((task) => {
                    const slot = getTaskSlotMinutes(task, day)
                    if (!slot) return null
                    const top = (slot.start / 60) * HOUR_HEIGHT_PX
                    const height = Math.max(
                      ((slot.end - slot.start) / 60) * HOUR_HEIGHT_PX,
                      18,
                    )
                    const accent = TASK_COLOR_HEX[task.colorKey] ?? TASK_COLOR_HEX.zinc
                    return (
                      <button
                        key={task.id}
                        type="button"
                        disabled={!canEdit}
                        title={`${task.title} · ${priorityLabels[task.priorityRank]}`}
                        className="absolute left-0.5 right-0.5 overflow-hidden rounded border border-zinc-700/80 bg-zinc-900/95 px-1 py-0.5 text-left text-[10px] leading-tight text-zinc-100 shadow-sm hover:bg-zinc-800 disabled:opacity-40 border-l-[3px]"
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
        </div>
      </div>
      <p className="mt-2 shrink-0 border-t border-zinc-800 pt-2 text-[10px] leading-snug text-zinc-600">
        {t('app.weekGridHint')}
      </p>
    </div>
  )
}
