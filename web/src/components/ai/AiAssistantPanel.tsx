import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { DEFAULT_GROUP_ID, type PriorityRank } from '@motivator/core'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { useAiAssistant } from '@/components/ai/AiAssistantContext'
import { useAiChat } from '@/components/ai/useAiChat'
import { useSpeechInput } from '@/components/ai/useSpeechInput'
import { AiTaskProposalCard } from '@/components/ai/AiTaskProposalCard'
import { AiTaskEditCard } from '@/components/ai/AiTaskEditCard'
import { AiDeleteCard } from '@/components/ai/AiDeleteCard'
import { AiMarkdown } from '@/components/ai/AiMarkdown'
import { VoiceWave } from '@/components/ai/VoiceWave'
import { useVault } from '@/vault/VaultProvider'
import { cn } from '@/lib/cn'
import {
  AI_PANEL_WIDTH_MAX,
  AI_PANEL_WIDTH_MIN,
  readAiAssistantPanelWidth,
  writeAiAssistantPanelWidth,
} from '@/lib/aiAssistantPanelWidth'
import { MODAL_CLOSE_BTN, MOTIVATOR_INPUT } from '@/lib/designClasses'
import { useDialogFocusTrap } from '@/lib/useDialogFocusTrap'

type PanelBodyProps = {
  mode: 'overlay' | 'docked'
  width: number
  panelRef: RefObject<HTMLElement | null>
  closeRef: RefObject<HTMLButtonElement | null>
  onResizeWidth: (width: number) => void
}

function AiPanelResizeHandle({ onResizeWidth }: { onResizeWidth: (width: number) => void }) {
  const { t } = useTranslation()

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = readAiAssistantPanelWidth()

      function onPointerMove(ev: PointerEvent) {
        const next = Math.min(
          AI_PANEL_WIDTH_MAX,
          Math.max(AI_PANEL_WIDTH_MIN, startWidth + (startX - ev.clientX)),
        )
        onResizeWidth(next)
      }

      function onPointerUp(ev: PointerEvent) {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        document.removeEventListener('pointercancel', onPointerUp)
        const finalWidth = Math.min(
          AI_PANEL_WIDTH_MAX,
          Math.max(AI_PANEL_WIDTH_MIN, startWidth + (startX - ev.clientX)),
        )
        writeAiAssistantPanelWidth(finalWidth)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
      document.addEventListener('pointercancel', onPointerUp)
    },
    [onResizeWidth],
  )

  return (
    <button
      type="button"
      role="separator"
      aria-orientation="vertical"
      aria-label={t('aiAssistant.resizeHandle')}
      className="absolute inset-y-0 left-0 z-10 w-2 -translate-x-1/2 cursor-col-resize touch-none border-0 bg-transparent p-0 before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-surface-variant/80 hover:before:bg-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      onPointerDown={onPointerDown}
    />
  )
}

