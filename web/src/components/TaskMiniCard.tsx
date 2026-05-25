import type { TFunction } from 'i18next'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import {
  DC_PENDING_CHIP,
  DC_PENDING_SHELL,
  TASK_CARD_BODY,
  TASK_CARD_SHELL,
  TASK_CHECKBOX_CHECKLIST,
  TASK_CHECKBOX_MAIN,
  TASK_GROUP_CHIP,
  TASK_META_CHIP,
  TASK_OVERDUE_CHIP,
  TEXT_HINT_WARNING,
  TEXT_LINK_IN_HINT,
} from '@/lib/designClasses'
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

function formatClockOnly(task: Task): string | null {
  if (task.timeMode === 'none' || task.timeMinutesFromMidnight == null) return null
  const hours = Math.floor(task.timeMinutesFromMidnight / 60)
  const minutes = task.timeMinutesFromMidnight % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

type Props = {
  task: Task
  priorityLabels: PriorityLabels
  canEdit: boolean
  occurrenceDayKey?: string
  completionToggleAllowed?: boolean
  groupName?: string | null
  overdue?: boolean
  onToggle: () => void
  onOpen: () => void
  onToggleChecklistItem?: (itemId: string) => void
  onClearDoubleConfirm?: () => void
  planRowSurfaceClass?: string
  highlighted?: boolean
}

export function TaskMiniCard({
  task,
  priorityLabels,
  canEdit,
  occurrenceDayKey,
  completionToggleAllowed = true,
  groupName,
  overdue = false,
  onToggle,
  onOpen,
  onToggleChecklistItem,
  onClearDoubleConfirm,
  planRowSurfaceClass,
  highlighted = false,
}: Props) {
  const { t } = useTranslation()
  const checklistFieldId = useId()
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
  const clockOnly = formatClockOnly(task)

  const toggleDoneDisabled =
    !canEdit || blockCompleteMain || !completionToggleAllowed
  const toggleDoneTitle = blockCompleteMain
    ? t('app.completeParentAfterChecklist')
    : !completionToggleAllowed
      ? t('app.completionOnlyToday')
      : task.doubleConfirmEnabled
        ? t('app.doubleConfirmHintShort')
        : undefined

  const shellClass = cn(
    TASK_CARD_SHELL,
    pendingHere ? DC_PENDING_SHELL
      : (planRowSurfaceClass ??
          'border-surface-variant bg-surface-container-low hover:bg-surface-container'),
    flash === 'success' && 'animate-task-done-success',
    flash === 'soft' && 'animate-task-soft-miss',
    highlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
  )

  return (
    <div
      className={shellClass}
      data-task-id={task.id}
      style={{ borderLeftColor: leftAccent }}
    >
      <div className={TASK_CARD_BODY}>
        <label
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center md:h-6 md:w-6',
            toggleDoneDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
          title={toggleDoneTitle}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={mainDone}
            disabled={toggleDoneDisabled}
            onChange={() => onToggle()}
            aria-label={
              task.doubleConfirmEnabled && !mainDone
                ? t('app.doubleConfirmEnable')
                : t('app.toggleTaskDone')
            }
            className={TASK_CHECKBOX_MAIN}
          />
        </label>
        <button
          type="button"
          disabled={!canEdit}
          className="min-w-0 flex-1 text-left disabled:opacity-50"
          onClick={() => canEdit && onOpen()}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                'block text-body-sm font-semibold leading-snug',
                mainDone ? 'text-on-surface-variant line-through' : 'text-on-surface',
              )}
            >
              {task.title}
            </span>
            {clockOnly ? (
              <span className="shrink-0 text-mono-data text-on-surface-variant">
                {mainDone ? t('app.taskDoneShort') : clockOnly}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {groupName ? <span className={TASK_GROUP_CHIP}>{groupName}</span> : null}
            <span className={TASK_META_CHIP}>{priorityLabels[task.priorityRank]}</span>
            {task.recurrence ? (
              <span className={cn(TASK_META_CHIP, 'text-tertiary')}>{t('app.recurrenceBadge')}</span>
            ) : null}
            {overdue && !mainDone ? (
              <span className={TASK_OVERDUE_CHIP}>{t('app.taskOverdueBadge')}</span>
            ) : null}
            {pendingHere ? (
              <span className={DC_PENDING_CHIP}>
                {t('app.doubleConfirmBadge')}
              </span>
            ) : null}
            {task.estimatedMinutes != null ? (
              <span className={TASK_META_CHIP}>
                {t('app.estimatedMinutesShort', { n: task.estimatedMinutes })}
              </span>
            ) : null}
            {timeSnip && !clockOnly ? <span className={TASK_META_CHIP}>{timeSnip}</span> : null}
            {task.checklist.length > 0 ? (
              <span className={TASK_META_CHIP}>
                {t('app.checklistProgress', {
                  done: task.checklist.filter((c) => c.done).length,
                  total: task.checklist.length,
                })}
              </span>
            ) : null}
          </div>
          {pendingHere && minutesLeft != null ? (
            <div className={cn('mt-2 flex flex-wrap items-center gap-x-2 gap-y-1', TEXT_HINT_WARNING)}>
              <span>
                {t('app.doubleConfirmTimeLeft', {
                  minutes: minutesLeft,
                })}
              </span>
              {canEdit && onClearDoubleConfirm ? (
                <button
                  type="button"
                  className={TEXT_LINK_IN_HINT}
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
        <ul className="border-t border-surface-variant/80 px-sm pb-sm pt-2 md:px-md">
          {task.checklist.map((item) => {
            const cid = `${checklistFieldId}-${item.id}`
            return (
              <li key={item.id} className="border-l border-outline-variant/60 pl-3">
                <label
                  htmlFor={cid}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md py-1 pr-1 hover:bg-surface-container-high/50 md:min-h-8 md:gap-2 md:py-0.5',
                    (!canEdit || !completionToggleAllowed) &&
                      'cursor-default hover:bg-transparent',
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    id={cid}
                    type="checkbox"
                    checked={item.done}
                    disabled={!canEdit || !completionToggleAllowed}
                    title={
                      !completionToggleAllowed ? t('app.completionOnlyToday') : undefined
                    }
                    onChange={() => onToggleChecklistItem(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={item.title}
                    className={TASK_CHECKBOX_CHECKLIST}
                  />
                  <span
                    className={cn(
                      'min-w-0 flex-1 text-body-sm leading-snug',
                      item.done
                        ? 'text-on-surface-variant line-through'
                        : 'text-on-surface-variant',
                    )}
                  >
                    {item.title}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
