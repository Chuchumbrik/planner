import { STALE_VAULT_DAYS } from '@/lib/adminMonitoringConstants'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'

const MS_PER_DAY = 86_400_000

export type AdminUsersSegmentFilter =
  | 'all'
  | 'inactive7'
  | 'inactive30'
  | 'role_admin'
  | 'role_beta'
  | 'role_user'
  | 'no_vault'
  | 'vault_stale_14d'
  | 'with_push'

function daysAgoMs(days: number, now = Date.now()): number {
  return now - days * MS_PER_DAY
}

function parseTime(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

export function isVaultStale(user: MotivatorRoleRow, now = Date.now()): boolean {
  if (!user.has_vault) return false
  const t = parseTime(user.vault_updated_at)
  if (t == null) return true
  return t < now - STALE_VAULT_DAYS * MS_PER_DAY
}

export function compareUsersByLastSignIn(a: MotivatorRoleRow, b: MotivatorRoleRow): number {
  const ta = parseTime(a.last_sign_in_at)
  const tb = parseTime(b.last_sign_in_at)
  if (ta == null && tb == null) return a.email.localeCompare(b.email)
  if (ta == null) return 1
  if (tb == null) return -1
  if (tb !== ta) return tb - ta
  return a.email.localeCompare(b.email)
}

export function userMatchesSegment(
  user: MotivatorRoleRow,
  segment: AdminUsersSegmentFilter,
  now = Date.now(),
): boolean {
  if (segment === 'all') return true
  if (segment === 'role_admin') return user.motivator_role === 'admin'
  if (segment === 'role_beta') return user.motivator_role === 'beta_tester'
  if (segment === 'role_user') return user.motivator_role === 'user'
  if (segment === 'no_vault') return !user.has_vault
  if (segment === 'vault_stale_14d') return isVaultStale(user, now)
  if (segment === 'with_push') return user.push_device_count > 0

  const sign = parseTime(user.last_sign_in_at)
  if (sign == null) return false
  const cutoff = segment === 'inactive7' ? daysAgoMs(7, now) : daysAgoMs(30, now)
  return sign < cutoff
}

export function isInactiveForDays(user: MotivatorRoleRow, days: number, now = Date.now()): boolean {
  const sign = parseTime(user.last_sign_in_at)
  if (sign == null) return true
  return sign < daysAgoMs(days, now)
}

export type UserSortField = 'last_sign_in' | 'created' | 'email' | 'role'

const ROLE_ORDER: Record<MotivatorRoleRow['motivator_role'], number> = {
  admin: 0,
  beta_tester: 1,
  user: 2,
}

export function buildUserComparator(
  field: UserSortField,
  dir: 'asc' | 'desc',
): (a: MotivatorRoleRow, b: MotivatorRoleRow) => number {
  const sign = dir === 'asc' ? 1 : -1
  return (a, b) => {
    let cmp = 0
    if (field === 'last_sign_in') {
      const ta = parseTime(a.last_sign_in_at)
      const tb = parseTime(b.last_sign_in_at)
      if (ta == null && tb == null) cmp = 0
      else if (ta == null) cmp = 1
      else if (tb == null) cmp = -1
      else cmp = ta - tb
    } else if (field === 'created') {
      const ta = parseTime(a.created_at)
      const tb = parseTime(b.created_at)
      if (ta == null && tb == null) cmp = 0
      else if (ta == null) cmp = 1
      else if (tb == null) cmp = -1
      else cmp = ta - tb
    } else if (field === 'email') {
      cmp = a.email.localeCompare(b.email)
    } else if (field === 'role') {
      cmp = ROLE_ORDER[a.motivator_role] - ROLE_ORDER[b.motivator_role]
    }
    return cmp * sign || a.email.localeCompare(b.email)
  }
}
