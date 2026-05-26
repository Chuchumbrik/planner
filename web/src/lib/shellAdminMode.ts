/** Sidebar switches to admin sub-nav on these routes (admin role only). */
export function isShellAdminMode(pathname: string, _hash: string, isAdmin: boolean): boolean {
  if (!isAdmin) return false
  return (
    pathname === '/prototype/admin-dashboard' ||
    pathname === '/admin/access' ||
    pathname === '/admin/roadmap'
  )
}
