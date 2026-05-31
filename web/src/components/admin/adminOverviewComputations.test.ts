import { describe, expect, it } from 'vitest'
import type { AdminOverview } from '@/types/adminMonitoring'
import { computeInactivePercent } from './adminOverviewComputations'

function overview(partial: Partial<AdminOverview> = {}): AdminOverview {
  return {
    total_users: 100,
    registered_last_7d: 5,
    signed_in_last_7d: 30,
    with_vault: 80,
    without_vault: 20,
    vault_stale_14d: 0,
    with_push: 50,
    defect_submissions_7d: 0,
    mau_30d: 70,
    by_role: { admin: 1, beta_tester: 5, user: 94 },
    stale_vault_days: 14,
    ...partial,
  }
}

describe('computeInactivePercent', () => {
  // TS-031
  it('returns — when total_users is 0', () => {
    expect(computeInactivePercent(overview({ total_users: 0, mau_30d: 0 }), false)).toBe('—')
  })

  // TS-032: MAU > total — clamp не уходит в минус
  it('returns 0.0% when mau_30d exceeds total_users', () => {
    expect(computeInactivePercent(overview({ total_users: 100, mau_30d: 150 }), false)).toBe('0.0%')
  })

  // TS-033: MAU === total — ровно 0%
  it('returns 0.0% when mau_30d equals total_users', () => {
    expect(computeInactivePercent(overview({ total_users: 200, mau_30d: 200 }), false)).toBe('0.0%')
  })

  // TS-034: MAU === 0 — ровно 100%
  it('returns 100.0% when mau_30d is 0 and total_users > 0', () => {
    expect(computeInactivePercent(overview({ total_users: 500, mau_30d: 0 }), false)).toBe('100.0%')
  })

  it('returns … when loadBusy is true regardless of overview', () => {
    expect(computeInactivePercent(overview({ total_users: 100, mau_30d: 70 }), true)).toBe('…')
  })

  it('returns — when overview is null', () => {
    expect(computeInactivePercent(null, false)).toBe('—')
  })

  it('computes mid-range value correctly', () => {
    // 1 - 180/250 = 0.28 = 28.0%
    expect(computeInactivePercent(overview({ total_users: 250, mau_30d: 180 }), false)).toBe('28.0%')
  })

  it('loadBusy=true takes priority even when total_users is 0', () => {
    expect(computeInactivePercent(overview({ total_users: 0, mau_30d: 0 }), true)).toBe('…')
  })
})
