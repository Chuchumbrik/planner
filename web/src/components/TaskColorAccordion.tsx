import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sanitizeColorTextInput } from '@/lib/fieldSanitize'
import {
  FIELD_LABEL,
  MOTIVATOR_INPUT,
  PLAN_ACCORDION,
  PLAN_ACCORDION_SUMMARY,
} from '@/lib/designClasses'
import type { TaskColorKey } from '@motivator/core'
import {
  TASK_COLOR_HEX,
  TASK_COLOR_KEYS,
  nearestTaskColorKey,
  parseColorInput,
} from '@motivator/core'

const RECENT_KEY = 'motivator_recent_task_colors'
const MAX_RECENT = 8

const SWATCH: Record<TaskColorKey, string> = {
  zinc: 'bg-zinc-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
}

function readRecents(): TaskColorKey[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is TaskColorKey =>
        typeof x === 'string' && TASK_COLOR_KEYS.includes(x as TaskColorKey),
      )
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

function pushRecent(key: TaskColorKey): TaskColorKey[] {
  const prev = readRecents().filter((k) => k !== key)
  const next = [key, ...prev].slice(0, MAX_RECENT)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  }
  return next
}

function orderedSwatchKeys(recents: TaskColorKey[]): TaskColorKey[] {
  const seen = new Set<TaskColorKey>()
  const out: TaskColorKey[] = []
  for (const k of recents) {
    if (!seen.has(k)) {
      seen.add(k)
      out.push(k)
    }
  }
  for (const k of TASK_COLOR_KEYS) {
    if (!seen.has(k)) {
      seen.add(k)
      out.push(k)
    }
  }
  return out
}

export type TaskColorAccordionProps = {
  colorKey: TaskColorKey
  colorHexInput: string
  canEdit: boolean
  onPickKey: (key: TaskColorKey) => void
  onHexInputChange: (raw: string) => void
  onNativePick: (hex: string) => void
}

export function TaskColorAccordion({
  colorKey,
  colorHexInput,
  canEdit,
  onPickKey,
  onHexInputChange,
  onNativePick,
}: TaskColorAccordionProps) {
  const { t } = useTranslation()
  const [recentKeys, setRecentKeys] = useState<TaskColorKey[]>(() => readRecents())

  const orderedKeys = useMemo(() => orderedSwatchKeys(recentKeys), [recentKeys])

  const nativePickerHex = useMemo(() => {
    const rgb = parseColorInput(colorHexInput)
    if (rgb) {
      const h = (n: number) => n.toString(16).padStart(2, '0')
      return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`
    }
    return TASK_COLOR_HEX[colorKey]
  }, [colorHexInput, colorKey])

  function handlePickKey(key: TaskColorKey) {
    setRecentKeys(pushRecent(key))
    onPickKey(key)
  }

  function handleNative(hex: string) {
    const rgb = parseColorInput(hex)
    if (!rgb) return
    setRecentKeys(pushRecent(nearestTaskColorKey(rgb)))
    onNativePick(hex)
  }

  function handleHexBlur() {
    const rgb = parseColorInput(colorHexInput)
    if (rgb) setRecentKeys(pushRecent(nearestTaskColorKey(rgb)))
  }

  return (
    <details className={PLAN_ACCORDION}>
      <summary className={PLAN_ACCORDION_SUMMARY}>
        <span className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 h-5 w-5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-surface-container-lowest ${SWATCH[colorKey]}`}
            aria-hidden
          />
          <span className="flex min-w-0 flex-col gap-0.5 text-left">
            <span className="font-display text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {t('app.color')}
            </span>
            <span className="truncate text-sm text-on-surface">
              {t(`app.colorName.${colorKey}`)}
            </span>
          </span>
        </span>
        <span
          className="plan-accordion-chevron mt-1 shrink-0 text-on-surface-variant transition-transform duration-150 ease-out group-open:text-primary"
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

      <div className="border-t border-surface-variant px-3 pb-3 pt-3">
        <p className={`mb-2 ${FIELD_LABEL}`}>{t('app.colorSwatchesHint')}</p>
        <div className="flex flex-wrap gap-2">
          {orderedKeys.map((key) => (
            <button
              key={key}
              type="button"
              disabled={!canEdit}
              title={t(`app.colorName.${key}`)}
              className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface-container-lowest disabled:opacity-40 ${SWATCH[key]} ${
                colorKey === key ? 'ring-primary' : 'ring-transparent hover:ring-outline-variant'
              }`}
              onClick={() => handlePickKey(key)}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className={`flex min-w-[10rem] flex-1 flex-col gap-1 ${FIELD_LABEL}`}>
            <span>{t('app.colorHexInput')}</span>
            <input
              type="text"
              className={`${MOTIVATOR_INPUT} text-base placeholder:text-on-surface-variant sm:text-sm`}
              placeholder="#RRGGBB · rgb(…)"
              value={colorHexInput}
              disabled={!canEdit}
              onChange={(e) =>
                onHexInputChange(sanitizeColorTextInput(e.target.value))
              }
              onBlur={() => handleHexBlur()}
            />
          </label>
          <label className={`flex flex-col gap-1 ${FIELD_LABEL}`}>
            <span>{t('app.colorPickerNative')}</span>
            <input
              type="color"
              className="h-[38px] w-14 cursor-pointer rounded-lg border border-surface-variant bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
              value={nativePickerHex}
              disabled={!canEdit}
              title={t('app.colorPickerNative')}
              onChange={(e) => handleNative(e.target.value)}
            />
          </label>
        </div>
        <p className="mt-2 text-xs leading-snug text-on-surface-variant">
          {t('app.colorHexHint', { name: t(`app.colorName.${colorKey}`) })}
        </p>
      </div>
    </details>
  )
}
