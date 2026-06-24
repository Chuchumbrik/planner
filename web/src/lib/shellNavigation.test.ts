import { describe, it, expect } from 'vitest'
import {
  SHELL_MAIN_NAV,
  SHELL_SETTINGS_NAV,
  SHELL_ADMIN_NAV,
  SHELL_PREVIEW_NAV,
  SHELL_ADMIN_ONLY_PREVIEW_NAV,
  shellTitleKey,
  shellPreviewNavForUser,
  shellAdminNavForUser,
} from './shellNavigation'
import { isShellAdminMode } from '@/lib/shellAdminMode'

// ── SHELL_MAIN_NAV — routes & icons ──────────────────────────────────────────

describe('SHELL_MAIN_NAV', () => {
  it('contains planner and reports', () => {
    const ids = SHELL_MAIN_NAV.map((i) => i.id)
    expect(ids).toContain('planner')
    expect(ids).toContain('reports')
  })

  it('planner route is /app with end=true', () => {
    const planner = SHELL_MAIN_NAV.find((i) => i.id === 'planner')!
    expect(planner.to).toBe('/app')
    expect(planner.end).toBe(true)
  })

  it('reports route is /app/reports', () => {
    const reports = SHELL_MAIN_NAV.find((i) => i.id === 'reports')!
    expect(reports.to).toBe('/app/reports')
  })
})

// ── SHELL_SETTINGS_NAV ────────────────────────────────────────────────────────

describe('SHELL_SETTINGS_NAV', () => {
  it('has id=settings and route /settings', () => {
    expect(SHELL_SETTINGS_NAV.id).toBe('settings')
    expect(SHELL_SETTINGS_NAV.to).toBe('/settings')
  })
})

// ── shellTitleKey ─────────────────────────────────────────────────────────────

describe('shellTitleKey', () => {
  it.each([
    ['planner', 'shell.title.planner'],
    ['reports', 'shell.title.reports'],
    ['settings', 'shell.title.settings'],
  ])('%s → %s', (navId, expected) => {
    expect(shellTitleKey(navId as never)).toBe(expected)
  })

  it('prototype-deep-focus → prototype.deepFocus.title', () => {
    expect(shellTitleKey('prototype-deep-focus')).toBe('prototype.deepFocus.title')
  })

  it('prototype-ai-insights → prototype.aiInsights.title', () => {
    expect(shellTitleKey('prototype-ai-insights')).toBe('prototype.aiInsights.title')
  })

  it('prototype-meetings → prototype.meetings.title', () => {
    expect(shellTitleKey('prototype-meetings')).toBe('prototype.meetings.title')
  })

  it('prototype-admin → prototype.admin.title', () => {
    expect(shellTitleKey('prototype-admin')).toBe('prototype.admin.title')
  })
})

// ── shellPreviewNavForUser ────────────────────────────────────────────────────

describe('shellPreviewNavForUser', () => {
  it('admin gets preview nav plus admin-only module prototype', () => {
    const nav = shellPreviewNavForUser(true)
    expect(nav).toEqual([...SHELL_PREVIEW_NAV, ...SHELL_ADMIN_ONLY_PREVIEW_NAV])
  })

  it('non-admin does not get meetings prototype entry', () => {
    const nav = shellPreviewNavForUser(false)
    expect(nav.find((i) => i.id === 'prototype-meetings')).toBeUndefined()
  })

  it('non-admin: prototype-admin entry points to /admin/testing', () => {
    const nav = shellPreviewNavForUser(false)
    const adminEntry = nav.find((i) => i.id === 'prototype-admin')!
    expect(adminEntry.to).toBe('/admin/testing')
  })

  it('non-admin: same item count as admin minus admin-only previews', () => {
    expect(shellPreviewNavForUser(false)).toHaveLength(
      shellPreviewNavForUser(true).length - SHELL_ADMIN_ONLY_PREVIEW_NAV.length,
    )
  })

  it('non-admin: non-admin-dashboard items are unchanged', () => {
    const admin = shellPreviewNavForUser(true)
    const nonAdmin = shellPreviewNavForUser(false)
    const deepFocusAdmin = admin.find((i) => i.id === 'prototype-deep-focus')
    const deepFocusNonAdmin = nonAdmin.find((i) => i.id === 'prototype-deep-focus')
    expect(deepFocusAdmin).toEqual(deepFocusNonAdmin)
  })
})

// ── shellAdminNavForUser ──────────────────────────────────────────────────────

describe('shellAdminNavForUser', () => {
  it('admin gets all items: dashboard, roadmap, discussions, testing', () => {
    const nav = shellAdminNavForUser(true)
    expect(nav.map((i) => i.id)).toEqual([
      'admin-dashboard',
      'admin-roadmap',
      'admin-discussions',
      'admin-testing',
    ])
  })

  it('non-admin gets roadmap, discussions and testing (no dashboard)', () => {
    const nav = shellAdminNavForUser(false)
    expect(nav.map((i) => i.id)).toEqual(['admin-roadmap', 'admin-discussions', 'admin-testing'])
    expect(nav.find((i) => i.id === 'admin-dashboard')).toBeUndefined()
  })

  it('SHELL_ADMIN_NAV has correct routes', () => {
    const byId = Object.fromEntries(SHELL_ADMIN_NAV.map((i) => [i.id, i.to]))
    expect(byId['admin-dashboard']).toBe('/admin/dashboard')
    expect(byId['admin-roadmap']).toBe('/admin/roadmap')
    expect(byId['admin-discussions']).toBe('/admin/discussions')
    expect(byId['admin-testing']).toBe('/admin/testing')
  })
})

// ── isShellAdminMode ──────────────────────────────────────────────────────────

describe('isShellAdminMode', () => {
  it('admin at /admin/dashboard → true', () => {
    expect(isShellAdminMode('/admin/dashboard', '', { isAdmin: true, canAccessQaTools: false })).toBe(true)
  })

  it('admin at /admin/roadmap → true', () => {
    expect(isShellAdminMode('/admin/roadmap', '', { isAdmin: true, canAccessQaTools: false })).toBe(true)
  })

  it('beta_tester at /admin/testing → true (via canAccessQaTools)', () => {
    expect(isShellAdminMode('/admin/testing', '', { isAdmin: false, canAccessQaTools: true })).toBe(true)
  })

  it('beta_tester at /admin/roadmap → true (via canAccessQaTools)', () => {
    expect(isShellAdminMode('/admin/roadmap', '', { isAdmin: false, canAccessQaTools: true })).toBe(true)
  })

  it('admin at /app → false', () => {
    expect(isShellAdminMode('/app', '', { isAdmin: true, canAccessQaTools: false })).toBe(false)
  })

  it('non-admin at /admin/dashboard → false', () => {
    expect(isShellAdminMode('/admin/dashboard', '', { isAdmin: false, canAccessQaTools: false })).toBe(false)
  })

  it('unauthenticated at /admin/testing → false', () => {
    expect(isShellAdminMode('/admin/testing', '', { isAdmin: false, canAccessQaTools: false })).toBe(false)
  })

  it('/admin/dashboard with canAccessQaTools but not isAdmin → false', () => {
    // canAccessQaTools only grants access to /admin/testing and /admin/roadmap, not /admin/dashboard
    expect(isShellAdminMode('/admin/dashboard', '', { isAdmin: false, canAccessQaTools: true })).toBe(false)
  })
})
