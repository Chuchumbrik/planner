import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { motivatorAppRole } from '@/lib/motivatorRole'
import { useVault } from '@/vault/VaultProvider'

type ShellAccountFooterProps = {
  /** Desktop sidebar icon-only mode. */
  collapsed?: boolean
}

export function ShellAccountFooter({ collapsed = false }: ShellAccountFooterProps) {
  const { t } = useTranslation()
  const { signOut, session } = useAuth()
  const { lock } = useVault()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const accountEmail = session?.user?.email?.trim() ?? ''
  const accountRoleLabel = useMemo(() => {
    const r = motivatorAppRole(session)
    if (r === 'admin') return t('shell.roleLabelAdmin')
    if (r === 'beta_tester') return t('shell.roleLabelBetaTester')
    return t('shell.roleLabelUser')
  }, [session, t])

  useEffect(() => {
    if (!menuOpen) return
    function handlePointerDown(e: MouseEvent) {
      const node = menuRef.current
      if (node && !node.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  async function handleSignOut() {
    if (!window.confirm(t('settings.signOutConfirm'))) return
    setMenuOpen(false)
    lock()
    await signOut()
  }

  const accountSummaryTitle = accountEmail
    ? `${accountEmail} · ${t('app.accountMenuRoleLine', { role: accountRoleLabel })}`
    : t('app.accountMenuAria')

  return (
    <div
      className={cn(
        'border-t border-surface-variant/80 pb-md pt-md',
        collapsed ? 'px-2' : 'px-md',
      )}
      aria-label={t('shell.accountFooterAria')}
    >
      <div ref={menuRef} className="relative">
        <button
          type="button"
          className={cn(
            'flex w-full items-center rounded-lg py-2 text-left transition-colors',
            'hover:bg-surface-container-high',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            menuOpen && 'bg-surface-container-high',
            collapsed ? 'justify-center px-0' : 'gap-3 px-2',
          )}
          aria-label={t('shell.accountFooterOpenMenuAria')}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          title={collapsed ? accountSummaryTitle : undefined}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-on-surface-variant"
            aria-hidden
          >
            <MaterialIcon name="account_circle" size={24} />
          </div>
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                {accountEmail ? (
                  <p className="truncate text-label-md text-on-surface" title={accountEmail}>
                    {accountEmail}
                  </p>
                ) : (
                  <p className="truncate text-label-md text-on-surface">{t('app.accountMenuAria')}</p>
                )}
                <p
                  className="mt-0.5 truncate text-label-sm text-on-surface-variant"
                  title={t('app.accountMenuRoleLine', { role: accountRoleLabel })}
                >
                  {accountRoleLabel}
                </p>
              </div>
              <MaterialIcon
                name="expand_more"
                size={22}
                className={cn(
                  'shrink-0 text-on-surface-variant transition-transform',
                  menuOpen && 'rotate-180',
                )}
                aria-hidden
              />
            </>
          ) : null}
        </button>

        {menuOpen ? (
          <div
            className="absolute inset-x-0 bottom-full z-50 mb-1 overflow-hidden rounded-lg border border-surface-variant bg-surface-container-low py-1 shadow-xl"
            role="menu"
            aria-label={t('app.accountMenuAria')}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-3 py-2.5 text-left text-label-md text-error transition-colors hover:bg-error-container/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
              onClick={() => void handleSignOut()}
            >
              {t('settings.signOut')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
