/** Detect browser / fetch errors that often indicate blocked or unreachable hosts (e.g. regional routing). */
export function isLikelyNetworkFetchFailure(raw: string | null | undefined): boolean {
  if (!raw) return false
  const lower = raw.toLowerCase()
  return (
    lower.includes('typeerror') ||
    lower.includes('load failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('err_connection') ||
    lower.includes('err_name_not_resolved') ||
    lower.includes('err_timed_out') ||
    (lower.includes('fetch') && lower.includes('fail'))
  )
}

export type ConnectivityTranslate = (key: string) => string

/** User-facing text for sync/auth errors; generic message when the failure looks like network. */
export function humanizeConnectivityError(
  raw: string | null | undefined,
  t: ConnectivityTranslate,
): string {
  if (!raw) return ''
  if (isLikelyNetworkFetchFailure(raw)) {
    return t('app.syncErrorGeneric')
  }
  return raw
}
