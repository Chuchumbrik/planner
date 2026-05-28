import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/**
 * AI Task Assistant — streaming chat + Whisper transcription via Groq.
 * Actions:
 *   POST { action: "chat", message, history, tasks, context }
 *     → SSE stream: data: {"t":"text chunk"} | data: {"a":{...action}} | data: [DONE]
 *   POST { action: "transcribe", audio_base64, mime_type }
 *     → JSON { text: string }
 *
 * Free-tier limits applied: max 1024 output tokens, top-20 tasks in context, 4-message history.
 */

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const CHAT_MODEL = 'llama-3.3-70b-versatile'
const WHISPER_MODEL = 'whisper-large-v3-turbo'
const MAX_OUTPUT_TOKENS = 2048
const MAX_HISTORY = 8
const MAX_TASKS_CONTEXT = 30

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type TaskSummary = {
  title: string
  scheduledLocalDate?: string | null
  groupName?: string
  done?: boolean
  overdue?: boolean
  priorityRank?: number
  estimatedMinutes?: number | null
  timeMode?: 'start' | 'end'
  timeMinutesFromMidnight?: number | null
  recurring?: boolean
  checklistItems?: string[]
}

type HistoryMessage = { role: 'user' | 'assistant'; text: string }

function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatTask(t: TaskSummary): string {
  const parts: string[] = []
  if (t.overdue) parts.push('[ПРОСРОЧЕНО]')
  parts.push(t.title)
  if (t.scheduledLocalDate) parts.push(`[${t.scheduledLocalDate}]`)
  if (t.groupName) parts.push(`(${t.groupName})`)
  if (t.timeMode && t.timeMinutesFromMidnight != null)
    parts.push(`@${minsToTime(t.timeMinutesFromMidnight)}${t.timeMode === 'end' ? '→конец' : ''}`)
  if (t.estimatedMinutes) parts.push(`~${t.estimatedMinutes}мин`)
  if (t.priorityRank && t.priorityRank >= 4) parts.push(`★${t.priorityRank}`)
  if (t.recurring) parts.push('[↻]')
  if (t.checklistItems?.length) {
    const shown = t.checklistItems.slice(0, 5)
    const more = t.checklistItems.length - shown.length
    const label = shown.join(' / ') + (more > 0 ? ` +${more}` : '')
    parts.push(`[☑ ${label}]`)
  }
  return '• ' + parts.join(' ')
}

