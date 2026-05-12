import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { APP_VERSION } from '@/version'

const FILE_DEFECT_ERROR_CODES = [
  'forbidden',
  'invalid_body',
  'payload_too_large',
  'github_not_configured',
  'github_auth_error',
  'github_rate_limit',
  'github_error',
  'missing_authorization',
  'invalid_token',
  'supabase_env_missing',
  'role_lookup_failed',
] as const

function mapFileDefectErrorMessage(formatted: string, t: (key: string) => string): string {
  for (const code of FILE_DEFECT_ERROR_CODES) {
    if (formatted.includes(code)) {
      return t(`settings.fileDefectErrors.${code}`)
    }
  }
  return formatted
}

export type FileDefectModalProps = {
  open: boolean
  onClose: () => void
  supabase: SupabaseClient
  localeTag: 'ru' | 'en'
  pathname: string
}

export function FileDefectModal({ open, onClose, supabase, localeTag, pathname }: FileDefectModalProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('')
  const [includeRoute, setIncludeRoute] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issueUrl, setIssueUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setSteps('')
    setIncludeRoute(true)
    setError(null)
    setIssueUrl(null)
    setBusy(false)
  }, [open])

  if (!open) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIssueUrl(null)
    const trimmedTitle = title.trim()
    const trimmedDesc = description.trim()
    if (!trimmedTitle || !trimmedDesc) {
      setError(t('settings.fileDefectValidationRequired'))
      return
    }
    setBusy(true)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('file-defect', {
        body: {
          title: trimmedTitle,
          description: trimmedDesc,
          steps: steps.trim() || undefined,
          appVersion: APP_VERSION,
          route: includeRoute ? pathname : '',
          locale: localeTag,
        },
      })
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        setError(mapFileDefectErrorMessage(msg, t))
        return
      }
      const url =
        data && typeof data === 'object' && 'issue_url' in data
          ? String((data as { issue_url?: unknown }).issue_url)
          : ''
      if (!url) {
        setError(t('settings.fileDefectErrors.github_error'))
        return
      }
      setIssueUrl(url)
    } catch (err: unknown) {
      setError(mapFileDefectErrorMessage(err instanceof Error ? err.message : String(err), t))
    } finally {
      setBusy(false)
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose()
      }}
    >
      <div
        className="flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-defect-title"
      >
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 id="file-defect-title" className="text-base font-semibold text-white">
            {t('settings.fileDefectModalTitle')}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">{t('settings.fileDefectModalHelp')}</p>
        </div>
        {issueUrl ? (
          <div className="flex flex-col gap-3 px-4 py-4">
            <p className="text-sm text-emerald-300/95">{t('settings.fileDefectSuccess')}</p>
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-emerald-400 underline hover:text-emerald-300"
            >
              {t('settings.fileDefectOpenIssue')}
            </a>
            <button
              type="button"
              className="mt-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700"
              onClick={() => onClose()}
            >
              {t('settings.fileDefectClose')}
            </button>
          </div>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => void onSubmit(e)}>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t('settings.fileDefectTitleLabel')}</span>
                <input
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t('settings.fileDefectDescriptionLabel')}</span>
                <textarea
                  className="min-h-[100px] resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  value={description}
                  maxLength={8000}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500">{t('settings.fileDefectStepsLabel')}</span>
                <span className="text-[11px] leading-snug text-zinc-600">{t('settings.fileDefectStepsHint')}</span>
                <textarea
                  className="min-h-[72px] resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  value={steps}
                  maxLength={4000}
                  onChange={(e) => setSteps(e.target.value)}
                />
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={includeRoute}
                  onChange={(e) => setIncludeRoute(e.target.checked)}
                />
                <span className="text-sm leading-snug text-zinc-300">{t('settings.fileDefectIncludeRoute')}</span>
              </label>
              {error ? (
                <p className="text-xs text-red-400" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2 border-t border-zinc-800 px-4 py-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-zinc-600 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                onClick={() => onClose()}
              >
                {t('settings.fileDefectCancel')}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg border border-emerald-700 bg-emerald-900/40 py-2 text-sm text-emerald-100 hover:bg-emerald-900/60 disabled:opacity-40"
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
