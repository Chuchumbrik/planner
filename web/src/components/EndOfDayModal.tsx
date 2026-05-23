import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  partitionEodTasksByCompletion,
  plannedDayCompletionWeights,
  type PlannedDayProgress,
  type Task,
} from '@motivator/core'
import { getPlanProgressLabels } from '@/components/PlanDayProgressCaption'
import { PlanProgressRing } from '@/components/PlanProgressRing'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  MODAL_CLOSE_BTN,
  MODAL_OVERLAY,
  MODAL_SHELL_WIDE,
  MODAL_TITLE,
  STAT_CARD,
  STAT_CARD_LABEL,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'

const BACKLOG_PREVIEW = 6

export type EndOfDayModalProps = {
  open: boolean
  onClose: () => void
  ritualDateKey: string
  tasks: Task[]
  alreadyCompleted: boolean
  canEdit: boolean
  onCompleteRitual: () => void | Promise<void>
  mode?: 'ritual' | 'report'
}

function EodTaskLine({ task, done }: { task: Task; done: boolean }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2',
        done
          ? 'border-primary/25 bg-primary/5'
          : 'border-surface-variant bg-surface-container-low/80',
      )}
    >
      <MaterialIcon
        name={done ? 'check_circle' : 'radio_button_unchecked'}
        size={18}
        filled={done}
        className={done ? 'text-primary' : 'text-on-surface-variant'}
      />
      <span className="shrink-0 font-mono text-xs text-on-surface-variant">{task.priorityRank}</span>
      <span
        className={cn(
          'min-w-0 flex-1 text-sm',
          done ? 'text-on-surface line-through' : 'text-on-surface',
        )}
      >
        {task.title}
      </span>
    </li>
  )
}

function EodPlanDonut({
  progress,
  pctLabels,
}: {
  progress: PlannedDayProgress
  pctLabels: ReturnType<typeof getPlanProgressLabels> | null
}) {
  const { t } = useTranslation()
  const empty = progress.plannedTaskCount === 0
  const frac = empty ? 0 : progress.doneFraction / progress.plannedTaskCount
  return (
    <div className="flex flex-col items-center">
      <PlanProgressRing
        frac={frac}
        empty={empty}
        size={112}
        stroke={10}
        centerLabel={
          pctLabels ? (
            <span className="text-base font-semibold tabular-nums leading-none text-on-surface">
              {t('eod.chartPercentLine', { pct: pctLabels.pctStr })}
            </span>
          ) : undefined
        }
      />
    </div>
  )
}

