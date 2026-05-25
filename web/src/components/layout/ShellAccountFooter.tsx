import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { ProductRoadmapModal } from '@/components/ProductRoadmapModal'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { SETTINGS_BTN_SECONDARY, SHELL_VERSION_FOOTER } from '@/lib/designClasses'
import { motivatorAppRole } from '@/lib/motivatorRole'
import { useVault } from '@/vault/VaultProvider'
import { APP_VERSION } from '@/version'

type Props = {
  hideRoadmap?: boolean
}

export function ShellAccountFooter({ hideRoadmap = false }: Props) {
  const { t } = useTranslation()
  const { signOut, session } = useAuth()
  const { lock } = useVault()
  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false)

  const accountEmail = session?.user?.email?.trim() ?? ''
  const accountRoleLabel = useMemo(() => {
    const r = motivatorAppRole(session)
    if (r === 'admin') return t('shell.roleLabelAdmin')
    if (r === 'beta_tester') return t('shell.roleLabelBetaTester')
    return t('shell.roleLabelUser')
  }, [session, t])

  async function handleSignOut() {
    if (!window.confirm(t('settings.signOutConfirm'))) return
    lock()
    await signOut()
  }

  return (
    <>
      <div
        className="border-t border-surface-variant/80 px-md pb-md pt-md"
        aria-label={t('shell.accountFooterAria')}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-on-surface-variant"
            aria-hidden
          >
            <MaterialIcon name="account_circle" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            {accountEmail ? (
              <p className="truncate text-label-md text-on-surface" title={accountEmail}>
                {accountEmail}
              </p>
            ) : (
              <p className="truncate text-label-md text-on-surface">{t('app.accountMenuAria')}</p>
            )}
            <p className="mt-0.5 text-label-sm text-on-surface-variant">
              {t('app.accountMenuRoleLine', { role: accountRoleLabel })}
            </p>
          </div>
        </div>

        <div className="mt-sm flex flex-col gap-2">
          {!hideRoadmap ? (
            <button
              type="button"
              className={cn(SETTINGS_BTN_SECONDARY, 'w-full px-3 py-2 text-label-sm')}
              onClick={() => setRoadmapModalOpen(true)}
            >
              {t('settings.roadmapTempButton')}
            </button>
          ) : null}
          <button
            type="button"
            className={cn(
              SETTINGS_BTN_SECONDARY,
              'w-full px-3 py-2 text-label-sm text-on-surface-variant',
            )}
            onClick={() => void handleSignOut()}
          >
            {t('settings.signOut')}
          </button>
        </div>

        <p className={SHELL_VERSION_FOOTER}>{t('home.badge', { version: APP_VERSION })}</p>
      </div>

      <ProductRoadmapModal open={roadmapModalOpen} onClose={() => setRoadmapModalOpen(false)} />
    </>
  )
}
