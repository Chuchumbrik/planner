import type { AdminOverview, MotivatorRoleRow } from '@/types/adminMonitoring'

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
    stale_vault_days: o.stale_vault_days,
    by_role: {
      admin: typeof role.admin === 'number' ? role.admin : 0,
      beta_tester: typeof role.beta_tester === 'number' ? role.beta_tester : 0,
      user: typeof role.user === 'number' ? role.user : 0,
    },
  }
}
