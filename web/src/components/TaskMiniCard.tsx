import type { TFunction } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  isMainTaskDoneForDay,
  TASK_COLOR_HEX,
  type PriorityLabels,
  type Task,
} from '@motivator/core'

function formatTimeSnippet(task: Task, t: TFunction): string | null {
  if (task.timeMode === 'none' || task.timeMinutesFromMidnight == null) return null
  const hours = Math.floor(task.timeMinutesFromMidnight / 60)
  const minutes = task.timeMinutesFromMidnight % 60
  const clockLabel = t('app.miniCardTimeHm', { hours, minutes })
  if (task.timeMode === 'start') return `${t('app.timeStartShort')} · ${clockLabel}`
  return `${t('app.timeEndShort')} · ${clockLabel}`
}

type Props = {
  task: Task
  priorityLabels: PriorityLabels
  canEdit: boolean
  /** День карточки (YYYY-MM-DD); для повторов нужен, чтобы отмечать вхождение за день */
  occurrenceDayKey?: string
  /** false — только просмотр состояния галочки (выполнение только для календарного «сегодня») */
  completionToggleAllowed?: boolean
  onToggle: () => void
  onOpen: () => void
  /** Отметка пунктов чек-листа с карточки (день / бэклог) */
  onToggleChecklistItem?: (itemId: string) => void
  /** DR-004: снять ожидание второго шага без выполнения */
  onClearDoubleConfirm?: () => void
  /**
   * Необязательный фон/рамка всей строки (вкладка «День», секция плана).
   * При ожидании DR-004 не применяется — приоритет у состояния двойного подтверждения.
   */
  planRowSurfaceClass?: string
}

export function TaskMiniCard({
  task,
  priorityLabels,
  canEdit,
  occurrenceDayKey,
  completionToggleAllowed = true,
  onToggle,
  onOpen,
  onToggleChecklistItem,
  onClearDoubleConfirm,
  planRowSurfaceClass,
}: Props) {
  const { t } = useTranslation()
  const leftAccent = TASK_COLOR_HEX[task.colorKey] ?? TASK_COLOR_HEX.zinc

  const mainDone =
    task.recurrence && occurrenceDayKey
      ? isMainTaskDoneForDay(task, occurrenceDayKey)
      : task.done

  const pendingHere =
    Boolean(occurrenceDayKey) &&
    task.doubleConfirmEnabled === true &&
    Boolean(task.doubleConfirmPending) &&
    task.doubleConfirmPending!.localDate === occurrenceDayKey

  const [nowTick, setNowTick] = useState(() => Date.now())
  useEffect(() => {
    if (!pendingHere) return
    const id = window.setInterval(() => setNowTick(Date.now()), 10_000)
    return () => window.clearInterval(id)
  }, [pendingHere])

  useEffect(() => {
    if (pendingHere) setNowTick(Date.now())
  }, [pendingHere, task.doubleConfirmPending?.confirmDeadlineIso])

  const deadlineMs = task.doubleConfirmPending?.confirmDeadlineIso
    ? Date.parse(task.doubleConfirmPending.confirmDeadlineIso)
    : NaN
  const minutesLeft =
    pendingHere && Number.isFinite(deadlineMs)
      ? Math.max(0, Math.ceil((deadlineMs - nowTick) / 60_000))
      : null

  const [flash, setFlash] = useState<'success' | 'soft' | null>(null)
  const prevPendingRef = useRef(false)

  useEffect(() => {
    const wasPending = prevPendingRef.current
    const pend = pendingHere
    if (wasPending && !pend && occurrenceDayKey) {
      if (mainDone) setFlash('success')
      else setFlash('soft')
      const tid = window.setTimeout(() => setFlash(null), 900)
      prevPendingRef.current = pend
      return () => window.clearTimeout(tid)
    }
    prevPendingRef.current = pend
    return undefined
  }, [pendingHere, mainDone, occurrenceDayKey])

  const blockCompleteMain =
    !mainDone &&
    task.checklist.length > 0 &&
    task.checklist.some((s) => !s.done)

  const timeSnip = formatTimeSnippet(task, t)

  const toggleDoneDisabled =
    !canEdit || blockCompleteMain || !completionToggleAllowed
  const toggleDoneTitle = blockCompleteMain
    ? t('app.completeParentAfterChecklist')
    : !completionToggleAllowed
      ? t('app.completionOnlyToday')
      : undefined

  const shellClass = [
    'rounded-lg border border-l-4 transition-colors',
    pendingHere
      ? 'animate-dc-pending border-amber-700/50 bg-zinc-900/60 ring-1 ring-amber-600/25'
      : planRowSurfaceClass ?? 'border-zinc-800 bg-zinc-900/60',
    flash === 'success' ? 'animate-task-done-success' : '',
    flash === 'soft' ? 'animate-task-soft-miss' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass} style={{ borderLeftColor: leftAccent }}>
      <div className="flex items-start gap-2 px-3 py-2">
        <label
          className={`shrink-0 pt-0.5 ${toggleDoneDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          title={toggleDoneTitle}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={mainDone}
            disabled={toggleDoneDisabled}
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
            className={`block text-sm ${mainDone ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}
          >
            {task.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
            <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-zinc-400">
              {priorityLabels[task.priorityRank]}
            </span>
            {task.recurrence ? (
              <span className="rounded bg-violet-950/60 px-1.5 py-0.5 text-violet-300/90">
                {t('app.recurrenceBadge')}
              </span>
            ) : null}
            {pendingHere ? (
              <span className="rounded bg-amber-950/70 px-1.5 py-0.5 text-amber-200/95">
                {t('app.doubleConfirmBadge')}
              </span>
            ) : null}
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
          {pendingHere && minutesLeft != null ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-amber-200/90">
              <span>
                {t('app.doubleConfirmTimeLeft', {
                  minutes: minutesLeft,
                })}
              </span>
              {canEdit && onClearDoubleConfirm ? (
                <button
                  type="button"
                  className="text-amber-300 underline hover:text-amber-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearDoubleConfirm()
                  }}
                >
                  {t('app.doubleConfirmCancelPending')}
                </button>
              ) : null}
            </div>
          ) : null}
        </button>
      </div>
      {task.checklist.length > 0 && onToggleChecklistItem ? (
        <ul className="border-t border-zinc-800/90 px-3 pb-2 pt-2">
          {task.checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-2 py-0.5">
              <input
                type="checkbox"
                checked={item.done}
                disabled={!canEdit || !completionToggleAllowed}
                title={
                  !completionToggleAllowed ? t('app.completionOnlyToday') : undefined
                }
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
