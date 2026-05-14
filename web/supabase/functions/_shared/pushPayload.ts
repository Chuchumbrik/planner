/** Общая логика текста push для Edge Functions (Deno). */

export type FireRow = {
  kind: string
  title: string | null
  locale: string
  task_id: string
  dedupe_key: string
}

export function buildPushPayload(row: FireRow): {
  title: string
  body: string
  url: string
  tag: string
} {
  const loc = row.locale === 'en' ? 'en' : 'ru'
  const tag = row.dedupe_key
  const url =
    row.kind === 'eod_reminder'
      ? '/app'
      : `/app?highlightTask=${encodeURIComponent(row.task_id)}`

  if (row.kind === 'eod_reminder') {
    if (loc === 'en') {
      return {
        title: 'Motivator',
        body: 'Time for your end-of-day check-in — open the app.',
        url,
        tag,
      }
    }
    return {
      title: 'Мотиватор',
      body: 'Пора пройти ритуал «Завершить день» — открой приложение.',
      url,
      tag,
    }
  }

  if (!row.title || row.title.trim() === '') {
    if (row.kind === 'task_start') {
      if (loc === 'en') {
        return {
          title: 'Starting soon',
          body: 'A planned task block is about to begin — open Motivator.',
          url,
          tag,
        }
      }
      return {
        title: 'Скоро начало',
        body: 'Скоро начало запланированного блока задачи — открой Мотиватор.',
        url,
        tag,
      }
    }
    if (row.kind === 'task_end') {
      if (loc === 'en') {
        return {
          title: 'Time window ending',
          body: 'Planned time for a task is ending — open Motivator.',
          url,
          tag,
        }
      }
      return {
        title: 'Конец окна',
        body: 'Подходит к концу запланированное время задачи (дедлайн по плану) — открой Мотиватор.',
        url,
        tag,
      }
    }
    if (loc === 'en') {
      return {
        title: 'Motivator',
        body: 'Open the app — you have a reminder.',
        url,
        tag,
      }
    }
    return {
      title: 'Мотиватор',
      body: 'Открой приложение — есть напоминание.',
      url,
      tag,
    }
  }

  const title = row.title.trim()

  if (row.kind === 'task_start') {
    if (loc === 'en') {
      return { title: 'Motivator', body: `Time to start: “${title}”.`, url, tag }
    }
    return { title: 'Мотиватор', body: `Начинаем работу над задачей «${title}».`, url, tag }
  }

  if (loc === 'en') {
    return {
      title: 'Motivator',
      body: `Planned window for “${title}” is ending — open the app and mark done if needed.`,
      url,
      tag,
    }
  }
  return {
    title: 'Мотиватор',
    body: `Запланированное время задачи «${title}» подходит к концу — зайди в приложение и при необходимости отметь выполнено.`,
    url,
    tag,
  }
}
