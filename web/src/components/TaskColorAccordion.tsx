import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TaskColorKey } from '@/vault/types'
import {
  TASK_COLOR_HEX,
  TASK_COLOR_KEYS,
  nearestTaskColorKey,
  parseColorInput,
} from '@/vault/colors'

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
    <details className="task-color-disclosure mt-4 rounded-lg border border-zinc-800 bg-zinc-900/30 open:bg-zinc-900/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-zinc-200 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`h-5 w-5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-zinc-950 ${SWATCH[colorKey]}`}
            aria-hidden
          />
          <span className="truncate font-medium">{t('app.color')}</span>
          <span className="truncate text-zinc-500">
            · {t(`app.colorName.${colorKey}`)}
          </span>
        </span>
        <span
          className="task-color-disclosure-chevron shrink-0 text-zinc-500 transition-transform duration-150"
          aria-hidden
        >
          ▾
        </span>
      </summary>

      <div className="border-t border-zinc-800 px-3 pb-3 pt-2">
        <p className="mb-2 text-[11px] text-zinc-500">{t('app.colorSwatchesHint')}</p>
        <div className="flex flex-wrap gap-2">
          {orderedKeys.map((key) => (
            <button
              key={key}
              type="button"
              disabled={!canEdit}
              title={t(`app.colorName.${key}`)}
              className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-zinc-950 disabled:opacity-40 ${SWATCH[key]} ${
                colorKey === key ? 'ring-emerald-400' : 'ring-transparent hover:ring-zinc-600'
              }`}
              onClick={() => handlePickKey(key)}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs text-zinc-500">
            <span>{t('app.colorHexInput')}</span>
            <input
              type="text"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 disabled:opacity-40"
              placeholder="#RRGGBB · rgb(…)"
              value={colorHexInput}
              disabled={!canEdit}
              onChange={(e) => onHexInputChange(e.target.value)}
              onBlur={() => handleHexBlur()}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            <span>{t('app.colorPickerNative')}</span>
            <input
              type="color"
              className="h-[38px] w-14 cursor-pointer rounded border border-zinc-700 bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
              value={nativePickerHex}
              disabled={!canEdit}
              title={t('app.colorPickerNative')}
              onChange={(e) => handleNative(e.target.value)}
            />
          </label>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-zinc-600">
          {t('app.colorHexHint', { name: t(`app.colorName.${colorKey}`) })}
        </p>
      </div>
    </details>
  )
}
