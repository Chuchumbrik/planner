import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
          className="rounded-lg border border-emerald-600/60 bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/50"
          onClick={() => setOpen(true)}
        >
          {t('vault.recoverKeyCta')}
        </button>
      ) : (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-4">
          <p className="text-sm font-medium text-zinc-200">{t('vault.recoverKeyTitle')}</p>
          <p className="mt-2 text-xs text-zinc-400">{t('vault.recoverKeyHint')}</p>
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
            className="mt-3 text-xs text-zinc-500 hover:text-zinc-300"
            onClick={() => setOpen(false)}
          >
            {t('common.cancel')}
          </button>
        </div>
      )}
    </div>
  )
}
