import type { MotivatorRoleRow } from '@/components/AdminMotivatorRolePanel'

const MS_PER_DAY = 86_400_000

export type AdminUsersSegmentFilter =
  | 'all'
  | 'inactive7'
  | 'inactive30'
  | 'role_admin'
  | 'role_beta'
  | 'role_user'

export type AdminAuthKpis = {
  total: number
  registeredLast7d: number
  signedInLast7d: number
  roleAdmin: number
  roleBeta: number
  roleUser: number
}

function daysAgoMs(days: number, now = Date.now()): number {
  return now - days * MS_PER_DAY
}

function parseTime(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

export function computeAdminAuthKpis(users: MotivatorRoleRow[], now = Date.now()): AdminAuthKpis {
  const regCutoff = daysAgoMs(7, now)
  const signCutoff = daysAgoMs(7, now)
  let registeredLast7d = 0
  let signedInLast7d = 0
  let roleAdmin = 0
  let roleBeta = 0
  let roleUser = 0

  for (const u of users) {
    const created = parseTime(u.created_at)
    if (created != null && created >= regCutoff) registeredLast7d++
    const sign = parseTime(u.last_sign_in_at)
    if (sign != null && sign >= signCutoff) signedInLast7d++
    if (u.motivator_role === 'admin') roleAdmin++
    else if (u.motivator_role === 'beta_tester') roleBeta++
    else roleUser++
  }

  return {
    total: users.length,
    registeredLast7d,
    signedInLast7d,
    roleAdmin,
    roleBeta,
    roleUser,
  }
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

  const sign = parseTime(user.last_sign_in_at)
  const cutoff = segment === 'inactive7' ? daysAgoMs(7, now) : daysAgoMs(30, now)
  if (sign == null) return true
  return sign < cutoff
}
