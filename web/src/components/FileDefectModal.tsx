import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { collectImageFilesFromClipboard } from '@/lib/defectClipboardFiles'
import { buildDefectIssueMarkdownPreview } from '@/lib/defectIssueMarkdownPreview'
import { collectDefectDeviceMeta } from '@/lib/defectDeviceMeta'
import { DEFECT_TEMPLATE_IDS, type DefectTemplateId } from '@/lib/defectTemplates'
import { APP_VERSION } from '@/version'
import { useFileDefect } from '@/hooks/useFileDefect'
import {
  MODAL_CLOSE_BTN,
  MODAL_FOOTER,
  MODAL_OVERLAY,
  MODAL_SHELL,
  MODAL_TITLE,
  MOTIVATOR_INPUT,
  TEXT_HINT_WARNING,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'
import { useDialogFocusTrap } from '@/lib/useDialogFocusTrap'

const TITLE_MAX = 120
const DESC_MAX = 8000
const STEPS_MAX = 4000
const EXPECTED_MAX = 2000
const ACTUAL_MAX = 2000
const UA_MAX = 400
const MAX_FILES = 2
const MAX_BYTES = 3 * 1024 * 1024
const ACCEPT_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])
// Counter appears when the field is focused or has used more than 70% of the limit
const COUNTER_RATIO = 0.7

function clampField(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}

export type DefectTypeId = 'bug' | 'ui_ux' | 'performance' | 'enhancement' | 'other'

export type FileDefectModalProps = {
  open: boolean
  onClose: () => void
  supabase: SupabaseClient
  localeTag: 'ru' | 'en'
  pathname: string
  userId: string
  motivatorRole: string
}

type Attachment = { path: string; name: string }

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'bin'
}

