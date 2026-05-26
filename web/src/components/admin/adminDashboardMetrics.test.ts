import { describe, expect, it } from 'vitest'
import type { MotivatorRoleRow } from '@/components/AdminMotivatorRolePanel'
import {
  computeAdminAuthKpis,
  userMatchesSegment,
} from '@/components/admin/adminDashboardMetrics'

const now = new Date('2026-05-26T12:00:00Z').getTime()

function row(partial: Partial<MotivatorRoleRow> & Pick<MotivatorRoleRow, 'id'>): MotivatorRoleRow {
  return {
    email: 'a@test.com',
    created_at: '2026-01-01T00:00:00Z',
    last_sign_in_at: '2026-05-20T00:00:00Z',
    motivator_role: 'user',
    ...partial,
  }
}

describe('adminDashboardMetrics', () => {
  it('computeAdminAuthKpis counts roles and windows', () => {
    const users = [
      row({ id: '1', motivator_role: 'admin', created_at: '2026-05-24T00:00:00Z', last_sign_in_at: '2026-05-25T00:00:00Z' }),
      row({ id: '2', motivator_role: 'beta_tester', last_sign_in_at: null }),
      row({ id: '3', created_at: '2020-01-01T00:00:00Z', last_sign_in_at: '2026-01-01T00:00:00Z' }),
    ]
    const kpis = computeAdminAuthKpis(users, now)
    expect(kpis.total).toBe(3)
    expect(kpis.registeredLast7d).toBe(1)
    expect(kpis.signedInLast7d).toBe(1)
    expect(kpis.roleAdmin).toBe(1)
    expect(kpis.roleBeta).toBe(1)
    expect(kpis.roleUser).toBe(1)
  })

  it('userMatchesSegment inactive7', () => {
    const active = row({ id: 'a', last_sign_in_at: '2026-05-25T00:00:00Z' })
    const stale = row({ id: 'b', last_sign_in_at: '2026-01-01T00:00:00Z' })
    expect(userMatchesSegment(active, 'inactive7', now)).toBe(false)
    expect(userMatchesSegment(stale, 'inactive7', now)).toBe(true)
    expect(userMatchesSegment(row({ id: 'c', last_sign_in_at: null }), 'inactive7', now)).toBe(true)
  })
})
