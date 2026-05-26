/** Sidebar / shell navigation — primary MVP routes + Design 2.0 preview screens. */

export type MotivatorNavId =
  | 'planner'
  | 'reports'
  | 'settings'
  | 'prototype-deep-focus'
  | 'prototype-ai-insights'
  | 'prototype-admin'

export type ShellNavItem = {
  id: MotivatorNavId
  to: string
  icon: string
  labelKey: string
  /** React Router `end` on NavLink (planner only). */
  end?: boolean
}

/** Top of sidebar / mobile bottom bar — core product areas (settings is separate, bottom of sidebar). */
export const SHELL_MAIN_NAV: ShellNavItem[] = [
  { id: 'planner', to: '/app', icon: 'event_note', labelKey: 'shell.navPlanner', end: true },
  { id: 'reports', to: '/app/reports', icon: 'analytics', labelKey: 'shell.navReports' },
]

export const SHELL_SETTINGS_NAV: ShellNavItem = {
  id: 'settings',
  to: '/settings',
  icon: 'settings',
  labelKey: 'shell.navSettings',
}

/** @deprecated Use SHELL_MAIN_NAV + SHELL_SETTINGS_NAV; kept for mobile bottom bar composition. */
export const SHELL_PRIMARY_NAV: ShellNavItem[] = [...SHELL_MAIN_NAV, SHELL_SETTINGS_NAV]

export const SHELL_PREVIEW_NAV: ShellNavItem[] = [
  {
    id: 'prototype-deep-focus',
    to: '/prototype/deep-focus',
    icon: 'timer',
    labelKey: 'prototype.nav.deepFocus',
  },
  {
    id: 'prototype-ai-insights',
    to: '/prototype/ai-insights',
    icon: 'auto_awesome',
    labelKey: 'prototype.nav.aiInsights',
  },
  {
    id: 'prototype-admin',
    to: '/admin/dashboard',
    icon: 'dashboard',
    labelKey: 'prototype.nav.admin',
  },
]

export type ShellAdminNavItem = {
  id: 'admin-dashboard' | 'admin-roadmap' | 'admin-testing'
  to: string
  icon: string
  labelKey: string
}

/** Пункты админ-sidebar: у beta_tester — «Краткая сводка» и «Тестирование». */
export function shellAdminNavForUser(isAdmin: boolean): ShellAdminNavItem[] {
  if (isAdmin) return SHELL_ADMIN_NAV
  return SHELL_ADMIN_NAV.filter(
    (item) => item.id === 'admin-roadmap' || item.id === 'admin-testing',
  )
}

/** Превью в sidebar: у beta_tester «Админ-панель» ведёт на /admin/testing, без прототипа dashboard. */
export function shellPreviewNavForUser(isAdmin: boolean): ShellNavItem[] {
  if (isAdmin) return SHELL_PREVIEW_NAV
  return [
    ...SHELL_PREVIEW_NAV.filter((item) => item.id !== 'prototype-admin'),
    {
      id: 'prototype-admin',
      to: '/admin/testing',
      icon: 'science',
      labelKey: 'shell.navAdminPanel',
    },
  ]
}

export const SHELL_ADMIN_NAV: ShellAdminNavItem[] = [
  {
    id: 'admin-dashboard',
    to: '/admin/dashboard',
    icon: 'dashboard',
    labelKey: 'shell.adminNavDashboard',
  },
  {
    id: 'admin-roadmap',
    to: '/admin/roadmap',
    icon: 'map',
    labelKey: 'shell.adminNavRoadmap',
  },
  {
    id: 'admin-testing',
    to: '/admin/testing',
    icon: 'science',
    labelKey: 'shell.adminNavTesting',
  },
]

export function shellTitleKey(navId: MotivatorNavId): string {
  if (navId.startsWith('prototype-')) {
    const map: Record<string, string> = {
      'prototype-deep-focus': 'prototype.deepFocus.title',
      'prototype-ai-insights': 'prototype.aiInsights.title',
      'prototype-admin': 'prototype.admin.title',
    }
    return map[navId] ?? 'shell.title.settings'
  }
  return `shell.title.${navId}`
}
