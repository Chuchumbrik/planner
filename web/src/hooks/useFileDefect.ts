import { useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'

export const FILE_DEFECT_ERROR_CODES = [
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
  'invalid_defect_type',
  'invalid_attachments',
  'label_not_allowed',
  'rate_limited',
  'storage_signed_url_failed',
] as const

export function mapFileDefectErrorMessage(formatted: string, t: (key: string) => string): string {
  for (const code of FILE_DEFECT_ERROR_CODES) {
    if (formatted.includes(code)) {
      return t(`settings.fileDefectErrors.${code}`)
    }
  }
  return formatted
}

export type FileDefectSubmitBody = Record<string, unknown>

export function useFileDefect(supabase: SupabaseClient | null) {
  const submit = useCallback(
    async (body: FileDefectSubmitBody) => {
      if (!supabase) {
        return { ok: false as const, errorKey: 'settings.fileDefectErrors.supabase_env_missing' as const }
      }
      const { data, error: fnErr } = await supabase.functions.invoke('file-defect', { body })
      if (fnErr) {
        const msg = await formatSupabaseFunctionInvokeError(fnErr)
        return { ok: false as const, errorMessage: msg }
      }
      const url =
        data && typeof data === 'object' && 'issue_url' in data
          ? String((data as { issue_url?: unknown }).issue_url)
          : ''
      const suggested =
        data && typeof data === 'object' && 'suggested_labels' in data
          ? (data as { suggested_labels?: unknown }).suggested_labels
          : undefined
      const labels = Array.isArray(suggested)
        ? suggested.filter((x): x is string => typeof x === 'string')
        : []
      if (!url) {
        return { ok: false as const, errorMessage: 'github_error' }
      }
      return { ok: true as const, issueUrl: url, suggestedLabels: labels }
    },
    [supabase],
  )

  return { submit, mapFileDefectErrorMessage }
}
