/**
 * Admin tables / dashboard: compact locale-aware date+time from ISO strings.
 *
 * Always rendered in the viewer's local timezone — admin tables show
 * registration, last-sign-in and vault-sync timestamps the way the viewer
 * experiences them, not in UTC. Aggregated daily metrics (DAU/WAU/chart bars)
 * stay UTC because they're aggregated server-side by UTC calendar day.
 */
export function formatAdminDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
