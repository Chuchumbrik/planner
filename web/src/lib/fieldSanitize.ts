/** Макс. длина оценки: 24 ч (см. mergeEstimateParts). */
export const MAX_ESTIMATE_TOTAL_MINUTES = 24 * 60

/** Повтор «каждые N дней» — разумный верх (дни). */
export const MAX_EVERY_N_DAYS = 366

export const MAX_TASK_TITLE_CHARS = 500
export const MAX_CHECKLIST_ITEM_CHARS = 500
const MAX_COLOR_TEXT_CHARS = 96

/**
 * Сегмент «минуты» оценки: только цифры, значение 0…59 (100 → 59).
 */
export function sanitizeEstimateMinutesInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return ''
  const n = parseInt(digits, 10)
  if (!Number.isFinite(n)) return ''
  return String(Math.min(59, Math.max(0, n)))
}

/**
 * Сегмент «часы» оценки: только цифры, с учётом минут так, чтобы сумма ≤ 24 ч.
 */
export function sanitizeEstimateHoursInput(raw: string, minutesCompanion: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return ''
  let h = parseInt(digits, 10)
  if (!Number.isFinite(h)) return ''
  h = Math.max(0, h)
  const mStr = sanitizeEstimateMinutesInput(minutesCompanion)
  const m = mStr === '' ? 0 : parseInt(mStr, 10)
  const maxH = Math.floor((MAX_ESTIMATE_TOTAL_MINUTES - m) / 60)
  return String(Math.min(maxH, h))
}

export function reconcileEstimateAfterMinutesEdit(
  hoursRaw: string,
  newMinutesRaw: string,
): { hours: string; minutes: string } {
  const minutes = sanitizeEstimateMinutesInput(newMinutesRaw)
  const hours = sanitizeEstimateHoursInput(hoursRaw, minutes)
  return { hours, minutes }
}

export function reconcileEstimateAfterHoursEdit(
  newHoursRaw: string,
  minutesRaw: string,
): { hours: string; minutes: string } {
  const minutes = sanitizeEstimateMinutesInput(minutesRaw)
  const hours = sanitizeEstimateHoursInput(newHoursRaw, minutes)
  return { hours, minutes }
}

/** Согласовать оба поля (два прохода — стабилизация). */
export function normalizeEstimatePair(
  hoursRaw: string,
  minutesRaw: string,
): { hours: string; minutes: string } {
  let p = reconcileEstimateAfterMinutesEdit(hoursRaw, minutesRaw)
  p = reconcileEstimateAfterHoursEdit(p.hours, p.minutes)
  return p
}

/**
 * «Каждые N дней»: только цифры, min 1, max MAX_EVERY_N_DAYS. Пустой ввод → 1.
 */
export function sanitizeEveryNDaysInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return 1
  const n = parseInt(digits, 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(MAX_EVERY_N_DAYS, n)
}

/** Заголовок задачи: без управляющих символов, с обрезкой по длине. */
export function sanitizeTaskTitleInput(
  raw: string,
  maxLen: number = MAX_TASK_TITLE_CHARS,
): string {
  const noControls = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  return noControls.length <= maxLen ? noControls : noControls.slice(0, maxLen)
}

export function sanitizeChecklistItemInput(
  raw: string,
  maxLen: number = MAX_CHECKLIST_ITEM_CHARS,
): string {
  return sanitizeTaskTitleInput(raw, maxLen)
}

/** Поле ввода цвета (#hex, rgb): лишние символы отбрасываются. */
export function sanitizeColorTextInput(
  raw: string,
  maxLen: number = MAX_COLOR_TEXT_CHARS,
): string {
  const cleaned = raw.replace(/[^#0-9a-fA-F(),.\s%]/g, '')
  return cleaned.length <= maxLen ? cleaned : cleaned.slice(0, maxLen)
}
