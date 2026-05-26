export type ShellAdminModeOptions = {
  isAdmin: boolean
  /** admin или beta_tester — доступ к /admin/testing */
  canAccessQaTools: boolean
}

/** Sidebar: админ-подменю на маршрутах админ-панели. */
export function isShellAdminMode(
  pathname: string,
  _hash: string,
  { isAdmin, canAccessQaTools }: ShellAdminModeOptions,
): boolean {
  if (pathname === '/admin/testing' && canAccessQaTools) return true
  if (!isAdmin) return false
  return (
    pathname === '/prototype/admin-dashboard' ||
    pathname === '/admin/access' ||
    pathname === '/admin/roadmap'
  )
}
