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

export function feedbackHref(): string | null {
  const url = import.meta.env.VITE_FEEDBACK_URL
  const trimmed = typeof url === 'string' ? url.trim() : ''
  return trimmed.length > 0 ? trimmed : null
}
