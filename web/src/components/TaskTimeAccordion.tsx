import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { minutesToTimeInput, timeInputToMinutes, type TaskTimeMode } from '@motivator/core'

export type TaskTimeAccordionProps = {
  timeMode: TaskTimeMode
  /** Значение часов:минут (формат `HH:mm`) при `timeMode !== 'none'` */
  timeClock: string
  canEdit: boolean
  radioName: string
  onModeNone: () => void
  onModeStart: () => void
  onModeEnd: () => void
  onClockChange: (value: string) => void
  onClockBlur?: () => void
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i)
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i)

const selectClass =
  'w-full min-w-[5rem] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40'

function clockParts(clock: string): { h: number; min: number } {
  const m = timeInputToMinutes(clock.trim() || '09:00') ?? 9 * 60
  return { h: Math.floor(m / 60), min: m % 60 }
}

export function TaskTimeAccordion({
  timeMode,
  timeClock,
  canEdit,
  radioName,
  onModeNone,
  onModeStart,
  onModeEnd,
  onClockChange,
  onClockBlur,
}: TaskTimeAccordionProps) {
  const { t } = useTranslation()

  const summaryPreview = useMemo(() => {
    if (timeMode === 'none') return t('app.timeNone')
    const clock = timeClock.trim() || '—'
    if (timeMode === 'start') return `${t('app.timeStart')} · ${clock}`
    return `${t('app.timeEnd')} · ${clock}`
  }, [timeMode, timeClock, t])

  const { h: hourVal, min: minuteVal } =
    timeMode === 'none' ? { h: 9, min: 0 } : clockParts(timeClock)

  function handleHourChange(nextH: number) {
    const cur = timeInputToMinutes(timeClock.trim()) ?? hourVal * 60 + minuteVal
    const keptMin = cur % 60
    onClockChange(minutesToTimeInput(nextH * 60 + keptMin))
  }

  function handleMinuteChange(nextMin: number) {
    const cur = timeInputToMinutes(timeClock.trim()) ?? hourVal * 60 + minuteVal
    const keptH = Math.floor(cur / 60)
    onClockChange(minutesToTimeInput(keptH * 60 + nextMin))
  }

  return (
    <details className="plan-accordion group mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 open:border-zinc-700/90">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-zinc-900/80 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-col gap-0.5 text-left">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t('app.timeSection')}
          </span>
          <span className="truncate text-sm text-zinc-200">{summaryPreview}</span>
        </span>
        <span
          className="plan-accordion-chevron shrink-0 text-zinc-500 transition-transform duration-150 ease-out group-open:text-zinc-400"
          aria-hidden
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </summary>

      <div className="border-t border-zinc-800/90 px-3 pb-3 pt-3">
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="radio"
              name={radioName}
              checked={timeMode === 'none'}
              disabled={!canEdit}
              onChange={onModeNone}
            />
            {t('app.timeNone')}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="radio"
              name={radioName}
              checked={timeMode === 'start'}
              disabled={!canEdit}
              onChange={onModeStart}
            />
            {t('app.timeStart')}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="radio"
              name={radioName}
              checked={timeMode === 'end'}
              disabled={!canEdit}
              onChange={onModeEnd}
            />
            {t('app.timeEnd')}
          </label>
        </div>

        <div
          className="mt-3 flex flex-wrap items-end gap-3"
          style={{ colorScheme: 'dark' }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              onClockBlur?.()
            }
          }}
        >
          <label className="flex min-w-[6rem] flex-1 flex-col gap-1 text-xs text-zinc-500">
            <span>{t('app.estimatedHours')}</span>
            <select
              aria-label={`${t('app.timeClock')} · ${t('app.estimatedHours')}`}
              className={selectClass}
              disabled={!canEdit || timeMode === 'none'}
              value={hourVal}
              onChange={(e) => handleHourChange(Number(e.target.value))}
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[6rem] flex-1 flex-col gap-1 text-xs text-zinc-500">
            <span>{t('app.estimatedMinutesPart')}</span>
            <select
              aria-label={`${t('app.timeClock')} · ${t('app.estimatedMinutesPart')}`}
              className={selectClass}
              disabled={!canEdit || timeMode === 'none'}
              value={minuteVal}
              onChange={(e) => handleMinuteChange(Number(e.target.value))}
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </details>
  )
}
