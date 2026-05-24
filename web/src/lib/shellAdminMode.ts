/** Sidebar switches to admin sub-nav on these routes (admin role only). */
export function isShellAdminMode(pathname: string, hash: string, isAdmin: boolean): boolean {
  if (!isAdmin) return false
  if (pathname === '/prototype/admin-dashboard') return true
  if (pathname === '/settings' && hash.replace(/^#/, '') === 'admin') return true
  return false
}
