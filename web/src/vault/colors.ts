import type { TaskColorKey } from '@/vault/types'

/** Левая полоска задачи (Tailwind классы) */
export const TASK_LEFT_BORDER: Record<TaskColorKey, string> = {
  zinc: 'border-l-zinc-500',
  red: 'border-l-red-500',
  orange: 'border-l-orange-500',
  amber: 'border-l-amber-500',
  emerald: 'border-l-emerald-500',
  sky: 'border-l-sky-500',
  violet: 'border-l-violet-500',
  pink: 'border-l-pink-500',
}

export const TASK_COLOR_KEYS: TaskColorKey[] = [
  'zinc',
  'red',
  'orange',
  'amber',
  'emerald',
  'sky',
  'violet',
  'pink',
]

/** Опорный HEX для палитры (Tailwind ~500) — подбор ближайшего ключа из произвольного цвета */
export const TASK_COLOR_HEX: Record<TaskColorKey, string> = {
  zinc: '#71717a',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  pink: '#ec4899',
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const s = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3}$/.test(s) && !/^[0-9a-fA-F]{6}$/.test(s)) return null
  const full =
    s.length === 3
      ? [...s].map((c) => c + c).join('')
      : s.length === 6
        ? s
        : null
  if (!full) return null
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some((x) => Number.isNaN(x))) return null
  return { r, g, b }
}

/** Строка вида #rgb / #rrggbb или rgb(r,g,b) */
export function parseColorInput(raw: string): { r: number; g: number; b: number } | null {
  const t = raw.trim()
  if (!t) return null
  const hex = hexToRgb(t)
  if (hex) return hex
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(t)
  if (m) {
    const r = Math.min(255, Math.max(0, Number(m[1])))
    const g = Math.min(255, Math.max(0, Number(m[2])))
    const b = Math.min(255, Math.max(0, Number(m[3])))
    if ([r, g, b].some((x) => Number.isNaN(x))) return null
    return { r, g, b }
  }
  return null
}

function rgbDist(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

export function nearestTaskColorKey(rgb: { r: number; g: number; b: number }): TaskColorKey {
  let best: TaskColorKey = 'zinc'
  let bestD = Infinity
  for (const key of TASK_COLOR_KEYS) {
    const hx = TASK_COLOR_HEX[key]
    const ref = hexToRgb(hx)
    if (!ref) continue
    const d = rgbDist(rgb, ref)
    if (d < bestD) {
      bestD = d
      best = key
    }
  }
  return best
}

export function taskBorderClass(colorKey: TaskColorKey): string {
  return TASK_LEFT_BORDER[colorKey] ?? TASK_LEFT_BORDER.zinc
}
