import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { TaskTimeMode } from '@motivator/core'

export type TaskTimeAccordionProps = {
  timeMode: TaskTimeMode
  /** Значение для `<input type="time">` при `timeMode !== 'none'` */
  timeClock: string
  canEdit: boolean
  radioName: string
  onModeNone: () => void
  onModeStart: () => void
  onModeEnd: () => void
  onClockChange: (value: string) => void
  onClockBlur?: () => void
}

function openNativeTimePicker(el: HTMLInputElement | null) {
  if (!el) return
  try {
    if (typeof el.showPicker === 'function') {
      el.showPicker()
      return
    }
  } catch {
    /* Safari / старые браузеры */
  }
  el.focus()
  el.click()
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
  const timeInputRef = useRef<HTMLInputElement>(null)

  const summaryPreview = useMemo(() => {
    if (timeMode === 'none') return t('app.timeNone')
    const clock = timeClock.trim() || '—'
    if (timeMode === 'start') return `${t('app.timeStart')} · ${clock}`
    return `${t('app.timeEnd')} · ${clock}`
  }, [timeMode, timeClock, t])

  function handleFieldShellClick(e: React.MouseEvent<HTMLDivElement>) {
    if (timeMode === 'none' || !canEdit) return
    const target = e.target as HTMLElement
    if (target.closest('input[type="time"]')) return
    openNativeTimePicker(timeInputRef.current)
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

        <label className="mt-3 flex flex-col gap-1 text-xs text-zinc-500">
          <span>{t('app.timeClock')}</span>
          <div
            className={`rounded-lg border border-zinc-700 bg-zinc-900 p-1 ${
              timeMode !== 'none' && canEdit
                ? 'cursor-pointer hover:border-zinc-600'
                : ''
            }`}
            onClick={handleFieldShellClick}
          >
            <input
              ref={timeInputRef}
              type="time"
              className="w-full cursor-pointer rounded-md border-0 bg-transparent px-2 py-2 text-base text-white outline-none ring-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canEdit || timeMode === 'none'}
              value={timeMode === 'none' ? '' : timeClock}
              onChange={(e) => onClockChange(e.target.value)}
              onBlur={() => onClockBlur?.()}
              onClick={(e) => {
                e.stopPropagation()
                openNativeTimePicker(timeInputRef.current)
              }}
            />
          </div>
        </label>
      </div>
    </details>
  )
}
