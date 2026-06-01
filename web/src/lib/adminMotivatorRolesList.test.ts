import { describe, expect, it } from 'vitest'
import {
  parseAdminActivityChartResponse,
  parseAdminKpiTrendResponse,
  parseAdminOverviewResponse,
  parseMotivatorRoleListResponse,
} from './adminMotivatorRolesList'

describe('parseMotivatorRoleListResponse', () => {
  // TS-107
  it('не массив → null', () => {
    expect(parseMotivatorRoleListResponse({})).toBeNull()
    expect(parseMotivatorRoleListResponse(null)).toBeNull()
  })

  // TS-108
  it('неизвестная роль нормализуется до user', () => {
    const out = parseMotivatorRoleListResponse([
      { id: 'u1', email: 'a@b.c', created_at: '2026-01-01', motivator_role: 'superadmin' },
    ])
    expect(out).not.toBeNull()
    expect(out![0].motivator_role).toBe('user')
  })
})

describe('parseAdminActivityChartResponse', () => {
  // TS-109
  it('нет поля series → null', () => {
    expect(parseAdminActivityChartResponse({ days: 7, role: 'all' })).toBeNull()
  })
})

describe('parseAdminOverviewResponse', () => {
  // TS-110
  it('отсутствует total_users → null', () => {
    const raw = {
      registered_last_7d: 0,
      signed_in_last_7d: 0,
      with_vault: 0,
      without_vault: 0,
      vault_stale_14d: 0,
      with_push: 0,
      defect_submissions_7d: 0,
      stale_vault_days: 14,
      by_role: { admin: 0, beta_tester: 0, user: 0 },
    }
    expect(parseAdminOverviewResponse(raw)).toBeNull()
  })
})

describe('parseAdminKpiTrendResponse', () => {
  // TS-111
  it("неизвестная метрика 'unknown' → null", () => {
    expect(parseAdminKpiTrendResponse({ metric: 'unknown', series: [] })).toBeNull()
  })
})