function AiAssistantPanelBody({
  mode,
  width,
  panelRef,
  closeRef,
  onResizeWidth,
}: PanelBodyProps) {
  const { t, i18n } = useTranslation()
  const { closeAssistant } = useAiAssistant()
  const { vault, createTaskFull, patchTask, setTaskScheduledLocalDate, setTaskPriorityRank, toggleTask, removeTask, setTaskGroup, addChecklistItem, removeChecklistItem } = useVault()

  const { messages, streaming, error, pendingAction, suggestions, send, retry, dismissAction, dismissError, clearHistory, notifyConfirmation } =
    useAiChat(vault.tasks, vault.groups)

  const [inputValue, setInputValue] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState<'created' | 'edited' | 'deleted' | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const confirmedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }, [])

  const onTranscript = useCallback((text: string) => {
    setInputValue(text)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const onAutoSend = useCallback(() => {
    setTimeout(() => {
      setInputValue((current) => {
        const text = current.trim()
        if (text) void send(text)
        return ''
      })
      resetTextareaHeight()
    }, 50)
  }, [send, resetTextareaHeight])

  const speech = useSpeechInput(i18n.language, onTranscript, onAutoSend)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pendingAction])

  // Auto-clear confirmed banner after 3 seconds
  useEffect(() => {
    if (!confirmed) return
    confirmedTimerRef.current = setTimeout(() => setConfirmed(null), 3000)
    return () => {
      if (confirmedTimerRef.current) clearTimeout(confirmedTimerRef.current)
    }
  }, [confirmed])

  // Focus textarea on mount
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(id)
  }, [])

  // Morning briefing: auto-send on first open of the day (only if chat is empty)
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA')
    const lastBriefed = sessionStorage.getItem('ai-last-briefed')
    if (lastBriefed === today || messages.length > 0) return
    sessionStorage.setItem('ai-last-briefed', today)
    const id = setTimeout(() => void send(t('aiAssistant.briefingPrompt')), 600)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally runs once on mount

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text || streaming) return
    void send(text)
    setInputValue('')
    resetTextareaHeight()
  }, [inputValue, streaming, send, resetTextareaHeight])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleExampleClick = useCallback(
    (text: string) => {
      void send(text)
    },
    [send],
  )

  const handleConfirmTasks = useCallback(async () => {
    if (!pendingAction || pendingAction.type !== 'create_tasks' || confirming) return
    setConfirming(true)
    try {
      let created = 0
      const total = pendingAction.tasks.length
      for (const proposal of pendingAction.tasks) {
        const ok = await createTaskFull(
          {
            title: proposal.title,
            groupId: DEFAULT_GROUP_ID,
            colorKey: 'zinc',
            priorityRank: (proposal.priorityRank ?? 3) as PriorityRank,
            scheduledLocalDate: proposal.scheduledLocalDate ?? null,
            estimatedMinutes: proposal.estimatedMinutes ?? null,
            timeMode: proposal.timeMode ?? 'none',
            timeMinutesFromMidnight: proposal.timeMinutesFromMidnight ?? null,
            recurrence: proposal.recurrence ?? null,
            recurrenceAnchorLocalDate:
              proposal.recurrenceAnchorLocalDate ?? proposal.scheduledLocalDate ?? null,
          },
          proposal.checklistItems,
          proposal.groupName ?? undefined,
        )
        if (ok) created++
      }
      if (created > 0) {
        setConfirmed('created')
        const msg = created < total
          ? t('aiAssistant.tasksCreatedPartial', { created, total })
          : t('aiAssistant.tasksCreated')
        notifyConfirmation(msg)
        dismissAction()
      }
    } catch {
      // vault unavailable — confirming resets in finally, user can retry
    } finally {
      setConfirming(false)
    }
  }, [pendingAction, confirming, createTaskFull, dismissAction, notifyConfirmation, t])

  const findTaskByTitle = useCallback(
    (title: string) => {
      const lower = title.toLowerCase()
      return (
        vault.tasks.find((t) => t.title.toLowerCase() === lower) ??
        vault.tasks.find((t) => t.title.toLowerCase().includes(lower)) ??
        vault.tasks.find((t) => lower.includes(t.title.toLowerCase()))
      )
    },
    [vault.tasks],
  )

  const handleConfirmEdits = useCallback(async () => {
    if (!pendingAction || pendingAction.type !== 'edit_tasks' || confirming) return
    setConfirming(true)
    try {
      for (const edit of pendingAction.edits) {
        const task = findTaskByTitle(edit.taskTitle)
        if (!task) continue
        const { changes } = edit
        if ('scheduledLocalDate' in changes && task.recurrence === null) {
          await setTaskScheduledLocalDate(task.id, changes.scheduledLocalDate ?? null)
        }
        if (changes.priorityRank != null) {
          await setTaskPriorityRank(task.id, changes.priorityRank as PriorityRank)
        }
        if (changes.title) {
          await patchTask(task.id, { title: changes.title })
        }
        if ('estimatedMinutes' in changes) {
          await patchTask(task.id, { estimatedMinutes: changes.estimatedMinutes ?? null })
        }
        if (typeof changes.done === 'boolean' && changes.done !== task.done) {
          await toggleTask(task.id)
        }
        if (changes.groupName) {
          const targetGroup = vault.groups.find(
            (g) => g.name.toLowerCase() === changes.groupName!.toLowerCase(),
          )
          if (targetGroup) await setTaskGroup(task.id, targetGroup.id)
        }
        if ('checklistItems' in changes && changes.checklistItems != null) {
          for (const item of task.checklist) {
            await removeChecklistItem(task.id, item.id)
          }
          for (const title of changes.checklistItems) {
            if (title.trim()) await addChecklistItem(task.id, title.trim())
          }
        }
      }
      setConfirmed('edited')
      notifyConfirmation(t('aiAssistant.tasksEdited'))
      dismissAction()
    } catch {
      // vault unavailable — user can retry
    } finally {
      setConfirming(false)
    }
  }, [pendingAction, confirming, findTaskByTitle, setTaskScheduledLocalDate, setTaskPriorityRank, patchTask, toggleTask, setTaskGroup, vault.groups, addChecklistItem, removeChecklistItem, dismissAction, notifyConfirmation, t])

  const handleConfirmDeletes = useCallback(async () => {
    if (!pendingAction || pendingAction.type !== 'delete_tasks' || confirming) return
    setConfirming(true)
    try {
      for (const title of pendingAction.taskTitles) {
        const task = findTaskByTitle(title)
        if (task) await removeTask(task.id)
      }
      setConfirmed('deleted')
      notifyConfirmation(t('aiAssistant.tasksDeleted'))
      dismissAction()
    } catch {
      // vault unavailable
    } finally {
      setConfirming(false)
    }
  }, [pendingAction, confirming, findTaskByTitle, removeTask, dismissAction, notifyConfirmation, t])

  const isEmpty = messages.length === 0

  const exampleTexts = useMemo(
    () => [t('aiAssistant.example1'), t('aiAssistant.example2'), t('aiAssistant.example3')],
    [t],
  )

  return (
    <aside
      ref={panelRef}
      id="ai-assistant-panel"
      role={mode === 'overlay' ? 'dialog' : 'complementary'}
      aria-modal={mode === 'overlay' ? true : undefined}
      aria-labelledby="ai-assistant-title"
      style={mode === 'docked' ? { width: `${width}px` } : undefined}
      className={cn(
        'relative flex min-h-dvh shrink-0 flex-col',
        'border-surface-variant bg-surface-container-lowest shadow-2xl',
        mode === 'overlay'
          ? cn(
              'w-full max-w-[min(100vw,24rem)] border-l ai-assistant-drawer',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            )
          : 'border-l',
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {mode === 'docked' ? <AiPanelResizeHandle onResizeWidth={onResizeWidth} /> : null}

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-surface-variant px-sm py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
            aria-hidden
          >
            <MaterialIcon name="psychology" size={22} filled />
          </div>
          <div className="min-w-0">
            <h2 id="ai-assistant-title" className="truncate text-label-md font-semibold text-on-surface">
              {t('aiAssistant.title')}
            </h2>
            <p className="text-label-sm text-on-surface-variant">{t('aiAssistant.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && !streaming ? (
            <button
              type="button"
              className={cn('rounded-lg p-2', MODAL_CLOSE_BTN)}
              onClick={clearHistory}
              aria-label={t('aiAssistant.clearHistory')}
              title={t('aiAssistant.clearHistory')}
            >
              <MaterialIcon name="delete_sweep" size={20} />
            </button>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            className={cn('rounded-lg p-2', MODAL_CLOSE_BTN)}
            onClick={closeAssistant}
            aria-label={t('common.close')}
          >
            <MaterialIcon name="close" size={22} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-sm py-sm">
        {isEmpty ? (
          <div className="space-y-3">
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-card rounded-tl-sm border border-surface-variant bg-surface-container-low px-3 py-2">
                <p className="text-body-sm text-on-surface">{t('aiAssistant.welcome')}</p>
              </div>
            </div>
            <p className="text-label-sm text-on-surface-variant">{t('aiAssistant.exampleHint')}</p>
            {exampleTexts.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleExampleClick(text)}
                className="flex w-full justify-end"
              >
                <div className="max-w-[90%] rounded-card rounded-tr-sm border border-primary/30 bg-primary/10 px-3 py-2 text-left transition-colors hover:bg-primary/20">
                  <p className="text-body-sm text-on-surface">{text}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              msg.kind === 'confirmation' ? (
                <div key={msg.id} className="flex items-center justify-center gap-1.5 py-0.5 text-label-sm text-on-surface-variant/60">
                  <MaterialIcon name="check_circle" size={12} />
                  {msg.text}
                </div>
              ) : (
              <div
                key={msg.id}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[90%] rounded-card px-3 py-2',
                    msg.role === 'user'
                      ? 'rounded-tr-sm border border-primary/30 bg-primary/10'
                      : 'rounded-tl-sm border border-surface-variant bg-surface-container-low',
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-body-sm text-on-surface">{msg.text}</p>
                  ) : (
                    <>
                      {msg.streaming && msg.text === '' ? (
                        <span className="inline-block h-3.5 w-1 animate-pulse bg-on-surface-variant/60" />
                      ) : (
                        <AiMarkdown text={msg.text} />
                      )}
                      {msg.streaming && msg.text !== '' ? (
                        <span className="mt-0.5 block h-1 w-4 animate-pulse rounded-full bg-primary/40" />
                      ) : null}
                    </>
                  )}
                </div>
              </div>
              )
            ))}

            {/* Pending task edits */}
            {pendingAction?.type === 'edit_tasks' ? (
              <div className="space-y-2">
                <p className="text-label-sm text-on-surface-variant">
                  {t('aiAssistant.proposedEdits', { count: pendingAction.edits.length })}
                </p>
                {pendingAction.edits.map((edit, i) => (
                  <AiTaskEditCard key={i} edit={edit} found={!!findTaskByTitle(edit.taskTitle)} />
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={() => void handleConfirmEdits()}
                    className="btn-primary flex flex-1 items-center justify-center gap-1.5 py-2 text-label-md disabled:opacity-60"
                  >
                    {confirming ? (
                      <MaterialIcon name="progress_activity" size={16} className="animate-spin" />
                    ) : (
                      <MaterialIcon name="edit" size={16} />
                    )}
                    {t('aiAssistant.confirmEdits')}
                  </button>
                  <button type="button" onClick={dismissAction} className="btn-secondary flex items-center justify-center gap-1 px-3 py-2 text-label-md">
                    <MaterialIcon name="close" size={16} />
                    {t('aiAssistant.dismissTasks')}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Pending task proposals */}
            {pendingAction?.type === 'create_tasks' ? (
              <div className="space-y-2">
                <p className="text-label-sm text-on-surface-variant">
                  {t('aiAssistant.proposedTasks', { count: pendingAction.tasks.length })}
                </p>
                {pendingAction.tasks.map((task, i) => (
                  <AiTaskProposalCard key={i} task={task} />
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={() => void handleConfirmTasks()}
                    className="btn-primary flex flex-1 items-center justify-center gap-1.5 py-2 text-label-md disabled:opacity-60"
                  >
                    {confirming ? (
                      <MaterialIcon name="progress_activity" size={16} className="animate-spin" />
                    ) : (
                      <MaterialIcon name="add_task" size={16} />
                    )}
                    {t('aiAssistant.confirmTasks')}
                  </button>
                  <button type="button" onClick={dismissAction} className="btn-secondary flex items-center justify-center gap-1 px-3 py-2 text-label-md">
                    <MaterialIcon name="close" size={16} />
                    {t('aiAssistant.dismissTasks')}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Pending deletes */}
            {pendingAction?.type === 'delete_tasks' ? (
              <div className="space-y-2">
                <p className="text-label-sm text-on-surface-variant">
                  {t('aiAssistant.proposedDeletes', { count: pendingAction.taskTitles.length })}
                </p>
                {pendingAction.taskTitles.map((title, i) => (
                  <AiDeleteCard key={i} title={title} found={!!findTaskByTitle(title)} />
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={() => void handleConfirmDeletes()}
                    className="btn-primary flex flex-1 items-center justify-center gap-1.5 py-2 text-label-md disabled:opacity-60"
                    style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                  >
                    {confirming ? (
                      <MaterialIcon name="progress_activity" size={16} className="animate-spin" />
                    ) : (
                      <MaterialIcon name="delete" size={16} />
                    )}
                    {t('aiAssistant.confirmDeletes')}
                  </button>
                  <button type="button" onClick={dismissAction} className="btn-secondary flex items-center justify-center gap-1 px-3 py-2 text-label-md">
                    <MaterialIcon name="close" size={16} />
                    {t('aiAssistant.dismissTasks')}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Clarify action */}
            {pendingAction?.type === 'clarify' && pendingAction.options?.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {pendingAction.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { dismissAction(); void send(opt) }}
                    className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-label-sm text-primary transition-colors hover:bg-primary/20"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Suggestion chips */}
            {suggestions.length > 0 && !streaming && !pendingAction ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-surface-variant bg-surface-container-low px-3 py-1.5 text-label-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Confirmation success */}
            {confirmed && !pendingAction ? (
              <div className="flex items-center gap-1.5 rounded-card border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-label-sm text-emerald-600 dark:text-emerald-400">
                <MaterialIcon name="check_circle" size={14} />
                {confirmed === 'edited'
                  ? t('aiAssistant.tasksEdited')
                  : confirmed === 'deleted'
                    ? t('aiAssistant.tasksDeleted')
                    : t('aiAssistant.tasksCreated')}
              </div>
            ) : null}
          </div>
        )}

        {/* Error banner */}
        {error ? (
          <div className="mt-3 flex items-start gap-2 rounded-card border border-error/30 bg-error/10 px-3 py-2 text-label-sm text-error">
            <MaterialIcon name="error_outline" size={14} className="mt-0.5 shrink-0" />
            <span className="flex-1">
              {error === 'rate_limited'
                ? t('aiAssistant.errorRateLimited')
                : t('aiAssistant.errorNetwork')}
            </span>
            <button
              type="button"
              onClick={() => { dismissError(); retry() }}
              aria-label={t('aiAssistant.retry')}
              className="shrink-0 rounded px-1.5 py-0.5 text-label-sm opacity-80 hover:opacity-100 underline underline-offset-2"
            >
              {t('aiAssistant.retry')}
            </button>
            <button type="button" onClick={dismissError} aria-label={t('common.close')} className="shrink-0 opacity-70 hover:opacity-100">
              <MaterialIcon name="close" size={14} />
            </button>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-surface-variant px-sm py-3">
        {speech.listening ? (
          <div className="mb-2 flex items-center gap-2 rounded-card border border-primary/30 bg-primary/5 px-3 py-2 text-label-sm text-primary">
            <VoiceWave amplitude={speech.amplitude} />
            {speech.transcript
              ? speech.transcript
              : t('aiAssistant.voiceListening')}
          </div>
        ) : null}
        {speech.error ? (
          <p className="mb-1.5 text-label-sm text-error">
            {speech.error === 'microphone_denied'
              ? t('aiAssistant.voiceErrorMic')
              : t('aiAssistant.voiceErrorTranscription')}
          </p>
        ) : null}
        <label className="sr-only" htmlFor="ai-assistant-input">
          {t('aiAssistant.inputLabel')}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            id="ai-assistant-input"
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('aiAssistant.inputPlaceholder')}
            disabled={streaming}
            className={cn(
              MOTIVATOR_INPUT,
              'min-w-0 flex-1 resize-none overflow-hidden',
              streaming && 'opacity-70',
            )}
            style={{ maxHeight: '7rem' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }}
          />
          {speech.supported ? (
            <button
              type="button"
              onClick={speech.toggle}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                speech.listening
                  ? 'bg-error/15 text-error hover:bg-error/25'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80',
              )}
              aria-label={speech.listening ? t('aiAssistant.voiceStop') : t('aiAssistant.voiceStart')}
              aria-pressed={speech.listening}
            >
              <MaterialIcon name={speech.listening ? 'mic_off' : 'mic'} size={20} />
            </button>
          ) : null}
          <button
            type="button"
            disabled={!inputValue.trim() || streaming}
            onClick={handleSend}
            className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center p-0 disabled:opacity-50"
            aria-label={t('aiAssistant.send')}
          >
            <MaterialIcon name="send" size={20} className="text-on-primary" />
          </button>
        </div>
        <p className="mt-1.5 text-label-sm text-on-surface-variant/70">
          {t('aiAssistant.inputHint')}
        </p>
      </footer>
    </aside>
  )
}

type Props = {
  mode: 'overlay' | 'docked'
}

export function AiAssistantPanel({ mode }: Props) {
  const { t } = useTranslation()
  const { open, closeAssistant } = useAiAssistant()
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(readAiAssistantPanelWidth)
  const [hasOpened, setHasOpened] = useState(false)
  useDialogFocusTrap(open, panelRef, closeRef)

  const onResizeWidth = useCallback((next: number) => {
    setWidth(next)
  }, [])

  useEffect(() => {
    if (open) setHasOpened(true)
  }, [open])

  useEffect(() => {
    if (!open || mode !== 'overlay') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, mode])

  if (mode === 'docked') {
    return (
      <div
        className="ai-panel-docked-wrapper"
        style={{ width: open ? `${width}px` : 0 }}
      >
        {hasOpened ? (
          <AiAssistantPanelBody
            mode="docked"
            width={width}
            panelRef={panelRef}
            closeRef={closeRef}
            onResizeWidth={onResizeWidth}
          />
        ) : null}
      </div>
    )
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 glass-overlay"
        aria-label={t('common.close')}
        onClick={closeAssistant}
      />
      <AiAssistantPanelBody
        mode="overlay"
        width={width}
        panelRef={panelRef}
        closeRef={closeRef}
        onResizeWidth={onResizeWidth}
      />
    </div>,
    document.body,
  )
}