export function EndOfDayModal({
  open,
  onClose,
  ritualDateKey,
  tasks,
  alreadyCompleted,
  canEdit,
  onCompleteRitual,
  mode = 'ritual',
}: EndOfDayModalProps) {
  const { t, i18n } = useTranslation()
  const isReport = mode === 'report'
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'

  const { completed, remaining, backlogReminder } = useMemo(
    () => partitionEodTasksByCompletion(tasks, ritualDateKey),
    [tasks, ritualDateKey],
  )

  const plannedWeights = useMemo(() => {
    const planned = [...completed, ...remaining]
    return plannedDayCompletionWeights(planned, ritualDateKey)
  }, [completed, remaining, ritualDateKey])

  const backlogShown = backlogReminder.slice(0, BACKLOG_PREVIEW)
  const backlogMoreCount = Math.max(0, backlogReminder.length - backlogShown.length)
  const remainingClear = remaining.length === 0

  const eodPctLabels =
    plannedWeights.plannedTaskCount === 0
      ? null
      : getPlanProgressLabels(plannedWeights, locale)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={cn(MODAL_OVERLAY, 'z-[75] items-end p-3 sm:items-center sm:p-6')}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="eod-modal-title"
        className={cn(MODAL_SHELL_WIDE, 'max-h-[92vh]')}
        onClick={(e) => e.stopPropagation()}
      >
        <aside
          className="eod-modal-panel-accent relative hidden w-[38%] shrink-0 flex-col justify-end overflow-hidden p-6 md:flex"
          aria-hidden
        >
          <MaterialIcon
            name="nightlight"
            className="absolute right-4 top-6 text-primary/20"
            size={64}
          />
          <p className="font-display text-xs uppercase tracking-widest text-primary">
            {t('eod.panelStatusLabel')}
          </p>
          <p className="mt-2 font-display text-lg font-semibold text-on-surface">
            {t('eod.panelStatusTitle')}
          </p>
        </aside>

        <div className="scrollbar-site flex min-h-0 min-w-0 flex-1 flex-col p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="eod-modal-title"
                className={cn(MODAL_TITLE, 'text-headline-md md:text-headline-lg')}
              >
                {isReport ? t('eod.reportTitle') : t('eod.title')}
              </h2>
              <p className="mt-1 font-mono text-xs text-on-surface-variant">
                {t('eod.dateLabel', { date: ritualDateKey })}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {isReport ? t('eod.reportIntro') : t('eod.intro')}
              </p>
            </div>
            <button
              type="button"
              className={cn('shrink-0 rounded-lg p-2 active:scale-95', MODAL_CLOSE_BTN)}
              onClick={onClose}
              aria-label={t('common.close')}
            >
              <MaterialIcon name="close" size={22} />
            </button>
          </div>

          {alreadyCompleted ? (
            <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              {isReport ? t('eod.reportAlreadyDone') : t('eod.alreadyDone')}
            </p>
          ) : null}

          <div
            className="mt-5 flex flex-col items-center gap-1"
            role="img"
            aria-label={
              plannedWeights.plannedTaskCount === 0
                ? t('eod.chartEmptyPlan')
                : t('eod.chartAriaProgress', {
                    ...getPlanProgressLabels(plannedWeights, locale),
                  })
            }
          >
            <p className="font-display text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
              {t('eod.chartTitle')}
            </p>
            <EodPlanDonut progress={plannedWeights} pctLabels={eodPctLabels} />
            {plannedWeights.plannedTaskCount === 0 ? (
              <p className="max-w-[16rem] text-center text-xs leading-relaxed text-on-surface-variant">
                {t('eod.chartEmptyPlan')}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className={STAT_CARD}>
              <p className={STAT_CARD_LABEL}>{t('eod.statCompleted')}</p>
              <p className="mt-1 text-headline-md font-display font-bold text-on-surface tabular-nums">
                {completed.length} / {completed.length + remaining.length}
              </p>
            </div>
            <div className={STAT_CARD}>
              <p className={STAT_CARD_LABEL}>{t('eod.statRemaining')}</p>
              <p className="mt-1 text-headline-md font-display font-bold text-on-surface tabular-nums">
                {remaining.length}
              </p>
            </div>
          </div>

          <section className="animate-eod-pop mt-5 rounded-card border border-primary/30 bg-primary/5 p-sm">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-primary">
              {t('eod.sectionPlanDone', { count: completed.length })}
            </h3>
            {completed.length === 0 ? (
              <p className="mt-2 text-sm text-on-surface-variant">{t('eod.emptyDone')}</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {completed.map((task) => (
                  <EodTaskLine key={task.id} task={task} done />
                ))}
              </ul>
            )}
          </section>

          <section
            className={cn(
              'mt-4 rounded-card border p-sm',
              remainingClear
                ? 'animate-eod-pop border-primary/30 bg-primary/5'
                : 'animate-eod-soft border-tertiary-container/35 bg-tertiary-container/5',
            )}
          >
            <h3
              className={cn(
                'font-display text-xs font-semibold uppercase tracking-wider',
                remainingClear ? 'text-primary' : 'text-tertiary',
              )}
            >
              {t('eod.sectionPlanRemaining', { count: remaining.length })}
            </h3>
            {remaining.length === 0 ? (
              <p
                className={cn(
                  'mt-2 text-sm',
                  remainingClear ? 'text-primary' : 'text-on-surface-variant',
                )}
              >
                {t('eod.emptyRemaining')}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {remaining.map((task) => (
                  <EodTaskLine key={task.id} task={task} done={false} />
                ))}
              </ul>
            )}
          </section>

          {backlogReminder.length > 0 ? (
            <section className="mt-4 rounded-card border border-surface-variant bg-surface-container-low/80 p-sm">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {t('eod.sectionBacklog')} ({backlogReminder.length})
              </h3>
              <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">
                {t('eod.backlogIntro')}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {backlogShown.map((task) => (
                  <EodTaskLine key={task.id} task={task} done={false} />
                ))}
              </ul>
              {backlogMoreCount > 0 ? (
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  {t('eod.backlogMore', { count: backlogMoreCount })}
                </p>
              ) : null}
            </section>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-surface-variant pt-4">
            <button type="button" className="btn-secondary px-4 py-2" onClick={onClose}>
              {t('common.close')}
            </button>
            {!isReport && !alreadyCompleted ? (
              <button
                type="button"
                disabled={!canEdit}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 disabled:opacity-40"
                onClick={() => {
                  void (async () => {
                    await onCompleteRitual()
                    onClose()
                  })()
                }}
              >
                {t('eod.finishRitual')}
                <MaterialIcon name="auto_awesome" size={18} className="text-on-primary" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
