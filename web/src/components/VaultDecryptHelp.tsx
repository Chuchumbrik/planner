import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { VaultRecoverKeyPanel } from '@/components/VaultRecoverKeyPanel'

type Props = {
  className?: string
}

/** Shown when remote vault cannot be decrypted (wrong seed/password or corrupt blob). */
export function VaultDecryptHelp({ className = '' }: Props) {
  const { t } = useTranslation()

  return (
    <div
      className={`rounded-lg border border-amber-900/60 bg-amber-950/30 px-3 py-3 text-sm text-amber-100 ${className}`}
      role="alert"
    >
      <p className="font-medium">{t('vault.decryptHelpTitle')}</p>
      <p className="mt-2 text-xs leading-relaxed text-amber-200/90">{t('vault.decryptHelpBody')}</p>
      <ul className="mt-2 list-inside list-disc text-xs text-amber-200/80">
        <li>{t('vault.decryptHelpStepSeed')}</li>
        <li>{t('vault.decryptHelpStepPassword')}</li>
        <li>{t('vault.decryptHelpStepSupport')}</li>
      </ul>
      <VaultRecoverKeyPanel className="mt-4" />
      <Link
        className="mt-3 inline-block text-xs font-medium text-primary hover:text-primary-fixed"
        to="/settings#seed-backup"
      >
        {t('vault.decryptHelpSettingsLink')}
      </Link>
    </div>
  )
}