export function FileDefectModal({
  open,
  onClose,
  supabase,
  localeTag,
  pathname,
  userId,
  motivatorRole,
}: FileDefectModalProps) {
  const { t } = useTranslation()
  const { submit, mapFileDefectErrorMessage } = useFileDefect(supabase)
  const formId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  useDialogFocusTrap(open, dialogRef)

  const [draftId, setDraftId] = useState(() => crypto.randomUUID())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('')
  const [expected, setExpected] = useState('')
  const [actual, setActual] = useState('')
  const [defectType, setDefectType] = useState<DefectTypeId>('bug')
  const [includeRoute, setIncludeRoute] = useState(true)
  const [includeUserAgent, setIncludeUserAgent] = useState(true)
  const [extraOpen, setExtraOpen] = useState(false)
  const [techOpen, setTechOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issueUrl, setIssueUrl] = useState<string | null>(null)
  const [suggestedLabels, setSuggestedLabels] = useState<string[]>([])
  const [previewMarkdown, setPreviewMarkdown] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [descTouched, setDescTouched] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingTemplate, setPendingTemplate] = useState<DefectTemplateId | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [exiting, setExiting] = useState(false)

  const deviceMeta = useMemo(() => collectDefectDeviceMeta(), [])

  const userAgentShort = useMemo(() => {
    if (typeof navigator === 'undefined' || !includeUserAgent) return ''
    const ua = navigator.userAgent?.trim() ?? ''
    return ua.length > UA_MAX ? ua.slice(0, UA_MAX) : ua
  }, [includeUserAgent])

  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setDraftId(crypto.randomUUID())
      setTitle('')
      setDescription('')
      setSteps('')
      setExpected('')
      setActual('')
      setDefectType('bug')
      setIncludeRoute(true)
      setIncludeUserAgent(true)
      setExtraOpen(false)
      setTechOpen(false)
      setPreviewMode(false)
      setAttachments([])
      setError(null)
      setIssueUrl(null)
      setSuggestedLabels([])
      setBusy(false)
      setTitleTouched(false)
      setDescTouched(false)
      setUploadBusy(false)
      setUploadError(null)
      setPendingTemplate(null)
      setFocusedField(null)
    })
  }, [open])

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [error])

  useEffect(() => {
    if (open) {
      setExiting(false)
      setMounted(true)
    } else if (mounted) {
      setExiting(true)
      const t = setTimeout(() => { setMounted(false); setExiting(false) }, 200)
      return () => clearTimeout(t)
    }
  }, [open, mounted])

  const syncDraftPaths = useCallback(
    async (paths: string[]) => {
      const { error: e } = await supabase.from('defect_attachment_drafts').upsert(
        { user_id: userId, draft_id: draftId, storage_paths: paths },
        { onConflict: 'user_id,draft_id' },
      )
      if (e) console.warn('defect_attachment_drafts upsert', e)
    },
    [supabase, userId, draftId],
  )

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploadBusy(true)
      setUploadError(null)
      const list = [...files].filter(Boolean)
      const next: Attachment[] = [...attachments]
      let lastIssue: string | null = null
      for (const file of list) {
        if (next.length >= MAX_FILES) break
        if (!ACCEPT_MIME.has(file.type)) {
          lastIssue = t('settings.fileDefectErrors.invalid_file_type')
          continue
        }
        if (file.size > MAX_BYTES) {
          lastIssue = t('settings.fileDefectErrors.file_too_large')
          continue
        }
        const ext = extFromMime(file.type)
        const objectPath = `${userId}/${draftId}/${Date.now()}-${next.length}.${ext}`
        const { error: upErr } = await supabase.storage.from('defect-attachments').upload(objectPath, file, {
          upsert: false,
          contentType: file.type,
        })
        if (upErr) {
          lastIssue = t('settings.fileDefectErrors.upload_failed')
          continue
        }
        next.push({ path: objectPath, name: file.name })
      }
      setAttachments(next)
      await syncDraftPaths(next.map((a) => a.path))
      setUploadError(lastIssue)
      setUploadBusy(false)
    },
    [attachments, draftId, supabase, syncDraftPaths, t, userId],
  )

  const removeAttachment = useCallback(
    async (path: string) => {
      const next = attachments.filter((a) => a.path !== path)
      await supabase.storage.from('defect-attachments').remove([path])
      setAttachments(next)
      setUploadError(null)
      await syncDraftPaths(next.map((a) => a.path))
    },
    [attachments, supabase, syncDraftPaths],
  )

  useEffect(() => {
    if (!open || !previewMode) return
    let cancelled = false
    async function run() {
      const lines: string[] = []
      for (const a of attachments) {
        const { data, error: sErr } = await supabase.storage
          .from('defect-attachments')
          .createSignedUrl(a.path, 600)
        if (cancelled) return
        if (!sErr && data?.signedUrl) {
          lines.push(`![${a.name}](${data.signedUrl})`)
        } else {
          lines.push(`- _(preview)_ **${a.name}** \`${a.path}\``)
        }
      }
      const md = buildDefectIssueMarkdownPreview({
        description: description.trim() || '_…_',
        steps: steps.trim() || undefined,
        expected: expected.trim() || undefined,
        actual: actual.trim() || undefined,
        screenshotLines: lines.length ? lines : undefined,
        appVersion: APP_VERSION,
        route: includeRoute ? pathname : '',
        locale: localeTag,
        motivatorRole,
        userId,
        userAgent: userAgentShort || undefined,
        deviceMeta,
      })
      if (!cancelled) setPreviewMarkdown(md)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    open,
    previewMode,
    attachments,
    description,
    steps,
    expected,
    actual,
    pathname,
    includeRoute,
    localeTag,
    motivatorRole,
    userId,
    userAgentShort,
    deviceMeta,
    supabase,
  ])

  const handleClose = useCallback(() => {
    if (attachments.length > 0 && !issueUrl) {
      void supabase.storage.from('defect-attachments').remove(attachments.map((a) => a.path))
      void supabase.from('defect_attachment_drafts').delete().match({ user_id: userId, draft_id: draftId })
    }
    onClose()
  }, [attachments, issueUrl, supabase, userId, draftId, onClose])

  const applyTemplate = (id: DefectTemplateId) => {
    setTitle(clampField(t(`settings.defectTemplate.${id}.title`), TITLE_MAX))
    setDescription(clampField(t(`settings.defectTemplate.${id}.description`), DESC_MAX))
    const st = t(`settings.defectTemplate.${id}.steps`)
    const hasSteps = !st.startsWith('settings.')
    setSteps(hasSteps ? st : '')
    if (hasSteps) setExtraOpen(true)
  }

  const recommendSteps = description.trim().length > 200 && !steps.trim()
  const titleInvalid = titleTouched && !title.trim()
  const descInvalid = descTouched && !description.trim()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIssueUrl(null)
    const trimmedTitle = title.trim()
    const trimmedDesc = description.trim()
    if (!trimmedTitle || !trimmedDesc) {
      setTitleTouched(true)
      setDescTouched(true)
      return
    }
    setBusy(true)
    try {
      const res = await submit({
        title: trimmedTitle,
        description: trimmedDesc,
        steps: steps.trim() || undefined,
        expected: expected.trim() || undefined,
        actual: actual.trim() || undefined,
        userAgent: userAgentShort || undefined,
        appVersion: APP_VERSION,
        route: includeRoute ? pathname : '',
        locale: localeTag,
        defect_type: defectType,
        attachment_paths: attachments.map((a) => a.path),
        draft_id: draftId,
        device_meta: deviceMeta,
      })
      if (!res.ok) {
        if ('errorKey' in res && res.errorKey) {
          setError(t(res.errorKey))
        } else {
          setError(mapFileDefectErrorMessage(String(res.errorMessage ?? ''), t))
        }
        return
      }
      setError(null)
      setIssueUrl(res.issueUrl)
      setSuggestedLabels(res.suggestedLabels)
      setAttachments([])
    } catch (err: unknown) {
      setError(mapFileDefectErrorMessage(err instanceof Error ? err.message : String(err), t))
    } finally {
      setBusy(false)
    }
  }

  if (!mounted) return null

  const routePreview = includeRoute ? pathname || '—' : t('settings.fileDefectRouteOmitted')

  const tabBtn = (active: boolean, label: string, onClick: () => void) => (
    <button
      type="button"
      className={cn(
        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-on-surface-variant hover:bg-surface-container-low',
      )}
      onClick={onClick}
    >
      {label}
    </button>
  )

  const closeBtn = (
    <button
      type="button"
      className={MODAL_CLOSE_BTN}
      onClick={handleClose}
      aria-label={t('settings.fileDefectClose')}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  )

  const modal = (
    <div
      className={cn(MODAL_OVERLAY, 'z-[100]', exiting ? 'modal-overlay-out' : 'modal-overlay-in')}
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) handleClose()
      }}
    >
      <div
        ref={dialogRef}
        className={cn(MODAL_SHELL, 'max-h-[min(92dvh,780px)]', exiting ? 'modal-shell-out' : 'modal-shell-in')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={issueUrl ? `${formId}-success-title` : `${formId}-title`}
      >
        {/* ── HEADER — always visible ────────────────────────────────────── */}
        <div className="flex shrink-0 flex-col gap-2 border-b border-surface-variant p-sm pb-3 pt-4 md:px-md max-md:pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-2">
            <h2
              id={issueUrl ? `${formId}-success-title` : `${formId}-title`}
              className={MODAL_TITLE}
            >
              {issueUrl ? t('settings.fileDefectSuccessTitle') : t('settings.fileDefectModalTitle')}
            </h2>
            {closeBtn}
          </div>
          {!issueUrl && (
            <div className="flex gap-1">
              {tabBtn(!previewMode, t('settings.fileDefectTabForm'), () => setPreviewMode(false))}
              {tabBtn(previewMode, t('settings.fileDefectTabPreview'), () => setPreviewMode(true))}
            </div>
          )}
        </div>

        {/* ── SUCCESS ────────────────────────────────────────────────────── */}
        {issueUrl ? (
          <div className="flex flex-col gap-3 px-4 py-5">
            <p className="text-sm text-on-surface-variant">
              {t('settings.fileDefectSuccess48')}
            </p>
            {suggestedLabels.length ? (
              <p className="text-[11px] text-on-surface-variant">
                {t('settings.fileDefectSuggestedLabels', { labels: suggestedLabels.join(', ') })}
              </p>
            ) : null}
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-primary underline hover:text-primary-fixed"
            >
              {t('settings.fileDefectOpenIssue')}
            </a>
            <button
              type="button"
              className="mt-1 rounded-lg border border-surface-variant bg-surface-container-high px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container-highest"
              onClick={() => onClose()}
            >
              {t('settings.fileDefectClose')}
            </button>
          </div>

        ) : previewMode ? (
          /* ── PREVIEW ───────────────────────────────────────────────────── */
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <div className="markdown-preview overflow-y-auto rounded-lg border border-surface-variant bg-surface-container-low/60 p-3 text-sm text-on-surface [&_a]:break-all [&_a]:text-primary [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:text-xs [&_img]:max-h-48 [&_img]:max-w-full [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_ul]:mb-2">
              <Markdown>{previewMarkdown}</Markdown>
            </div>
            <div className="mt-3 flex gap-2 border-t border-surface-variant pt-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-surface-variant py-2.5 text-sm text-on-surface hover:bg-surface-container-high"
                onClick={() => setPreviewMode(false)}
              >
                {t('settings.fileDefectBackToForm')}
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-lg border btn-primary py-2.5 text-sm disabled:opacity-40"
                onClick={(e) => void onSubmit(e as unknown as FormEvent)}
              >
                {busy ? t('common.loading') : t('settings.fileDefectSubmit')}
              </button>
            </div>
          </div>

        ) : (
          /* ── FORM ──────────────────────────────────────────────────────── */
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => void onSubmit(e)}>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">

              {/* Templates — flex-wrap, no horizontal scroll */}
              <div className="flex flex-wrap gap-1.5">
                {DEFECT_TEMPLATE_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      'rounded border px-2.5 py-1 text-[11px] transition-colors',
                      pendingTemplate === id
                        ? 'border-amber-400/50 bg-amber-400/10 text-amber-500'
                        : 'border-surface-variant text-on-surface-variant hover:bg-surface-container-low',
                    )}
                    onClick={() => {
                      if (title.trim() || description.trim()) {
                        setPendingTemplate(id)
                      } else {
                        applyTemplate(id)
                      }
                    }}
                  >
                    {t(`settings.defectTemplate.${id}.label`)}
                  </button>
                ))}
              </div>
              {pendingTemplate && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                  <p className="text-xs text-amber-500">{t('settings.fileDefectTemplateOverwriteWarning')}</p>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      className="rounded border border-amber-400/40 px-2 py-0.5 text-xs text-amber-500 hover:bg-amber-400/20"
                      onClick={() => { applyTemplate(pendingTemplate); setPendingTemplate(null) }}
                    >
                      {t('settings.fileDefectTemplateOverwriteApply')}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-surface-variant px-2 py-0.5 text-xs text-on-surface-variant hover:bg-surface-container-low"
                      onClick={() => setPendingTemplate(null)}
                    >
                      {t('settings.fileDefectTemplateKeep')}
                    </button>
                  </div>
                </div>
              )}

              {/* Заголовок * */}
              <label className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2 text-xs text-on-surface-variant">
                  <span>
                    {t('settings.fileDefectTitleLabel')}
                    <span className="ml-0.5 text-red-400" aria-hidden> *</span>
                  </span>
                  {(focusedField === 'title' || title.length > TITLE_MAX * COUNTER_RATIO) && (
                    <span className="font-mono text-[10px]">
                      {t('settings.fileDefectCharCount', { used: title.length, max: TITLE_MAX })}
                    </span>
                  )}
                </span>
                <input
                  className={cn(
                    MOTIVATOR_INPUT,
                    'placeholder:text-on-surface-variant',
                    titleInvalid && 'ring-1 ring-red-400',
                  )}
                  value={title}
                  maxLength={TITLE_MAX}
                  placeholder={t('settings.fileDefectTitlePlaceholder')}
                  aria-required="true"
                  onChange={(e) => setTitle(clampField(e.target.value, TITLE_MAX))}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => { setTitleTouched(true); setFocusedField(null) }}
                  autoFocus
                />
                {titleInvalid && (
                  <p className="text-xs text-red-400">{t('settings.fileDefectValidationTitleRequired')}</p>
                )}
              </label>

              {/* Описание * */}
              <label className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2 text-xs text-on-surface-variant">
                  <span>
                    {t('settings.fileDefectDescriptionLabel')}
                    <span className="ml-0.5 text-red-400" aria-hidden> *</span>
                  </span>
                  {(focusedField === 'desc' || description.length > DESC_MAX * COUNTER_RATIO) && (
                    <span className="font-mono text-[10px]">
                      {t('settings.fileDefectCharCount', { used: description.length, max: DESC_MAX })}
                    </span>
                  )}
                </span>
                <textarea
                  className={cn(
                    'min-h-[88px] resize-none sm:resize-y',
                    MOTIVATOR_INPUT,
                    'placeholder:text-on-surface-variant',
                    descInvalid && 'ring-1 ring-red-400',
                  )}
                  value={description}
                  maxLength={DESC_MAX}
                  placeholder={t('settings.fileDefectDescriptionPlaceholder')}
                  aria-required="true"
                  onChange={(e) => setDescription(e.target.value)}
                  onFocus={() => setFocusedField('desc')}
                  onBlur={() => { setDescTouched(true); setFocusedField(null) }}
                />
                {descInvalid && (
                  <p className="text-xs text-red-400">{t('settings.fileDefectValidationDescRequired')}</p>
                )}
              </label>

              {recommendSteps && (
                <button
                  type="button"
                  className={cn(TEXT_HINT_WARNING, 'text-left')}
                  onClick={() => setExtraOpen(true)}
                >
                  {t('settings.fileDefectRecommendSteps')}
                </button>
              )}

              {/* Тип */}
              <label className="flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant">{t('settings.fileDefectTypeLabel')}</span>
                <select
                  className={MOTIVATOR_INPUT}
                  value={defectType}
                  onChange={(e) => setDefectType(e.target.value as DefectTypeId)}
                >
                  <option value="bug">{t('settings.fileDefectType.bug')}</option>
                  <option value="ui_ux">{t('settings.fileDefectType.ui_ux')}</option>
                  <option value="performance">{t('settings.fileDefectType.performance')}</option>
                  <option value="enhancement">{t('settings.fileDefectType.enhancement')}</option>
                  <option value="other">{t('settings.fileDefectType.other')}</option>
                </select>
              </label>

              {/* Скриншоты */}
              <div
                tabIndex={0}
                role="region"
                aria-label={t('settings.fileDefectScreenshotsRegionAria')}
                className="rounded-lg border border-surface-variant bg-surface-container-low/40 p-2 outline-none ring-primary/0 transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-primary/50"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (attachments.length >= MAX_FILES) return
                  const f = e.dataTransfer.files
                  if (f?.length) void addFiles(f)
                }}
                onPaste={(e) => {
                  if (attachments.length >= MAX_FILES) return
                  const files = collectImageFilesFromClipboard(e.clipboardData)
                  if (files.length === 0) return
                  e.preventDefault()
                  e.stopPropagation()
                  void addFiles(files)
                }}
              >
                <p className="text-xs text-on-surface-variant">{t('settings.fileDefectScreenshotsLabel')}</p>
                <p className="text-[10px] text-on-surface-variant">{t('settings.fileDefectScreenshotsHint')}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files
                    if (f?.length) void addFiles(f)
                    e.target.value = ''
                  }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded border border-surface-variant px-2 py-1 text-xs text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                    disabled={attachments.length >= MAX_FILES || uploadBusy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadBusy ? t('common.loading') : t('settings.fileDefectAddScreenshot')}
                  </button>
                </div>
                {uploadError && (
                  <p className="mt-1 text-xs text-red-400" role="alert">{uploadError}</p>
                )}
                {attachments.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-on-surface-variant">
                    {attachments.map((a) => (
                      <li key={a.path} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate">{a.name}</span>
                        <button
                          type="button"
                          className="shrink-0 text-red-400 hover:underline"
                          onClick={() => void removeAttachment(a.path)}
                        >
                          {t('common.delete')}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Шаги и детали — шаги, ожидаемый, фактический */}
              <Collapsible
                open={extraOpen}
                onToggle={() => setExtraOpen((v) => !v)}
                label={t('settings.fileDefectExtraToggle')}
              >
                <label className="flex flex-col gap-1">
                  <span className="flex justify-between text-xs text-on-surface-variant">
                    <span>{t('settings.fileDefectStepsLabel')}</span>
                    {(focusedField === 'steps' || steps.length > STEPS_MAX * COUNTER_RATIO) && (
                      <span className="font-mono text-[10px]">
                        {t('settings.fileDefectCharCount', { used: steps.length, max: STEPS_MAX })}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">{t('settings.fileDefectStepsHint')}</span>
                  <textarea
                    className={cn('min-h-[64px] resize-none sm:resize-y', MOTIVATOR_INPUT, 'placeholder:text-on-surface-variant')}
                    value={steps}
                    maxLength={STEPS_MAX}
                    placeholder={t('settings.fileDefectStepsPlaceholder')}
                    onFocus={() => setFocusedField('steps')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setSteps(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="flex justify-between text-xs text-on-surface-variant">
                    <span>{t('settings.fileDefectExpectedLabel')}</span>
                    {(focusedField === 'expected' || expected.length > EXPECTED_MAX * COUNTER_RATIO) && (
                      <span className="font-mono text-[10px]">
                        {t('settings.fileDefectCharCount', { used: expected.length, max: EXPECTED_MAX })}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">{t('settings.fileDefectExpectedHint')}</span>
                  <textarea
                    className={cn('min-h-[48px] resize-none sm:resize-y', MOTIVATOR_INPUT, 'placeholder:text-on-surface-variant')}
                    value={expected}
                    maxLength={EXPECTED_MAX}
                    placeholder={t('settings.fileDefectExpectedPlaceholder')}
                    onFocus={() => setFocusedField('expected')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setExpected(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="flex justify-between text-xs text-on-surface-variant">
                    <span>{t('settings.fileDefectActualLabel')}</span>
                    {(focusedField === 'actual' || actual.length > ACTUAL_MAX * COUNTER_RATIO) && (
                      <span className="font-mono text-[10px]">
                        {t('settings.fileDefectCharCount', { used: actual.length, max: ACTUAL_MAX })}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">{t('settings.fileDefectActualHint')}</span>
                  <textarea
                    className={cn('min-h-[48px] resize-none sm:resize-y', MOTIVATOR_INPUT, 'placeholder:text-on-surface-variant')}
                    value={actual}
                    maxLength={ACTUAL_MAX}
                    placeholder={t('settings.fileDefectActualPlaceholder')}
                    onFocus={() => setFocusedField('actual')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setActual(e.target.value)}
                  />
                </label>
              </Collapsible>

              {/* Технические данные — маршрут, UA, устройство */}
              <Collapsible
                open={techOpen}
                onToggle={() => setTechOpen((v) => !v)}
                label={t('settings.fileDefectTechBlockTitle')}
              >
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={includeRoute}
                    onChange={(e) => setIncludeRoute(e.target.checked)}
                  />
                  <span className="text-sm leading-snug text-on-surface">{t('settings.fileDefectIncludeRoute')}</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={includeUserAgent}
                    onChange={(e) => setIncludeUserAgent(e.target.checked)}
                  />
                  <span className="text-sm leading-snug text-on-surface">{t('settings.fileDefectIncludeUserAgent')}</span>
                </label>
                <p className="rounded-md border border-surface-variant/80 bg-surface-container-low/50 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-on-surface-variant">
                  {t('settings.fileDefectContextPreview', { version: APP_VERSION, route: routePreview })}
                </p>
                <dl className="space-y-0.5 font-mono text-[10px] leading-relaxed text-on-surface-variant">
                  <div className="flex gap-1">
                    <dt className="shrink-0">UA</dt>
                    <dd className="min-w-0 break-all">{includeUserAgent ? userAgentShort || '—' : t('settings.fileDefectOmitted')}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="shrink-0">Viewport</dt>
                    <dd>{deviceMeta.viewport}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="shrink-0">DPR</dt>
                    <dd>{deviceMeta.device_pixel_ratio}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="shrink-0">Device</dt>
                    <dd>{deviceMeta.device_class}</dd>
                  </div>
                </dl>
              </Collapsible>

              {error && (
                <p ref={errorRef} className="text-xs text-red-400" role="alert">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className={cn(MODAL_FOOTER, 'flex gap-2')}>
              <button
                type="button"
                className="flex-1 rounded-lg border border-surface-variant py-2.5 text-sm text-on-surface hover:bg-surface-container-high"
                onClick={handleClose}
              >
                {t('settings.fileDefectCancel')}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg border btn-primary py-2.5 text-sm disabled:opacity-40"
              >
                {busy ? t('common.loading') : t('settings.fileDefectSubmit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}

type CollapsibleProps = {
  open: boolean
  onToggle: () => void
  label: string
  children: React.ReactNode
}

function Collapsible({ open, onToggle, label, children }: CollapsibleProps) {
  return (
    <div className="rounded-lg border border-surface-variant bg-surface-container-low/30">
      <button
        type="button"
        className="flex w-full cursor-pointer select-none items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-on-surface hover:bg-surface-container-low/50"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>{label}</span>
        <span className="text-on-surface-variant" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-surface-variant px-3 pb-3 pt-2">
          {children}
        </div>
      )}
    </div>
  )
}