function buildSystemPrompt(
  tasks: TaskSummary[],
  groups: string[],
  context: { date: string; timezone: string; lang: string; totalActive?: number; totalOverdue?: number },
): string {
  const allActive = tasks.slice(0, MAX_TASKS_CONTEXT).filter((t) => !t.done)
  const doneTasks = tasks.slice(0, MAX_TASKS_CONTEXT).filter((t) => t.done)

  const overdueTasks = allActive.filter((t) => t.overdue)
  const todayTasks = allActive.filter((t) => t.scheduledLocalDate === context.date)
  const futureTasks = allActive.filter(
    (t) => !t.overdue && t.scheduledLocalDate != null && t.scheduledLocalDate !== context.date,
  )
  const backlogTasks = allActive.filter((t) => t.scheduledLocalDate == null)

  const todayMinutes = todayTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0)

  const realTotal = context.totalActive ?? allActive.length
  const realOverdue = context.totalOverdue ?? overdueTasks.length
  const truncated = realTotal > allActive.length

  const statsLine = [
    `активных: ${realTotal}${truncated ? ` (показано ${allActive.length})` : ''}`,
    todayTasks.length > 0
      ? `сегодня: ${todayTasks.length}${todayMinutes > 0 ? ` (~${Math.round(todayMinutes / 60 * 10) / 10}ч)` : ''}`
      : null,
    realOverdue > 0 ? `просрочено: ${realOverdue}` : null,
    doneTasks.length > 0 ? `выполнено за 7д: ${doneTasks.length}` : null,
  ].filter(Boolean).join(' | ')

  const overdueBlock = overdueTasks.length > 0
    ? `\n⚠️ ПРОСРОЧЕННЫЕ (${overdueTasks.length}):\n${overdueTasks.map(formatTask).join('\n')}`
    : ''
  const todayBlock = todayTasks.length > 0
    ? `\nСЕГОДНЯ ${context.date} (~${todayMinutes}мин):\n${todayTasks.map(formatTask).join('\n')}`
    : ''
  const futureBlock = futureTasks.length > 0
    ? `\nБУДУЩИЕ:\n${futureTasks.map(formatTask).join('\n')}`
    : ''
  const backlogBlock = backlogTasks.length > 0
    ? `\nБЭКЛОГ (без даты):\n${backlogTasks.map(formatTask).join('\n')}`
    : ''
  const doneBlock = doneTasks.length > 0
    ? `\nВЫПОЛНЕНО за 7 дней:\n${doneTasks.map((t) => `✓ ${t.title}${t.scheduledLocalDate ? ` [${t.scheduledLocalDate}]` : ''}`).join('\n')}`
    : ''

  const noTasks = !overdueBlock && !todayBlock && !futureBlock && !backlogBlock

  const groupList = groups.length > 0
    ? groups.map((g) => `• ${g}`).join('\n')
    : '• Входящие (по умолчанию)'

  return `Ты — AI-ассистент планировщика задач Motivator.
Сегодня: ${context.date} (${context.timezone}). Язык ответа: ${context.lang}.

ГРУППЫ:
${groupList}

ЗАДАЧИ ПОЛЬЗОВАТЕЛЯ (${statsLine}):
${truncated ? `⚠ Показаны топ-${allActive.length} задач из ${realTotal} — остальные в бэклоге.\n` : ''}${noTasks ? '(нет активных задач)' : `${overdueBlock}${todayBlock}${futureBlock}${backlogBlock}${doneBlock}`}

Формат строки задачи: [ПРОСРОЧЕНО] название [дата] (группа) @ЧЧ:ММ ~Nмин ★P
★ только для приоритета 4-5. Отсутствующие поля не указаны.

ВОЗМОЖНОСТИ:
- Создавать задачи (create_tasks)
- Редактировать задачи: дата, приоритет, название, группа, оценку времени, чеклист, выполнено (edit_tasks)
- Удалять задачи (delete_tasks)
- Уточнять запрос (clarify)
- Разбивать цели на подзадачи, строить планы
- Анализировать нагрузку, просрочку, статистику

ПРАВИЛА ДАННЫХ:
- priorityRank 1–5 (5 = наивысший)
- timeMode "start"=начало, "end"=дедлайн; timeMinutesFromMidnight: 9:00→540
- recurrence: {"kind":"daily"} | {"kind":"everyNDays","n":N} | {"kind":"weekly","weekdays":[0-6]}; 0=Вс..6=Сб
- Минимальная дата для новых задач: ${context.date}
- groupName в edit changes — только из существующего списка групп
- done: true — отметить выполненной; done: false — снять отметку (вернуть в активные)
- estimatedMinutes: null — убрать оценку; число — установить в минутах
- checklistItems: [...] — заменить весь чеклист; [] — очистить; не указывай, если чеклист не меняется
- Задачи с [↻] — повторяющиеся. Не меняй scheduledLocalDate для них (только title, priorityRank, groupName, estimatedMinutes, done)

ПРАВИЛА ОТВЕТА:
- Краткость. Списки без лишних слов.
- Briefing: сначала ⚠️ просроченные → сегодня → остальное.
- «С чего начать?»: выбери задачу с наивысшим приоритетом из просроченных/сегодня.
- «Успею всё?»: сравни сумму ~мин сегодня с доступным временем (спроси если неизвестно).
- «Перегружен»: покажи сумму нагрузки, предложи перенести ★1-2 задачи.
- При пакетном переносе просроченных: генерируй edit_tasks для ВСЕХ задач из блока ПРОСРОЧЕННЫЕ.

ПРИМЕРЫ:

[Запрос: "Что у меня на сегодня?"]
⚠️ Просрочено (2): нужно разобраться — Позвонить клиенту [2026-05-25] ★5, Сдать отчёт [2026-05-26].
Сегодня 3 задачи (~2.5ч): Встреча с командой @10:00 ~60мин ★4, Ревью кода ~90мин, Написать документацию ~60мин.
\`\`\`action
{"type":"none","suggestions":["Перенести просроченные на сегодня","С чего начать?"]}
\`\`\`

[Запрос: "Перенеси все просроченные на сегодня"]
Переношу 2 задачи на ${context.date}.
\`\`\`action
{"type":"edit_tasks","edits":[{"taskTitle":"Позвонить клиенту","changes":{"scheduledLocalDate":"${context.date}"}},{"taskTitle":"Сдать отчёт","changes":{"scheduledLocalDate":"${context.date}"}}],"suggestions":["Поставить им высокий приоритет?"]}
\`\`\`

[Запрос: "С чего начать?"]
Начни с **Позвонить клиенту** (~30мин, ★5) — просрочена и важная.
\`\`\`action
{"type":"none","suggestions":["Отметить выполненной","Что дальше?"]}
\`\`\`

[Запрос: "Я успею всё сегодня?"]
На сегодня ~4.5ч (270мин). При 8ч рабочем дне — реально, но плотно. Если нужен запас — перенеси «Написать документацию» (~60мин, ★2).
\`\`\`action
{"type":"none","suggestions":["Перенести низкоприоритетные","Показать только ★4-5"]}
\`\`\`

ФОРМАТЫ ACTION-БЛОКОВ:
\`\`\`action
{"type":"create_tasks","tasks":[{"title":"...","groupName":"Группа","scheduledLocalDate":"YYYY-MM-DD","estimatedMinutes":30,"timeMode":"start","timeMinutesFromMidnight":540,"priorityRank":3,"checklistItems":["шаг"]}],"suggestions":["..."]}
\`\`\`
\`\`\`action
{"type":"edit_tasks","edits":[{"taskTitle":"Точное название","changes":{"scheduledLocalDate":"YYYY-MM-DD","priorityRank":4,"done":true,"title":"Новое","groupName":"Группа","estimatedMinutes":30,"checklistItems":["шаг 1","шаг 2"]}}],"suggestions":["..."]}
\`\`\`
\`\`\`action
{"type":"delete_tasks","taskTitles":["Точное название"]}
\`\`\`
\`\`\`action
{"type":"clarify","question":"Вопрос?","options":["Вариант 1","Вариант 2"]}
\`\`\`
\`\`\`action
{"type":"none","suggestions":["Подсказка 1","Подсказка 2"]}
\`\`\`
suggestions (1-3 варианта) опционально в любом блоке. В changes указывай только изменяемые поля.`
}

