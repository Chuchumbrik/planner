import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShellVaultPlanButton } from '@/components/layout/ShellVaultPlanButton'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { humanizeConnectivityError } from '@/lib/connectivityHints'
import { cn } from '@/lib/cn'
import { SETTINGS_BTN_SECONDARY, SHELL_ICON_BTN } from '@/lib/designClasses'
import { getPlanTier, type PlanTier } from '@/lib/planTier'
import { formatSynced } from '@/lib/syncStatus'
import { useVault } from '@/vault/VaultProvider'

type Props = {
  planTier?: PlanTier
}

export function ShellHeaderActions({ planTier }: Props) {
  const { t, i18n } = useTranslation()
  const {
    remoteError,
    retrySync,
    remoteHydrated,
    decryptFailed,
    savePending,
    lastSyncedAt,
  } = useVault()

  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU'
  const [syncPopoverOpen, setSyncPopoverOpen] = useState(false)
  const [vaultPopoverOpen, setVaultPopoverOpen] = useState(false)
  const syncPopoverRef = useRef<HTMLDivElement>(null)

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

  function closeOtherPopovers(except: 'sync' | 'vault' | null) {
    if (except !== 'sync') setSyncPopoverOpen(false)
    if (except !== 'vault') setVaultPopoverOpen(false)
  }

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <ShellVaultPlanButton
        planTier={planTier ?? getPlanTier()}
        open={vaultPopoverOpen}
        onOpenChange={(open) => {
          setVaultPopoverOpen(open)
          if (open) closeOtherPopovers('vault')
        }}
      />

      <div ref={syncPopoverRef} className="relative">
        <button
          type="button"
          className={cn(
            SHELL_ICON_BTN,
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
            closeOtherPopovers('sync')
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
            <p className="text-sm text-on-surface" role="status" aria-live="polite">
              {syncHint}
            </p>
            {remoteHydrated && remoteError && !decryptFailed ? (
              <>
                <p className="mt-2 text-xs leading-snug text-on-surface-variant" role="alert">
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
    </div>
  )
}
