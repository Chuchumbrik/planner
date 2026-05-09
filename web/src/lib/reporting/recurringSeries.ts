import { recurrenceSeriesId } from '@/lib/recurrence'
import type { Task } from '@/vault/types'

/**
 * Ключ группировки для «часто проваленных» и других отчётов по повторяющимся задачам (**DR-008**).
 * Для разовых задач возвращает `null` — в отчёте они считаются по-другому (топ по провалам).
 */
export function recurringSeriesReportGroupKey(task: Task): string | null {
  return recurrenceSeriesId(task)
}
