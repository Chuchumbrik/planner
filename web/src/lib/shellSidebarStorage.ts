const STORAGE_KEY = 'motivator_shell_sidebar_collapsed_v1'

export function readShellSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeShellSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    /* ignore quota / private mode */
  }
}
