import { describe, expect, it } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import {
  type AuthSessionLike,
  isMotivatorAdmin,
  isMotivatorBetaTester,
  isMotivatorTesterOrAdmin,
  motivatorAppRole,
} from './motivatorRole'

function sessionWithRole(role: unknown): Session {
  return { user: { app_metadata: { motivator_role: role } } } as unknown as Session
}

/** Minimal API-built session shape — no full Supabase Session cast. */
function minimalApiSession(role: string): AuthSessionLike {
  return { user: { app_metadata: { motivator_role: role } } }
}

describe('motivatorAppRole', () => {
  // TS-075
  it('null → user', () => {
    expect(motivatorAppRole(null)).toBe('user')
  })

  // TS-076
  it("motivator_role='admin' → admin", () => {
    expect(motivatorAppRole(sessionWithRole('admin'))).toBe('admin')
  })

  // TS-077
  it("неизвестная роль 'superuser' → user (fallback)", () => {
    expect(motivatorAppRole(sessionWithRole('superuser'))).toBe('user')
  })

  it('minimal API session with admin role → admin', () => {
    expect(motivatorAppRole(minimalApiSession('admin'))).toBe('admin')
  })

  it('minimal API session with beta_tester role → beta_tester', () => {
    expect(motivatorAppRole(minimalApiSession('beta_tester'))).toBe('beta_tester')
  })
})

describe('isMotivatorAdmin', () => {
  it('admin → true; user and beta_tester → false', () => {
    expect(isMotivatorAdmin(minimalApiSession('admin'))).toBe(true)
    expect(isMotivatorAdmin(minimalApiSession('user'))).toBe(false)
    expect(isMotivatorAdmin(minimalApiSession('beta_tester'))).toBe(false)
    expect(isMotivatorAdmin(null)).toBe(false)
  })
})

describe('isMotivatorBetaTester', () => {
  it('beta_tester → true; user and admin → false', () => {
    expect(isMotivatorBetaTester(minimalApiSession('beta_tester'))).toBe(true)
    expect(isMotivatorBetaTester(minimalApiSession('user'))).toBe(false)
    expect(isMotivatorBetaTester(minimalApiSession('admin'))).toBe(false)
    expect(isMotivatorBetaTester(null)).toBe(false)
  })
})

describe('isMotivatorTesterOrAdmin', () => {
  // TS-078
  it('beta_tester → true; user → false', () => {
    expect(isMotivatorTesterOrAdmin(sessionWithRole('beta_tester'))).toBe(true)
    expect(isMotivatorTesterOrAdmin(sessionWithRole('user'))).toBe(false)
  })
})
