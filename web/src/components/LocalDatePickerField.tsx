import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 280 })

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
      <div className="flex flex-col gap-1 text-xs text-zinc-500">
        <span>{label}</span>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-left text-sm outline-none ring-emerald-500/30 hover:bg-zinc-800 focus-visible:ring-2 disabled:opacity-40"
          onClick={() => {
            if (disabled) return
            setOpen((o) => !o)
          }}
        >
          <span className={value ? 'text-zinc-100' : 'text-zinc-500'}>
            {value ? formatDateShort(value, locale) : t('app.datePickerPlaceholder')}
          </span>
          <span className="shrink-0 text-zinc-500" aria-hidden>
            ▾
          </span>
        </button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed z-[100] rounded-xl border border-zinc-700 bg-zinc-950 p-3 shadow-2xl ring-1 ring-black/50"
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
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={t('app.datePickerPrevMonth')}
              disabled={disablePrevMonth}
              onClick={() => shiftMonth(-1)}
            >
              ←
            </button>
            <span className="min-w-0 flex-1 truncate text-center text-xs font-medium text-zinc-200">
              {monthLabel(viewY, viewM, locale)}
            </span>
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
              aria-label={t('app.datePickerNextMonth')}
              onClick={() => shiftMonth(1)}
            >
              →
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-zinc-500">
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
                      className={`min-h-[2rem] rounded-lg border text-xs font-medium transition hover:bg-zinc-900 disabled:opacity-40 ${
                        selected
                          ? 'border-emerald-500 bg-emerald-950/70 text-emerald-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.45)]'
                          : isToday
                            ? 'border-zinc-500 bg-zinc-900/80 text-zinc-100'
                            : 'border-zinc-800 bg-zinc-950/50 text-zinc-300'
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
              className="mt-3 w-full rounded-lg border border-zinc-700 py-2 text-xs text-zinc-400 hover:bg-zinc-900"
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