async function handleChat(
  groqApiKey: string,
  message: string,
  history: HistoryMessage[],
  tasks: TaskSummary[],
  groups: string[],
  context: { date: string; timezone: string; lang: string; totalActive?: number; totalOverdue?: number },
): Promise<Response> {
  const systemPrompt = buildSystemPrompt(tasks, groups, context)

  const trimmedHistory = history.slice(-MAX_HISTORY)
  const messages = [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory.map((m) => ({ role: m.role, content: m.text })),
    { role: 'user', content: message },
  ]

  const groqResp = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      stream: true,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.5,
    }),
  })

  if (!groqResp.ok) {
    const errText = await groqResp.text().catch(() => '')
    if (groqResp.status === 429) {
      const sseBody = `data: ${JSON.stringify({ e: 'rate_limited' })}\n\ndata: [DONE]\n\n`
      return new Response(sseBody, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      })
    }
    return json(502, { error: 'groq_error', detail: errText.slice(0, 300) })
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqResp.body!.getReader()
      let fullContent = ''
      let sentUpTo = 0
      let inActionBlock = false

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const raw = decoder.decode(value, { stream: true })
          for (const line of raw.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const dataStr = trimmed.slice(5).trim()
            if (dataStr === '[DONE]') continue
            let parsed: unknown
            try { parsed = JSON.parse(dataStr) } catch { continue }
            const delta = (parsed as Record<string, unknown>)
            const choices = delta?.choices as Array<Record<string, unknown>> | undefined
            const content = (choices?.[0]?.delta as Record<string, unknown> | undefined)?.content
            if (typeof content !== 'string' || !content) continue

            fullContent += content

            if (!inActionBlock) {
              // Allow optional whitespace before ``` to handle model formatting variations
              const actionMatch2 = /\n[ \t]*```action/.exec(fullContent.slice(sentUpTo))
              if (actionMatch2) {
                inActionBlock = true
                const cutAt = sentUpTo + actionMatch2.index
                const toSend = fullContent.slice(sentUpTo, cutAt).trimEnd()
                if (toSend) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: toSend })}\n\n`))
                }
                sentUpTo = cutAt
              } else {
                const toSend = fullContent.slice(sentUpTo)
                if (toSend) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: toSend })}\n\n`))
                  sentUpTo = fullContent.length
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      // Parse and send action block if present
      // Robust: allow optional whitespace around the fences
      const actionMatch = fullContent.match(/[ \t]*```action[ \t]*\r?\n([\s\S]*?)\r?\n?[ \t]*```/)
      if (actionMatch) {
        const jsonStr = actionMatch[1].trim()
        try {
          const action = JSON.parse(jsonStr)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ a: action })}\n\n`))
        } catch {
          // Attempt to salvage truncated JSON by finding the last complete top-level key
          const salvaged = jsonStr.replace(/,\s*"[^"]*"\s*:[\s\S]*$/, '}')
          try {
            const action = JSON.parse(salvaged)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ a: action })}\n\n`))
          } catch { /* truly malformed — skip */ }
        }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function handleTranscribe(
  groqApiKey: string,
  audioBase64: string,
  mimeType: string,
  lang: string,
): Promise<Response> {
  const binary = atob(audioBase64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : 'webm'
  const formData = new FormData()
  formData.append('file', new Blob([bytes], { type: mimeType }), `audio.${ext}`)
  formData.append('model', WHISPER_MODEL)
  formData.append('language', lang || 'ru')
  formData.append('response_format', 'json')

  const resp = await fetch(GROQ_AUDIO_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqApiKey}` },
    body: formData,
  })

  if (!resp.ok) {
    if (resp.status === 429) return json(429, { error: 'rate_limited' })
    const err = await resp.text().catch(() => '')
    return json(502, { error: 'whisper_error', detail: err.slice(0, 300) })
  }

  const data = (await resp.json()) as Record<string, unknown>
  return json(200, { text: typeof data.text === 'string' ? data.text : '' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? ''
  if (!supabaseUrl || !anon || !groqApiKey) return json(500, { error: 'supabase_env_missing' })

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!jwt) return json(401, { error: 'missing_authorization' })

  const client = createClient(supabaseUrl, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: authData, error: authErr } = await client.auth.getUser(jwt)
  if (authErr || !authData?.user?.id) return json(401, { error: 'invalid_token' })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid_body' })
  }
  if (!body || typeof body !== 'object') return json(400, { error: 'invalid_body' })
  const b = body as Record<string, unknown>

  if (b.action === 'transcribe') {
    const audioBase64 = typeof b.audio_base64 === 'string' ? b.audio_base64 : ''
    const mimeType = typeof b.mime_type === 'string' ? b.mime_type : 'audio/webm'
    const lang = typeof b.lang === 'string' ? b.lang : 'ru'
    if (!audioBase64) return json(400, { error: 'missing_audio' })
    return handleTranscribe(groqApiKey, audioBase64, mimeType, lang)
  }

  if (b.action === 'chat') {
    const message = typeof b.message === 'string' ? b.message.trim().slice(0, 2000) : ''
    if (!message) return json(400, { error: 'missing_message' })
    const history = Array.isArray(b.history) ? (b.history as HistoryMessage[]) : []
    const tasks = Array.isArray(b.tasks) ? (b.tasks as TaskSummary[]) : []
    const groups = Array.isArray(b.groups) ? (b.groups as string[]) : []
    const ctx = b.context && typeof b.context === 'object'
      ? (b.context as { date: string; timezone: string; lang: string; totalActive?: number; totalOverdue?: number })
      : { date: new Date().toISOString().slice(0, 10), timezone: 'UTC', lang: 'ru' }
    return handleChat(groqApiKey, message, history, tasks, groups, ctx)
  }

  return json(400, { error: 'invalid_action' })
})
