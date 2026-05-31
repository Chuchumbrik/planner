import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { motivatorAppRole } from '@/lib/motivatorRole'
import { useVault } from '@/vault/VaultProvider'
import { APP_VERSION } from '@/version'

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
  const role = useMemo(() => motivatorAppRole(session), [session])
  const accountRoleLabel = useMemo(() => {
    if (role === 'admin') return t('shell.roleLabelAdmin')
    if (role === 'beta_tester') return t('shell.roleLabelBetaTester')
    return t('shell.roleLabelUser')
  }, [role, t])
  // Version is shown only to admin and beta — surfaces build SHA for bug
  // reports without exposing it to regular users.
  const showVersion = role === 'admin' || role === 'beta_tester'

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
            // Popup is adaptive — minimum 14rem so content always fits even
            // when the sidebar is collapsed (w-16). Doesn't grow past the
            // viewport: `max-w-[calc(100vw-2rem)]` caps width on small screens.
            // In collapsed mode the menu visually overflows the rail to the
            // right; that's intentional and matches user expectations for an
            // account dropdown.
            className="absolute bottom-full left-0 z-50 mb-1 min-w-[14rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-surface-variant bg-surface-container-low py-1 shadow-xl animate-admin-tab-in"
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

            {/* Version info — admin/beta only, below sign-out divider.
                APP_VERSION is `<semver>+<git-sha>`; we split on `+` so the
                build SHA wraps onto its own line for readability. */}
            {showVersion ? (
              <div
                className="border-t border-surface-variant/60 px-3 py-2 text-[11px] leading-tight text-on-surface-variant/70"
                role="presentation"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50">
                  {t('shell.accountMenuVersionLabel')}
                </p>
                <p className="mt-0.5 font-mono">{APP_VERSION.split('+')[0]}</p>
                {APP_VERSION.includes('+') ? (
                  <p className="font-mono text-on-surface-variant/50">
                    +{APP_VERSION.split('+').slice(1).join('+')}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
