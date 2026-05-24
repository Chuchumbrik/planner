import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { ProductRoadmapModal } from '@/components/ProductRoadmapModal'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { humanizeConnectivityError } from '@/lib/connectivityHints'
import { cn } from '@/lib/cn'
import { SETTINGS_BTN_SECONDARY } from '@/lib/designClasses'
import { motivatorAppRole } from '@/lib/motivatorRole'
import { formatSynced } from '@/lib/syncStatus'
import { useVault } from '@/vault/VaultProvider'

export function ShellHeaderActions() {
  const { t, i18n } = useTranslation()
  const { signOut, session } = useAuth()
  const {
    remoteError,
    retrySync,
    remoteHydrated,
    decryptFailed,
    savePending,
    lastSyncedAt,
    lock,
  } = useVault()

  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'
  const [syncPopoverOpen, setSyncPopoverOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false)
  const syncPopoverRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  const accountRoleLabel = useMemo(() => {
    const r = motivatorAppRole(session)
    if (r === 'admin') return t('shell.roleLabelAdmin')
    if (r === 'beta_tester') return t('shell.roleLabelBetaTester')
    return t('shell.roleLabelUser')
  }, [session, t])

  const syncHint = !remoteHydrated
    ? t('app.syncLoadingVault')
    : savePending
      ? t('app.syncSaving')
      : lastSyncedAt
        ? t('app.syncDone', { time: formatSynced(lastSyncedAt, locale) ?? '' })
        : t('app.syncReady')

  useEffect(() => {
    if (!syncPopoverOpen) return
    function handlePointerDown(e: MouseEvent) {
      const node = syncPopoverRef.current
      if (node && !node.contains(e.target as Node)) {
        setSyncPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [syncPopoverOpen])

  useEffect(() => {
    if (!accountMenuOpen) return
    function handlePointerDown(e: MouseEvent) {
      const node = accountMenuRef.current
      if (node && !node.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [accountMenuOpen])

  async function handleSignOut() {
    if (!window.confirm(t('settings.signOutConfirm'))) return
    setAccountMenuOpen(false)
    lock()
    await signOut()
  }

  return (
    <>
      <div className="flex items-center gap-0.5 sm:gap-1">
        <div ref={syncPopoverRef} className="relative">
          <button
            type="button"
            className={cn(
              'rounded p-2 transition-colors active:scale-95',
              remoteError
                ? 'text-error hover:bg-error-container/30'
                : savePending
                  ? 'text-on-surface-variant hover:bg-surface-container'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
            )}
            title={syncHint}
            aria-label={t('app.syncIconAria')}
            aria-expanded={syncPopoverOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setSyncPopoverOpen((v) => !v)
              setAccountMenuOpen(false)
            }}
          >
            <MaterialIcon
              name={savePending ? 'progress_activity' : remoteError ? 'cloud_off' : 'cloud_done'}
              size={22}
              className={savePending ? 'animate-spin' : undefined}
            />
          </button>
          {syncPopoverOpen ? (
            <div
              className="absolute right-0 top-full z-50 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-surface-variant bg-surface-container-low p-3 shadow-xl"
              role="dialog"
              aria-label={t('app.syncIconAria')}
            >
              <p className="text-sm text-on-surface">{syncHint}</p>
              {remoteHydrated && remoteError && !decryptFailed ? (
                <>
                  <p className="mt-2 text-xs leading-snug text-on-surface-variant">
                    {humanizeConnectivityError(remoteError, t)}
                  </p>
                  <button
                    type="button"
                    className={cn(SETTINGS_BTN_SECONDARY, 'mt-3 w-full px-3 py-1.5 text-label-sm')}
                    onClick={() => void retrySync()}
                  >
                    {t('app.syncRetry')}
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <div ref={accountMenuRef} className="relative">
          <button
            type="button"
            className="rounded p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface active:scale-95"
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            onClick={() => {
              setAccountMenuOpen((v) => !v)
              setSyncPopoverOpen(false)
            }}
          >
            <span className="sr-only">{t('app.accountMenuAria')}</span>
            <MaterialIcon name="account_circle" size={24} />
          </button>
          {accountMenuOpen ? (
            <div
              className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-surface-variant bg-surface-container-low py-1 shadow-xl"
              role="menu"
            >
              <div
                className="border-b border-surface-variant px-3 py-2 text-xs text-on-surface-variant"
                role="presentation"
              >
                {t('app.accountMenuRoleLine', { role: accountRoleLabel })}
              </div>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high"
                onClick={() => {
                  setAccountMenuOpen(false)
                  setRoadmapModalOpen(true)
                }}
              >
                {t('settings.roadmapTempButton')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-on-surface-variant hover:bg-surface-container-high"
                onClick={() => void handleSignOut()}
              >
                {t('settings.signOut')}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <ProductRoadmapModal open={roadmapModalOpen} onClose={() => setRoadmapModalOpen(false)} />
    </>
  )
}
