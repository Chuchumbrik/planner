/** Разбиение сохранённой оценки (минуты) на поля «часы» и «минуты» для UI. */
export function splitEstimateMinutes(total: number | null): {
  hours: string
  minutes: string
} {
  if (total == null || total <= 0) return { hours: '', minutes: '' }
  const h = Math.floor(total / 60)
  const m = total % 60
  return { hours: String(h), minutes: String(m) }
}

export type MergeEstimateResult = {
  total: number | null
  invalid: boolean
}

/**
 * Собирает оценку из двух полей: часы (любое неотрицательное целое) и минуты (0–59).
 * Пустые строки считаются нулями; оба нуля → null.
 */
export function mergeEstimateParts(
  hoursStr: string,
  minutesStr: string,
): MergeEstimateResult {
  const hs = hoursStr.trim()
  const ms = minutesStr.trim()
  if (hs === '' && ms === '') return { total: null, invalid: false }

  const h = hs === '' ? 0 : Number(hs)
  const m = ms === '' ? 0 : Number(ms)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return { total: null, invalid: true }
  if (!Number.isInteger(h) || !Number.isInteger(m)) return { total: null, invalid: true }
  if (h < 0 || m < 0 || m > 59) return { total: null, invalid: true }

  const total = h * 60 + m
  if (total <= 0) return { total: null, invalid: false }
  if (total > 24 * 60) return { total: null, invalid: true }
  return { total, invalid: false }
}
