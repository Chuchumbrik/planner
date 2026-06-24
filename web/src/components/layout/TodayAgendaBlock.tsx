import { useTranslation } from 'react-i18next'
import { TASK_COLOR_HEX, type Task } from '@motivator/core'

type Props = {
  /** Уже отфильтрованные/отсортированные задачи на сегодня. */
  tasks: Task[]
  onTaskClick: (taskId: string) => void
  /** Сколько строк показывать до «… и ещё N». */
  max?: number
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Агенда сегодняшнего дня списком в левой панели планировщика (Phase 13, BR-D-010). */
export function TodayAgendaBlock({ tasks, onTaskClick, max = 5 }: Props) {
  const { t } = useTranslation()
  const visible = tasks.slice(0, max)
  const hidden = tasks.length - visible.length

  return (
    <section className="flex flex-col gap-2" aria-label={t('app.today')}>
      <h3 className="text-label-sm uppercase text-on-surface-variant">{t('app.today')}</h3>
      {tasks.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">{t('app.emptyPlannedDay')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {visible.map((task) => {
            const hasTime = task.timeMode !== 'none' && task.timeMinutesFromMidnight != null
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onTaskClick(task.id)}
                  className="flex w-full items-center gap-2 rounded-motivator-lg px-2 py-1.5 text-left hover:bg-surface-container-high"
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: TASK_COLOR_HEX[task.colorKey] ?? TASK_COLOR_HEX.zinc }}
                  />
                  <span
                    className={`min-w-0 flex-1 truncate text-body-sm ${
                      task.done ? 'text-on-surface-variant line-through' : 'text-on-surface'
                    }`}
                  >
                    {task.title}
                  </span>
                  {hasTime ? (
                    <span className="shrink-0 text-mono-data text-on-surface-variant">
                      {formatTime(task.timeMinutesFromMidnight as number)}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
          {hidden > 0 ? (
            <li className="px-2 py-1 text-label-sm text-on-surface-variant">
              {t('app.backlogMore', { count: hidden })}
            </li>
          ) : null}
        </ul>
      )}
    </section>
  )
}
