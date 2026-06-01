/**
 * Относительное время для дорожной карты («Краткая сводка»).
 * Чистая логика (Phase 7.2 Hero, расширяется в 7.3 Timeline) — без зависимостей от React/i18n,
 * чтобы покрывать юнит-тестами и звать из любого места. Все функции принимают `now` явно.
 *
 * Даты выпусков — `dateLabel` формата `YYYY-MM-DD` (без таймзоны), поэтому сравниваем
 * по UTC-полуночи: разница в целых календарных днях.
 */

const DAY_MS = 86_400_000

/** `YYYY-MM-DD` → ms UTC-полуночи этого дня; `null` если строка не парсится. */
function parseDayUtc(dateISO: string): number | null {
  const m = dateISO.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** Целых дней назад относительно `now` (по UTC-дате). Будущее → отрицательное; некорректная дата → 0. */
export function daysAgo(dateISO: string, now: Date): number {
  const then = parseDayUtc(dateISO)
  if (then == null) return 0
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((today - then) / DAY_MS)
}

/** «Свежий» выпуск — вышел сегодня (в пределах календарных суток). */
export function isFreshRelease(dateISO: string, now: Date): boolean {
  return daysAgo(dateISO, now) <= 0
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/**
 * Локализованная относительная подпись: сегодня / вчера / N дней / N недель / N месяцев назад.
 * После 90 дней — абсолютная дата (`YYYY-MM-DD`).
 */
export function relativeDayLabel(dateISO: string, now: Date, lang: 'ru' | 'en'): string {
  const d = daysAgo(dateISO, now)
  const en = lang === 'en'
  if (d <= 0) return en ? 'today' : 'сегодня'
  if (d === 1) return en ? 'yesterday' : 'вчера'
  if (d < 7) return en ? `${d} days ago` : `${d} ${pluralRu(d, 'день', 'дня', 'дней')} назад`
  if (d < 30) {
    const w = Math.floor(d / 7)
    return en ? `${w} week${w > 1 ? 's' : ''} ago` : `${w} ${pluralRu(w, 'неделю', 'недели', 'недель')} назад`
  }
  if (d <= 90) {
    const mo = Math.floor(d / 30)
    return en ? `${mo} month${mo > 1 ? 's' : ''} ago` : `${mo} ${pluralRu(mo, 'месяц', 'месяца', 'месяцев')} назад`
  }
  return dateISO.trim().slice(0, 10)
}
