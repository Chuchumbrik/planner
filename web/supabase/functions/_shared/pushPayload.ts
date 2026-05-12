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
  const url = `/app?highlightTask=${encodeURIComponent(row.task_id)}`
  const tag = row.dedupe_key
  const loc = row.locale === 'en' ? 'en' : 'ru'

  if (!row.title || row.title.trim() === '') {
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
      return { title: 'Motivator', body: `Time to start: "${title}".`, url, tag }
    }
    return { title: 'Мотиватор', body: `Начинаем работу над задачей «${title}»!`, url, tag }
  }

  if (loc === 'en') {
    return {
      title: 'Motivator',
      body: `Planned time for “${title}” has ended — open the app and mark done if needed.`,
      url,
      tag,
    }
  }
  return {
    title: 'Мотиватор',
    body: `Время задачи «${title}» по плану закончилось — зайди в приложение и при необходимости отметь выполнено.`,
    url,
    tag,
  }
}
