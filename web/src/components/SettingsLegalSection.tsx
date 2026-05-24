import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { feedbackHref, legalDocHref } from '@/lib/legalLinks'

const LINK_CLASS = 'text-primary hover:text-primary-fixed'

export function SettingsLegalSection() {
  const { t } = useTranslation()
  const feedback = feedbackHref()

  return (
    <div className="flex flex-col gap-2 text-sm">
      <Link className={LINK_CLASS} to={legalDocHref('privacy')}>
        {t('legal.privacyLink')}
      </Link>
      <Link className={LINK_CLASS} to={legalDocHref('terms')}>
        {t('legal.termsLink')}
      </Link>
      <Link className={LINK_CLASS} to={legalDocHref('personalData')}>
        {t('legal.personalDataLink')}
      </Link>
      <a className={LINK_CLASS} href={feedback} target="_blank" rel="noopener noreferrer">
        {t('legal.feedbackLink')}
      </a>
    </div>
  )
}
