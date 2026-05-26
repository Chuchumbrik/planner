export type ShellAdminModeOptions = {
  isAdmin: boolean
  /** admin или beta_tester — /admin/testing и /admin/roadmap */
  canAccessQaTools: boolean
}

/** Sidebar: админ-подменю на маршрутах админ-панели. */
export function isShellAdminMode(
  pathname: string,
  _hash: string,
  { isAdmin, canAccessQaTools }: ShellAdminModeOptions,
): boolean {
  if (canAccessQaTools && (pathname === '/admin/testing' || pathname === '/admin/roadmap')) {
    return true
  }
  if (!isAdmin) return false
  return pathname === '/admin/dashboard' || pathname === '/admin/roadmap'
}
