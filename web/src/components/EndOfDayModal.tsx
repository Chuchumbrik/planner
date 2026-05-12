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

const BACKLOG_PREVIEW = 6

export type EndOfDayModalProps = {
  open: boolean
  onClose: () => void
  ritualDateKey: string
  tasks: Task[]
  /** Уже отмечен завершённый ритуал за этот день */
  alreadyCompleted: boolean
  canEdit: boolean
  onCompleteRitual: () => void | Promise<void>
  /** `report` — только просмотр сводки за выбранную дату (без завершения ритуала). */
  mode?: 'ritual' | 'report'
}

function TaskLine({ task }: { task: Task }) {
  return (
    <li className="rounded-md border border-zinc-800/80 bg-zinc-950/40 px-2 py-1.5 text-sm text-zinc-200">
      <span className="text-zinc-500">{task.priorityRank}</span>{' '}
      <span className="font-medium">{task.title}</span>
    </li>
  )
}

/** Круговая диаграмма: сумма долей по задачам (чек-лист даёт долю внутри одной задачи). */
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
            <span className="text-base font-semibold tabular-nums leading-none text-zinc-100">
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
      className="fixed inset-0 z-[75] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="eod-modal-title"
        className="scrollbar-site max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-600 bg-zinc-950 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="eod-modal-title" className="text-base font-semibold text-zinc-100">
              {isReport ? t('eod.reportTitle') : t('eod.title')}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">{t('eod.dateLabel', { date: ritualDateKey })}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              {isReport ? t('eod.reportIntro') : t('eod.intro')}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded px-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        {alreadyCompleted ? (
          <p className="mt-4 rounded-lg border border-emerald-800/50 bg-emerald-950/25 px-3 py-2 text-sm text-emerald-200/95">
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{t('eod.chartTitle')}</p>
          <EodPlanDonut progress={plannedWeights} pctLabels={eodPctLabels} />
          {plannedWeights.plannedTaskCount === 0 ? (
            <p className="max-w-[16rem] text-center text-xs leading-relaxed text-zinc-400">
              {t('eod.chartEmptyPlan')}
            </p>
          ) : null}
        </div>

        <section className="animate-eod-pop mt-5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
            {t('eod.sectionPlanDone', { count: completed.length })}
          </h3>
          {completed.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">{t('eod.emptyDone')}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {completed.map((task) => (
                <TaskLine key={task.id} task={task} />
              ))}
            </ul>
          )}
        </section>

        <section
          className={`mt-4 rounded-lg border p-3 ${
            remainingClear
              ? 'animate-eod-pop border-emerald-900/40 bg-emerald-950/20'
              : 'animate-eod-soft border-amber-900/35 bg-amber-950/15'
          }`}
        >
          <h3
            className={`text-xs font-semibold uppercase tracking-wide ${
              remainingClear ? 'text-emerald-400/90' : 'text-amber-400/85'
            }`}
          >
            {t('eod.sectionPlanRemaining', { count: remaining.length })}
          </h3>
          {remaining.length === 0 ? (
            <p className={`mt-2 text-sm ${remainingClear ? 'text-emerald-200/85' : 'text-zinc-500'}`}>
              {t('eod.emptyRemaining')}
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {remaining.map((task) => (
                <TaskLine key={task.id} task={task} />
              ))}
            </ul>
          )}
        </section>

        {backlogReminder.length > 0 ? (
          <section className="mt-4 rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {t('eod.sectionBacklog')} ({backlogReminder.length})
            </h3>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{t('eod.backlogIntro')}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {backlogShown.map((task) => (
                <TaskLine key={task.id} task={task} />
              ))}
            </ul>
            {backlogMoreCount > 0 ? (
              <p className="mt-2 text-[11px] text-zinc-500">{t('eod.backlogMore', { count: backlogMoreCount })}</p>
            ) : null}
          </section>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 pt-4">
          <button
            type="button"
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
          {!isReport && !alreadyCompleted ? (
            <button
              type="button"
              disabled={!canEdit}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-500 disabled:opacity-40"
              onClick={() => {
                void (async () => {
                  await onCompleteRitual()
                  onClose()
                })()
              }}
            >
              {t('eod.finishRitual')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
