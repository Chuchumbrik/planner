import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { setCookieConsent } from '@/lib/cookieConsent'
import { legalDocHref } from '@/lib/legalLinks'

type Props = {
  onResolved: () => void
}

export function CookieConsentBanner({ onResolved }: Props) {
  const { t } = useTranslation()

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-surface-variant bg-surface-container-lowest/95 px-4 py-4 shadow-lg backdrop-blur-sm sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <p id="cookie-consent-title" className="text-label-md font-semibold text-on-surface">
        {t('legal.cookieTitle')}
      </p>
      <p className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">{t('legal.cookieBody')}</p>
      <p className="mt-2 text-xs">
        <Link className="text-primary hover:text-primary-fixed" to={legalDocHref('privacy')}>
          {t('legal.privacyLink')}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary px-4 py-2 text-sm"
          onClick={() => {
            setCookieConsent('accepted')
            onResolved()
          }}
        >
          {t('legal.cookieAccept')}
        </button>
        <button
          type="button"
          className="btn-secondary px-4 py-2 text-sm"
          onClick={() => {
            setCookieConsent('declined')
            onResolved()
          }}
        >
          {t('legal.cookieDecline')}
        </button>
      </div>
    </div>
  )
}
