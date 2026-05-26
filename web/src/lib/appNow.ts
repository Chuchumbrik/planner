import { localDateKey } from '@motivator/core'
import {
  readQaClockFromStorage,
  writeQaClockToStorage,
  type QaClockConfig,
} from '@/lib/qaClockStorage'

export type { QaClockConfig } from '@/lib/qaClockStorage'

const APP_NOW_CHANGED = 'motivator:app-now-changed'

const listeners = new Set<() => void>()

let cachedConfig: QaClockConfig | null | undefined

function loadConfig(): QaClockConfig | null {
  if (cachedConfig === undefined) {
    cachedConfig = readQaClockFromStorage()
  }
  return cachedConfig
}

function notify(): void {
  for (const fn of listeners) fn()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(APP_NOW_CHANGED))
  }
}

export function getQaClockConfig(): QaClockConfig | null {
  return loadConfig()
}

export function isQaClockEnabled(): boolean {
  const c = loadConfig()
  return Boolean(c?.enabled)
}

/** Calendar / planner “now” — real clock unless QA override is on. */
export function getAppNow(): Date {
  const c = loadConfig()
  if (c?.enabled) return new Date(c.fakeNowMs)
  return new Date()
}

export function appLocalDateKey(d?: Date): string {
  return localDateKey(d ?? getAppNow())
}

export function appNowIso(): string {
  return getAppNow().toISOString()
}

export function setQaClockConfig(config: QaClockConfig | null): void {
  cachedConfig = config
  writeQaClockToStorage(config)
  notify()
}

export function subscribeAppNow(listener: () => void): () => void {
  listeners.add(listener)
  const onWindow = () => listener()
  if (typeof window !== 'undefined') {
    window.addEventListener(APP_NOW_CHANGED, onWindow)
  }
  return () => {
    listeners.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener(APP_NOW_CHANGED, onWindow)
    }
  }
}

/** Split local datetime for admin form controls. */
export function qaClockFormParts(ms: number): { dateKey: string; time: string } {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return { dateKey: `${y}-${m}-${day}`, time: `${hh}:${mm}` }
}

export function qaClockMsFromParts(dateKey: string, time: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim())
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!m || !tm) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const h = Number(tm[1])
  const min = Number(tm[2])
  if (h > 23 || min > 59) return null
  const dt = new Date(y, mo, d, h, min, 0, 0)
  if (Number.isNaN(dt.getTime())) return null
  return dt.getTime()
}
