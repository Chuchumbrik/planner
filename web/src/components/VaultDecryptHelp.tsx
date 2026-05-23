import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { VaultRecoverKeyPanel } from '@/components/VaultRecoverKeyPanel'
import {
  ALERT_WARNING,
  ALERT_WARNING_BODY,
  ALERT_WARNING_TITLE,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'

type Props = {
  className?: string
}

/** Shown when remote vault cannot be decrypted (wrong seed/password or corrupt blob). */
export function VaultDecryptHelp({ className = '' }: Props) {
  const { t } = useTranslation()

  return (
    <div className={cn(ALERT_WARNING, className)} role="alert">
      <p className={ALERT_WARNING_TITLE}>{t('vault.decryptHelpTitle')}</p>
      <p className={cn('mt-2', ALERT_WARNING_BODY)}>{t('vault.decryptHelpBody')}</p>
      <ul className={cn('mt-2 list-inside list-disc', ALERT_WARNING_BODY)}>
        <li>{t('vault.decryptHelpStepSeed')}</li>
        <li>{t('vault.decryptHelpStepPassword')}</li>
        <li>{t('vault.decryptHelpStepSupport')}</li>
      </ul>
      <VaultRecoverKeyPanel className="mt-4" />
      <Link
        className="mt-3 inline-block text-label-sm font-medium text-primary hover:text-primary-fixed"
        to="/settings#privacy"
      >
        {t('vault.decryptHelpSettingsLink')}
      </Link>
    </div>
  )
}
