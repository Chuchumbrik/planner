import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MOTIVATOR_INPUT } from '@/lib/designClasses'
import { useDialogFocusTrap } from '@/lib/useDialogFocusTrap'
import { localDateKey, monthLabel, monthWeekMatrix, parseLocalDateKey } from '@motivator/core'

function formatDateShort(dateKey: string, locale: string): string {
  const dt = parseLocalDateKey(dateKey)
  if (!dt) return dateKey
  try {
    return dt.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateKey
  }
}

export type LocalDatePickerFieldProps = {
  label: string
  /** YYYY-MM-DD или null */
  value: string | null
  onChange: (dateKey: string | null) => void
  disabled?: boolean
  /** Не раньше этой даты (YYYY-MM-DD, локальный календарь). Сравнение строковое — формат ISO. */
  minLocalDateKey?: string | null
  /** Кнопка «без даты» внутри панели */
  allowClear?: boolean
  className?: string
}

export function LocalDatePickerField({
  label,
  value,
  onChange,
  disabled,
  minLocalDateKey,
  allowClear,
  className,
}: LocalDatePickerFieldProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 280 })

  useDialogFocusTrap(open, panelRef)

  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())

  useEffect(() => {
    if (!open) return
    if (value) {
      const d = parseLocalDateKey(value)
      if (d) {
        setViewY(d.getFullYear())
        setViewM(d.getMonth())
        return
      }
    }
    const n = new Date()
    setViewY(n.getFullYear())
    setViewM(n.getMonth())
  }, [open, value])

  function updatePanelPosition() {
    const btn = triggerRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const w = Math.max(r.width, 260)
    let left = r.left
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8)
    setPanelPos({ top: r.bottom + 6, left, width: w })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPosition()
  }, [open])

  useEffect(() => {
    if (!open) return
    function handlePointer(ev: MouseEvent | TouchEvent) {
      const el = wrapRef.current
      if (!el || el.contains(ev.target as Node)) return
      setOpen(false)
    }
    function onScrollResize() {
      updatePanelPosition()
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('touchstart', handlePointer)
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('touchstart', handlePointer)
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const matrix = useMemo(() => monthWeekMatrix(viewY, viewM), [viewY, viewM])
  const todayKey = localDateKey()

  const lastDayOfPreviousMonthKey = useMemo(
    () => localDateKey(new Date(viewY, viewM, 0)),
    [viewY, viewM],
  )
  const minKey =
    minLocalDateKey && /^\d{4}-\d{2}-\d{2}$/.test(minLocalDateKey) ? minLocalDateKey : null
  const disablePrevMonth = minKey != null && lastDayOfPreviousMonthKey < minKey

  const weekDayLabels = useMemo(() => {
    const base = new Date(2024, 0, 1)
    const monday = new Date(base)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      try {
        return d.toLocaleDateString(locale, { weekday: 'narrow' })
      } catch {
        return ''
      }
    })
  }, [locale])

  function shiftMonth(delta: number) {
    const d = new Date(viewY, viewM + delta, 1)
    setViewY(d.getFullYear())
    setViewM(d.getMonth())
  }

  return (
    <div ref={wrapRef} className={`relative ${className ?? ''}`}>
      <div className="flex flex-col gap-1 text-xs text-on-surface-variant">
        <span>{label}</span>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`${MOTIVATOR_INPUT} flex w-full items-center justify-between gap-2 text-left outline-none ring-primary/30 focus-visible:ring-2`}
          onClick={() => {
            if (disabled) return
            setOpen((o) => !o)
          }}
        >
          <span className={value ? 'text-on-surface' : 'text-on-surface-variant'}>
            {value ? formatDateShort(value, locale) : t('app.datePickerPlaceholder')}
          </span>
          <span className="shrink-0 text-on-surface-variant" aria-hidden>
            ▾
          </span>
        </button>
      </div>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={monthLabel(viewY, viewM, locale)}
          className="fixed z-[100] rounded-xl border border-surface-variant bg-surface-container-lowest p-3 shadow-2xl ring-1 ring-black/50"
          style={{
            top: panelPos.top,
            left: panelPos.left,
            width: panelPos.width,
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded-lg border border-surface-variant px-2 py-1 text-xs text-on-surface hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={t('app.datePickerPrevMonth')}
              disabled={disablePrevMonth}
              onClick={() => shiftMonth(-1)}
            >
              ←
            </button>
            <span className="min-w-0 flex-1 truncate text-center font-display text-xs font-medium text-on-surface">
              {monthLabel(viewY, viewM, locale)}
            </span>
            <button
              type="button"
              className="rounded-lg border border-surface-variant px-2 py-1 text-xs text-on-surface hover:bg-surface-container"
              aria-label={t('app.datePickerNextMonth')}
              onClick={() => shiftMonth(1)}
            >
              →
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center font-display text-[10px] uppercase tracking-wide text-on-surface-variant">
            {weekDayLabels.map((wd, i) => (
              <div key={i}>{wd}</div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            {matrix.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-1">
                {row.map((cell, ci) => {
                  if ('pad' in cell) {
                    return <div key={`p-${ri}-${ci}`} className="min-h-[2rem]" />
                  }
                  const { dateKey } = cell
                  const selected = value === dateKey
                  const isToday = dateKey === todayKey
                  const dayNum = Number(dateKey.slice(8, 10))
                  const beforeMin = minKey != null && dateKey < minKey
                  const dayDisabled = Boolean(disabled || (beforeMin && !selected))
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={dayDisabled}
                      className={`min-h-[2rem] rounded-lg border text-xs font-medium transition hover:bg-surface-container disabled:opacity-40 ${
                        selected
                          ? 'border-primary bg-primary/20 text-primary shadow-[inset_0_0_0_1px_rgba(78,222,163,0.45)]'
                          : isToday
                            ? 'border-surface-variant bg-surface-container-high text-on-surface'
                            : 'border-surface-variant bg-surface-container-low text-on-surface-variant'
                      }`}
                      onClick={() => {
                        onChange(dateKey)
                        setOpen(false)
                      }}
                    >
                      {dayNum}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {allowClear ? (
            <button
              type="button"
              className="btn-secondary mt-3 w-full py-2 text-xs"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              {t('app.datePickerClear')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
