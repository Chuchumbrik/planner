/** Optional env overrides; fallback paths are in-app placeholder legal pages. */
export type LegalDocId = 'privacy' | 'terms' | 'personalData'

export function legalDocHref(id: LegalDocId): string {
  const envKey =
    id === 'privacy'
      ? import.meta.env.VITE_LEGAL_PRIVACY_URL
      : id === 'terms'
        ? import.meta.env.VITE_LEGAL_TERMS_URL
        : import.meta.env.VITE_LEGAL_PERSONAL_DATA_URL
  const external = typeof envKey === 'string' ? envKey.trim() : ''
  if (external) return external
  return `/legal/${id}`
}

/** Optional env override; fallback — GitHub Issues репозитория (BUG-005). */
const DEFAULT_FEEDBACK_URL = 'https://github.com/Chuchumbrik/planner/issues/new'

export function feedbackHref(): string {
  const url = import.meta.env.VITE_FEEDBACK_URL
  const trimmed = typeof url === 'string' ? url.trim() : ''
  return trimmed.length > 0 ? trimmed : DEFAULT_FEEDBACK_URL
}
