import type { AdminOverview } from '@/types/adminMonitoring'

/**
 * Share of users who haven't been active in the last 30 days:
 *   (1 − MAU ÷ total) × 100, clamped to [0, 100].
 *
 * Clamping protects against backend inconsistencies (e.g. MAU > total during a
 * pipeline race) that would otherwise render a negative percentage.
 */
export function computeInactivePercent(o: AdminOverview | null, loadBusy: boolean): string {
  if (loadBusy) return '…'
  if (!o || o.total_users === 0) return '—'
  const raw = (1 - o.mau_30d / o.total_users) * 100
  const clamped = Math.min(100, Math.max(0, raw))
  return `${clamped.toFixed(1)}%`
}
