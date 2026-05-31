import type {
  AdminActivityChart,
  AdminActivityDayDetail,
  AdminKpiTrend,
  AdminKpiTrendPoint,
  AdminOverview,
  MotivatorRoleRow,
} from '@/types/adminMonitoring'

function parseMonitoringFields(o: Record<string, unknown>): Omit<
  MotivatorRoleRow,
  'id' | 'email' | 'created_at' | 'last_sign_in_at' | 'motivator_role'
> {
  return {
    has_vault: o.has_vault === true,
    vault_updated_at:
      o.vault_updated_at === null
        ? null
        : typeof o.vault_updated_at === 'string'
          ? o.vault_updated_at
          : null,
    push_device_count: typeof o.push_device_count === 'number' ? o.push_device_count : 0,
    push_last_seen_at:
      o.push_last_seen_at === null
        ? null
        : typeof o.push_last_seen_at === 'string'
          ? o.push_last_seen_at
          : null,
    defect_submission_count:
      typeof o.defect_submission_count === 'number' ? o.defect_submission_count : 0,
    defect_last_at:
      o.defect_last_at === null ? null : typeof o.defect_last_at === 'string' ? o.defect_last_at : null,
  }
}

export function parseMotivatorRoleListResponse(raw: unknown): MotivatorRoleRow[] | null {
  if (!Array.isArray(raw)) return null
  const next: MotivatorRoleRow[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : ''
    const email = typeof o.email === 'string' ? o.email : ''
    const created_at = typeof o.created_at === 'string' ? o.created_at : ''
    const last_sign_in_at =
      o.last_sign_in_at === null ? null : typeof o.last_sign_in_at === 'string' ? o.last_sign_in_at : null
    const r = o.motivator_role
    const motivator_role =
      r === 'admin' || r === 'beta_tester' || r === 'user' ? r : ('user' as const)
    if (id) next.push({ id, email, created_at, last_sign_in_at, motivator_role, ...parseMonitoringFields(o) })
  }
  return next
}

export function parseAdminActivityChartResponse(raw: unknown): AdminActivityChart | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const seriesRaw = o.series
  if (typeof o.days !== 'number' || !Array.isArray(seriesRaw)) return null
  const role = o.role
  if (role !== 'all' && role !== 'admin' && role !== 'beta_tester' && role !== 'user') return null
  const series: AdminActivityChart['series'] = []
  for (const item of seriesRaw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    if (typeof row.date === 'string' && typeof row.unique_users === 'number') {
      series.push({ date: row.date, unique_users: row.unique_users })
    }
  }
  if (series.length === 0 && seriesRaw.length > 0) return null
  const peakRaw = o.peak
  const peak: AdminActivityChart['peak'] =
    peakRaw && typeof peakRaw === 'object'
      ? (() => {
          const p = peakRaw as Record<string, unknown>
          return typeof p.date === 'string' && typeof p.count === 'number'
            ? { date: p.date, count: p.count }
            : null
        })()
      : null

  return {
    days: o.days,
    role,
    timezone: 'UTC',
    series,
    peak,
    dau_today: typeof o.dau_today === 'number' ? o.dau_today : 0,
    wau: typeof o.wau === 'number' ? o.wau : 0,
  }
}

export function parseAdminActivityDayDetailResponse(raw: unknown): AdminActivityDayDetail | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.date !== 'string') return null
  const role = o.role
  if (role !== 'all' && role !== 'admin' && role !== 'beta_tester' && role !== 'user') return null
  const usersRaw = o.users
  if (!Array.isArray(usersRaw)) return null
  const users: AdminActivityDayDetail['users'] = []
  for (const item of usersRaw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const user_id = typeof row.user_id === 'string' ? row.user_id : ''
    const email = typeof row.email === 'string' ? row.email : ''
    const r = row.motivator_role
    const motivator_role =
      r === 'admin' || r === 'beta_tester' || r === 'user' ? r : ('user' as const)
    const first_seen_at = typeof row.first_seen_at === 'string' ? row.first_seen_at : ''
    const last_seen_at = typeof row.last_seen_at === 'string' ? row.last_seen_at : ''
    if (user_id && first_seen_at && last_seen_at) {
      users.push({ user_id, email, motivator_role, first_seen_at, last_seen_at })
    }
  }
  return {
    date: o.date,
    role,
    timezone: 'UTC',
    users,
  }
}

export function parseAdminOverviewResponse(raw: unknown): AdminOverview | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const br = o.by_role
  if (
    typeof o.total_users !== 'number' ||
    typeof o.registered_last_7d !== 'number' ||
    typeof o.signed_in_last_7d !== 'number' ||
    typeof o.with_vault !== 'number' ||
    typeof o.without_vault !== 'number' ||
    typeof o.vault_stale_14d !== 'number' ||
    typeof o.with_push !== 'number' ||
    typeof o.defect_submissions_7d !== 'number' ||
    typeof o.stale_vault_days !== 'number' ||
    !br ||
    typeof br !== 'object'
  ) {
    return null
  }
  const role = br as Record<string, unknown>
  return {
    total_users: o.total_users,
    registered_last_7d: o.registered_last_7d,
    signed_in_last_7d: o.signed_in_last_7d,
    with_vault: o.with_vault,
    without_vault: o.without_vault,
    vault_stale_14d: o.vault_stale_14d,
    with_push: o.with_push,
    defect_submissions_7d: o.defect_submissions_7d,
    mau_30d: typeof o.mau_30d === 'number' ? o.mau_30d : 0,
    stale_vault_days: o.stale_vault_days,
    by_role: {
      admin: typeof role.admin === 'number' ? role.admin : 0,
      beta_tester: typeof role.beta_tester === 'number' ? role.beta_tester : 0,
      user: typeof role.user === 'number' ? role.user : 0,
    },
  }
}

export function parseAdminKpiTrendResponse(raw: unknown): AdminKpiTrend | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const metric = o.metric
  if (
    metric !== 'total_users' &&
    metric !== 'registrations' &&
    metric !== 'mau' &&
    metric !== 'churn'
  ) return null
  const rawSeries = o.series
  if (!Array.isArray(rawSeries)) return null
  const series: AdminKpiTrendPoint[] = rawSeries
    .filter((pt) => pt && typeof pt === 'object')
    .map((pt) => {
      const p = pt as Record<string, unknown>
      return {
        label: typeof p.label === 'string' ? p.label : '',
        value: typeof p.value === 'number' ? p.value : 0,
      }
    })
    .filter((pt) => pt.label !== '')
  return {
    metric,
    series,
    unit: typeof o.unit === 'string' ? o.unit : undefined,
    table_missing: o.table_missing === true,
  }
}
