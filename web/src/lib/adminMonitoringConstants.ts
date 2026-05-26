/** Must match `STALE_VAULT_DAYS` in `web/supabase/functions/admin-motivator-roles/index.ts`. */
export const STALE_VAULT_DAYS = 14

/** Retention for `admin_user_activity_daily` (manual/cron DELETE in README). */
export const ACTIVITY_RETENTION_DAYS = 90

export const ACTIVITY_PING_THROTTLE_MS = 60 * 60 * 1000

export const ACTIVITY_CHART_DAY_OPTIONS = [7, 30, 90] as const
export type ActivityChartDays = (typeof ACTIVITY_CHART_DAY_OPTIONS)[number]

export type ActivityChartRoleFilter = 'all' | 'admin' | 'beta_tester' | 'user'
