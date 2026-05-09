import { useTranslation } from 'react-i18next'
import { taskBorderClass } from '@/vault/colors'
import type { PriorityLabels, Task } from '@/vault/types'

function formatTimeSnippet(
  t: Task,
  modeLabelStart: string,
  modeLabelEnd: string,
): string | null {
  if (t.timeMode === 'none' || t.timeMinutesFromMidnight == null) return null
  const h = Math.floor(t.timeMinutesFromMidnight / 60)
  const m = t.timeMinutesFromMidnight % 60
  const clock = `${h}:${String(m).padStart(2, '0')}`
  if (t.timeMode === 'start') return `${modeLabelStart} ${clock}`
  return `${modeLabelEnd} ${clock}`
}

type Props = {
  task: Task
  priorityLabels: PriorityLabels
  canEdit: boolean
  onToggle: () => void
  onOpen: () => void
  /** Отметка пунктов чек-листа с карточки (день / бэклог) */
  onToggleChecklistItem?: (itemId: string) => void
}

export function TaskMiniCard({
  task,
  priorityLabels,
  canEdit,
  onToggle,
  onOpen,
  onToggleChecklistItem,
}: Props) {
  const { t } = useTranslation()
  const borderClass = taskBorderClass(task.colorKey)

  const blockCompleteMain =
    !task.done &&
    task.checklist.length > 0 &&
    task.checklist.some((s) => !s.done)

  const timeSnip = formatTimeSnippet(
    task,
    t('app.timeStartShort'),
    t('app.timeEndShort'),
  )

  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-900/60 ${borderClass} border-l-4`}
    >
      <div className="flex items-start gap-2 px-3 py-2">
        <label
          className={`shrink-0 cursor-pointer pt-0.5 ${blockCompleteMain && canEdit ? 'cursor-not-allowed' : ''}`}
          title={blockCompleteMain ? t('app.completeParentAfterChecklist') : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={task.done}
            disabled={!canEdit || blockCompleteMain}
            onChange={() => onToggle()}
            aria-label={t('app.toggleTaskDone')}
            className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-emerald-500 disabled:opacity-40"
          />
        </label>
        <button
          type="button"
          disabled={!canEdit}
          className="min-w-0 flex-1 text-left disabled:opacity-50"
          onClick={() => canEdit && onOpen()}
        >
          <span
            className={`block text-sm ${task.done ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}
          >
            {task.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
            <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-zinc-400">
              {priorityLabels[task.priorityRank]}
            </span>
            {task.estimatedMinutes != null ? (
              <span>
                {t('app.estimatedMinutesShort', { n: task.estimatedMinutes })}
              </span>
            ) : null}
            {timeSnip ? <span>{timeSnip}</span> : null}
            {task.checklist.length > 0 ? (
              <span>
                {t('app.checklistProgress', {
                  done: task.checklist.filter((c) => c.done).length,
                  total: task.checklist.length,
                })}
              </span>
            ) : null}
          </span>
        </button>
      </div>
      {task.checklist.length > 0 && onToggleChecklistItem ? (
        <ul className="border-t border-zinc-800/90 px-3 pb-2 pt-2">
          {task.checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-2 py-0.5">
              <input
                type="checkbox"
                checked={item.done}
                disabled={!canEdit}
                onChange={() => onToggleChecklistItem(item.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={item.title}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-900 text-emerald-500 disabled:opacity-40"
              />
              <span
                className={`min-w-0 flex-1 text-xs leading-snug ${
                  item.done ? 'text-zinc-500 line-through' : 'text-zinc-400'
                }`}
              >
                {item.title}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
