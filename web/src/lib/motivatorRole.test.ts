import { describe, expect, it } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { isMotivatorTesterOrAdmin, motivatorAppRole } from './motivatorRole'

function sessionWithRole(role: unknown): Session {
  return { user: { app_metadata: { motivator_role: role } } } as unknown as Session
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
})

describe('isMotivatorTesterOrAdmin', () => {
  // TS-078
  it('beta_tester → true; user → false', () => {
    expect(isMotivatorTesterOrAdmin(sessionWithRole('beta_tester'))).toBe(true)
    expect(isMotivatorTesterOrAdmin(sessionWithRole('user'))).toBe(false)
  })
})
