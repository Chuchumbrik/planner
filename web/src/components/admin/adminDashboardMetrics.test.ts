import { describe, expect, it } from 'vitest'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'
import { isVaultStale, userMatchesSegment } from '@/components/admin/adminDashboardMetrics'

const now = new Date('2026-05-26T12:00:00Z').getTime()

function row(partial: Partial<MotivatorRoleRow> & Pick<MotivatorRoleRow, 'id'>): MotivatorRoleRow {
  return {
    email: 'a@test.com',
    created_at: '2026-01-01T00:00:00Z',
    last_sign_in_at: '2026-05-20T00:00:00Z',
    motivator_role: 'user',
    has_vault: false,
    vault_updated_at: null,
    push_device_count: 0,
    push_last_seen_at: null,
    defect_submission_count: 0,
    defect_last_at: null,
    ...partial,
  }
}

describe('adminDashboardMetrics', () => {
  it('isVaultStale when vault updated long ago', () => {
    const fresh = row({ id: '1', has_vault: true, vault_updated_at: '2026-05-25T00:00:00Z' })
    const stale = row({ id: '2', has_vault: true, vault_updated_at: '2026-01-01T00:00:00Z' })
    expect(isVaultStale(fresh, now)).toBe(false)
    expect(isVaultStale(stale, now)).toBe(true)
    expect(isVaultStale(row({ id: '3' }), now)).toBe(false)
  })

  it('userMatchesSegment vault and push filters', () => {
    expect(userMatchesSegment(row({ id: 'a' }), 'no_vault', now)).toBe(true)
    expect(userMatchesSegment(row({ id: 'b', has_vault: true }), 'no_vault', now)).toBe(false)
    expect(userMatchesSegment(row({ id: 'c', push_device_count: 2 }), 'with_push', now)).toBe(true)
    expect(
      userMatchesSegment(
        row({ id: 'd', has_vault: true, vault_updated_at: '2026-01-01T00:00:00Z' }),
        'vault_stale_14d',
        now,
      ),
    ).toBe(true)
  })
})
