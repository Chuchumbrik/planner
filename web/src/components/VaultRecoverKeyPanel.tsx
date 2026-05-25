import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SETTINGS_CARD } from '@/lib/designClasses'
import { SeedKeyImportForm } from '@/components/SeedKeyImportForm'
import { useVault } from '@/vault/VaultProvider'

type Props = {
  className?: string
  onSuccess?: () => void
}

/** In-place recovery when decrypt failed (DR-014 variant A — no sign-out required). */
export function VaultRecoverKeyPanel({ className = '', onSuccess }: Props) {
  const { t } = useTranslation()
  const { saveSeed, retryRemoteHydrate, decryptFailed } = useVault()
  const [open, setOpen] = useState(false)

  if (!decryptFailed) return null

  return (
    <div className={className}>
      {!open ? (
        <button
          type="button"
          className="btn-secondary border-primary/40 text-primary hover:bg-primary/10"
          onClick={() => setOpen(true)}
        >
          {t('vault.recoverKeyCta')}
        </button>
      ) : (
        <div className={SETTINGS_CARD}>
          <p className="font-display text-sm font-medium text-on-surface">{t('vault.recoverKeyTitle')}</p>
          <p className="mt-2 text-xs text-on-surface-variant">{t('vault.recoverKeyHint')}</p>
          <div className="mt-4">
            <SeedKeyImportForm
              submitLabel={t('vault.recoverKeySubmit')}
              onSubmit={async (seed, kdfPassword) => {
                await saveSeed(seed, kdfPassword)
                retryRemoteHydrate()
                onSuccess?.()
                setOpen(false)
              }}
            />
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-on-surface-variant hover:text-on-surface"
            onClick={() => setOpen(false)}
          >
            {t('common.cancel')}
          </button>
        </div>
      )}
    </div>
  )
}
