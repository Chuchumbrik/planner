import { describe, expect, it } from 'vitest'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'
import {
  compareUsersByLastSignIn,
  isVaultStale,
  userMatchesSegment,
} from '@/components/admin/adminDashboardMetrics'

// Fixed reference point: 2026-05-26T12:00:00Z
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

// ── isVaultStale ──────────────────────────────────────────────────────────────

describe('isVaultStale', () => {
  it('returns false when vault synced recently', () => {
    const u = row({ id: '1', has_vault: true, vault_updated_at: '2026-05-25T00:00:00Z' })
    expect(isVaultStale(u, now)).toBe(false)
  })

  it('returns true when vault synced long ago', () => {
    const u = row({ id: '2', has_vault: true, vault_updated_at: '2026-01-01T00:00:00Z' })
    expect(isVaultStale(u, now)).toBe(true)
  })

  it('returns false when user has no vault', () => {
    expect(isVaultStale(row({ id: '3' }), now)).toBe(false)
  })

  it('returns true when has_vault but vault_updated_at is null', () => {
    // vault exists but no sync date recorded → treat as stale
    const u = row({ id: '4', has_vault: true, vault_updated_at: null })
    expect(isVaultStale(u, now)).toBe(true)
  })
})

// ── userMatchesSegment — vault and push ───────────────────────────────────────

describe('userMatchesSegment — vault and push', () => {
  it('no_vault: matches user without vault', () => {
    expect(userMatchesSegment(row({ id: 'a' }), 'no_vault', now)).toBe(true)
  })

  it('no_vault: does not match user with vault', () => {
    expect(userMatchesSegment(row({ id: 'b', has_vault: true }), 'no_vault', now)).toBe(false)
  })

  it('with_push: matches user with push devices', () => {
    expect(userMatchesSegment(row({ id: 'c', push_device_count: 2 }), 'with_push', now)).toBe(true)
  })

  it('with_push: does not match user without push', () => {
    expect(userMatchesSegment(row({ id: 'd' }), 'with_push', now)).toBe(false)
  })

  it('vault_stale_14d: matches user with stale vault', () => {
    const u = row({ id: 'e', has_vault: true, vault_updated_at: '2026-01-01T00:00:00Z' })
    expect(userMatchesSegment(u, 'vault_stale_14d', now)).toBe(true)
  })

  it('vault_stale_14d: matches user with vault but no sync date', () => {
    const u = row({ id: 'f', has_vault: true, vault_updated_at: null })
    expect(userMatchesSegment(u, 'vault_stale_14d', now)).toBe(true)
  })
})

// ── userMatchesSegment — roles ────────────────────────────────────────────────

describe('userMatchesSegment — roles', () => {
  it('role_admin: matches only admin', () => {
    expect(userMatchesSegment(row({ id: '1', motivator_role: 'admin' }), 'role_admin', now)).toBe(true)
    expect(userMatchesSegment(row({ id: '2', motivator_role: 'beta_tester' }), 'role_admin', now)).toBe(false)
    expect(userMatchesSegment(row({ id: '3' }), 'role_admin', now)).toBe(false)
  })

  it('role_beta: matches only beta_tester', () => {
    expect(userMatchesSegment(row({ id: '1', motivator_role: 'beta_tester' }), 'role_beta', now)).toBe(true)
    expect(userMatchesSegment(row({ id: '2' }), 'role_beta', now)).toBe(false)
  })

  it('role_user: matches only user', () => {
    expect(userMatchesSegment(row({ id: '1' }), 'role_user', now)).toBe(true)
    expect(userMatchesSegment(row({ id: '2', motivator_role: 'admin' }), 'role_user', now)).toBe(false)
  })
})

// ── userMatchesSegment — inactive filters ─────────────────────────────────────
// now = 2026-05-26T12:00:00Z
// inactive7 cutoff = 2026-05-19T12:00:00Z
// inactive30 cutoff = 2026-04-26T12:00:00Z

describe('userMatchesSegment — inactive7', () => {
  it('does not match user who signed in 6 days ago', () => {
    const u = row({ id: '1', last_sign_in_at: '2026-05-20T12:00:00Z' })
    expect(userMatchesSegment(u, 'inactive7', now)).toBe(false)
  })

  it('matches user who signed in 8 days ago', () => {
    const u = row({ id: '2', last_sign_in_at: '2026-05-18T12:00:00Z' })
    expect(userMatchesSegment(u, 'inactive7', now)).toBe(true)
  })

  it('does not match user who never signed in (null)', () => {
    const u = row({ id: '3', last_sign_in_at: null })
    expect(userMatchesSegment(u, 'inactive7', now)).toBe(false)
  })

  it('matches user who signed in exactly on the cutoff boundary', () => {
    // exactly 7 days ago = cutoff; sign === cutoff means sign < cutoff is false
    const u = row({ id: '4', last_sign_in_at: '2026-05-19T12:00:00Z' })
    expect(userMatchesSegment(u, 'inactive7', now)).toBe(false)
  })

  it('matches user who signed in one ms before the cutoff', () => {
    const u = row({ id: '5', last_sign_in_at: '2026-05-19T11:59:59.999Z' })
    expect(userMatchesSegment(u, 'inactive7', now)).toBe(true)
  })
})

describe('userMatchesSegment — inactive30', () => {
  it('does not match user who signed in 29 days ago', () => {
    const u = row({ id: '1', last_sign_in_at: '2026-04-27T12:00:00Z' })
    expect(userMatchesSegment(u, 'inactive30', now)).toBe(false)
  })

  it('matches user who signed in 31 days ago', () => {
    const u = row({ id: '2', last_sign_in_at: '2026-04-25T12:00:00Z' })
    expect(userMatchesSegment(u, 'inactive30', now)).toBe(true)
  })

  it('does not match user who never signed in (null)', () => {
    const u = row({ id: '3', last_sign_in_at: null })
    expect(userMatchesSegment(u, 'inactive30', now)).toBe(false)
  })
})

// ── compareUsersByLastSignIn ──────────────────────────────────────────────────

describe('compareUsersByLastSignIn', () => {
  it('sorts more recent sign-in first', () => {
    const a = row({ id: '1', last_sign_in_at: '2026-05-01T00:00:00Z' })
    const b = row({ id: '2', last_sign_in_at: '2026-05-20T00:00:00Z' })
    expect(compareUsersByLastSignIn(a, b)).toBeGreaterThan(0)
    expect(compareUsersByLastSignIn(b, a)).toBeLessThan(0)
  })

  it('sorts null last_sign_in_at after dated entries', () => {
    const dated = row({ id: '1', last_sign_in_at: '2026-05-01T00:00:00Z' })
    const never = row({ id: '2', last_sign_in_at: null })
    expect(compareUsersByLastSignIn(dated, never)).toBeLessThan(0)
    expect(compareUsersByLastSignIn(never, dated)).toBeGreaterThan(0)
  })

  it('falls back to email sort when both null', () => {
    const a = row({ id: '1', email: 'aaa@test.com', last_sign_in_at: null })
    const b = row({ id: '2', email: 'zzz@test.com', last_sign_in_at: null })
    expect(compareUsersByLastSignIn(a, b)).toBeLessThan(0)
  })

  it('falls back to email sort on equal sign-in time', () => {
    const ts = '2026-05-20T00:00:00Z'
    const a = row({ id: '1', email: 'aaa@test.com', last_sign_in_at: ts })
    const b = row({ id: '2', email: 'zzz@test.com', last_sign_in_at: ts })
    expect(compareUsersByLastSignIn(a, b)).toBeLessThan(0)
  })
})
