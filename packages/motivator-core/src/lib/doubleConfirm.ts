import type { Task } from '../vault/types'

/** Интервал до «второго пинга» (мин.) — [[09-User-Flow-одного-дня]] default +10 мин */
export const DOUBLE_CONFIRM_DEFAULT_INTERVAL_MIN = 10
/** Окно после второго пинга до авто-Failed (мин.) — [[12-Журнал-решений#DR-004]] */
export const DOUBLE_CONFIRM_DEFAULT_GRACE_MIN = 30

export function computeDoubleConfirmDeadlineIso(
  firstStepAtIso: string,
  intervalMin: number,
  graceMin: number,
): string {
  const firstMs = Date.parse(firstStepAtIso)
  if (Number.isNaN(firstMs)) return firstStepAtIso
  const ms = firstMs + intervalMin * 60_000 + graceMin * 60_000
  return new Date(ms).toISOString()
}

export function effectiveDoubleConfirmIntervalMin(task: Task): number {
  const n = task.doubleConfirmIntervalMinutes
  if (typeof n === 'number' && !Number.isNaN(n) && n >= 1 && n <= 24 * 60) return Math.floor(n)
  return DOUBLE_CONFIRM_DEFAULT_INTERVAL_MIN
}

export function effectiveDoubleConfirmGraceMin(task: Task): number {
  const n = task.doubleConfirmGraceMinutes
  if (typeof n === 'number' && !Number.isNaN(n) && n >= 1 && n <= 24 * 60) return Math.floor(n)
  return DOUBLE_CONFIRM_DEFAULT_GRACE_MIN
}
