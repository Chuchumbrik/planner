import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import { supabase } from '@/lib/supabase'
import type { AiAction, AiMessage } from '@/types/aiAssistant'
import type { Task, TaskGroup } from '@motivator/core'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const FN_URL = `${SUPABASE_URL}/functions/v1/ai-task-assistant`
const SESSION_KEY = 'ai-chat-history'
const MAX_SESSION_MESSAGES = 20
const MAX_HISTORY_SENT = 8

function trimMessages(msgs: AiMessage[]): AiMessage[] {
  if (msgs.length <= MAX_SESSION_MESSAGES) return msgs
  return msgs.slice(msgs.length - MAX_SESSION_MESSAGES)
}

function loadSessionMessages(): AiMessage[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const msgs = (parsed as AiMessage[]).filter(
      (m) => m && typeof m.id === 'string' && typeof m.text === 'string',
    )
    return trimMessages(msgs)
  } catch {
    return []
  }
}

export type AiChatState = {
  messages: AiMessage[]
  streaming: boolean
  error: string | null
  pendingAction: AiAction | null
  suggestions: string[]
}

export function useAiChat(tasks: Task[], groups: TaskGroup[]) {
  const { i18n } = useTranslation()
  const [messages, setMessages] = useState<AiMessage[]>(loadSessionMessages)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<AiAction | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const lastUserTextRef = useRef<string>('')

  // Persist non-streaming messages to sessionStorage (trimmed)
  useEffect(() => {
    const toSave = trimMessages(messages.filter((m) => !m.streaming))
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(toSave))
    } catch {
      // sessionStorage full or unavailable — ignore
    }
  }, [messages])

  // Local date in YYYY-MM-DD — must match scheduledLocalDate stored on tasks
  const today = new Date().toLocaleDateString('en-CA')
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toLocaleDateString('en-CA')

  const allActiveTasks = tasks.filter((t) => !t.done)
  const totalActive = allActiveTasks.length
  const totalOverdue = allActiveTasks.filter(
    (t) => t.scheduledLocalDate !== null && t.scheduledLocalDate < today,
  ).length

  // Sort: overdue high-prio → overdue low-prio → today high-prio → today low-prio
  //        → future by prio → backlog by prio
  const activeTasks = [...allActiveTasks]
    .sort((a, b) => {
      const rank = (t: typeof a): number => {
        const prio = t.priorityRank ?? 3
        if (t.scheduledLocalDate !== null && t.scheduledLocalDate < today)
          return (5 - prio)                   // 0–4: overdue
        if (t.scheduledLocalDate === today)
          return 5 + (5 - prio)               // 5–9: today
        if (t.scheduledLocalDate !== null)
          return 10 + (5 - prio)              // 10–14: future
        return 15 + (5 - prio)               // 15–19: backlog
      }
      return rank(a) - rank(b)
    })
    .slice(0, 20)
    .map((t) => ({
      title: t.title,
      scheduledLocalDate: t.scheduledLocalDate,
      groupName: groups.find((g) => g.id === t.groupId)?.name,
      done: false as const,
      overdue: t.scheduledLocalDate !== null && t.scheduledLocalDate < today,
      priorityRank: t.priorityRank,
      estimatedMinutes: t.estimatedMinutes,
      timeMode: t.timeMode !== 'none' ? t.timeMode : undefined,
      timeMinutesFromMidnight:
        t.timeMode !== 'none' ? t.timeMinutesFromMidnight : undefined,
      recurring: t.recurrence !== null,
      checklistItems: t.checklist.length > 0 ? t.checklist.map((c) => c.title) : undefined,
    }))

  const recentDone = tasks
    .filter(
      (t) =>
        t.done &&
        t.scheduledLocalDate != null &&
        t.scheduledLocalDate >= sevenDaysAgo,
    )
    .sort((a, b) => (b.scheduledLocalDate ?? '').localeCompare(a.scheduledLocalDate ?? ''))
    .slice(0, 10)
    .map((t) => ({
      title: t.title,
      scheduledLocalDate: t.scheduledLocalDate,
      groupName: groups.find((g) => g.id === t.groupId)?.name,
      done: true as const,
      overdue: false as const,
      priorityRank: t.priorityRank,
      estimatedMinutes: t.estimatedMinutes,
      timeMode: undefined,
      timeMinutesFromMidnight: undefined,
    }))

  const taskContext = [...activeTasks, ...recentDone]
  const groupContext = groups.map((g) => g.name)

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return

      abortRef.current?.abort()
      const abort = new AbortController()
      abortRef.current = abort

      lastUserTextRef.current = text

      const userMsg: AiMessage = { id: nanoid(), role: 'user', text }
      const assistantId = nanoid()

      setMessages((prev) => [
        ...trimMessages(prev),
        userMsg,
        { id: assistantId, role: 'assistant', text: '', streaming: true },
      ])
      setStreaming(true)
      setError(null)
      setPendingAction(null)
      setSuggestions([])

      try {
        const session = await supabase?.auth.getSession()
        const jwt = session?.data.session?.access_token ?? ''

        const history = messages.slice(-MAX_HISTORY_SENT).map((m) => ({
          role: m.role,
          text: m.kind === 'confirmation' ? `[Подтверждено: ${m.text}]` : m.text,
        }))

        const resp = await fetch(FN_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'chat',
            message: text,
            history,
            tasks: taskContext,
            groups: groupContext,
            context: {
              date: today,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              lang: i18n.language,
              totalActive,
              totalOverdue,
            },
          }),
          signal: abort.signal,
        })

        if (!resp.ok || !resp.body) {
          throw new Error(`HTTP ${resp.status}`)
        }

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            const raw = line.slice(5).trim()
            if (raw === '[DONE]') continue
            let chunk: Record<string, unknown>
            try {
              chunk = JSON.parse(raw)
            } catch {
              continue
            }

            if (typeof chunk.t === 'string') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: m.text + chunk.t } : m,
                ),
              )
            } else if (chunk.a) {
              const action = chunk.a as AiAction & { suggestions?: string[] }
              const { suggestions: sugg, ...actionWithoutSugg } = action
              setPendingAction(actionWithoutSugg as AiAction)
              if (Array.isArray(sugg) && sugg.length > 0) {
                setSuggestions(sugg.slice(0, 3))
              }
            } else if (chunk.e === 'rate_limited') {
              setError('rate_limited')
            }
          }
        }
      } catch (e: unknown) {
        if ((e as Error).name === 'AbortError') return
        setError('network_error')
      } finally {
        setStreaming(false)
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
        )
      }
    },
    [streaming, messages, taskContext, i18n.language, today],
  )

  const retry = useCallback(() => {
    const last = lastUserTextRef.current
    if (!last || streaming) return
    setMessages((prev) => {
      const lastUserIdx = [...prev].reverse().findIndex((m) => m.role === 'user' && m.kind !== 'confirmation')
      if (lastUserIdx === -1) return prev
      return prev.slice(0, prev.length - 1 - lastUserIdx)
    })
    void send(last)
  }, [streaming, send])

  const dismissAction = useCallback(() => setPendingAction(null), [])
  const dismissError = useCallback(() => setError(null), [])

  const notifyConfirmation = useCallback((text: string) => {
    const msg: AiMessage = { id: nanoid(), role: 'user', text, kind: 'confirmation' }
    setMessages((prev) => trimMessages([...prev, msg]))
  }, [])

  const clearHistory = useCallback(() => {
    setMessages([])
    setPendingAction(null)
    setSuggestions([])
    setError(null)
    try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
  }, [])

  return { messages, streaming, error, pendingAction, suggestions, send, retry, dismissAction, dismissError, clearHistory, notifyConfirmation }
}
