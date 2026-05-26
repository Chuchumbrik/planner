/** QA clock override — local only, never synced to vault. */
export const QA_CLOCK_STORAGE_KEY = 'motivator_qa_clock_v1'

export type QaClockConfig = {
  enabled: boolean
  /** Simulated instant (epoch ms). */
  fakeNowMs: number
}

export function readQaClockFromStorage(): QaClockConfig | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(QA_CLOCK_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QaClockConfig
    if (
      typeof parsed.enabled !== 'boolean' ||
      typeof parsed.fakeNowMs !== 'number' ||
      !Number.isFinite(parsed.fakeNowMs)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeQaClockToStorage(config: QaClockConfig | null): void {
  if (typeof localStorage === 'undefined') return
  if (config == null) {
    localStorage.removeItem(QA_CLOCK_STORAGE_KEY)
    return
  }
  localStorage.setItem(QA_CLOCK_STORAGE_KEY, JSON.stringify(config))
}
