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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-700 bg-zinc-950/95 px-4 py-4 shadow-lg backdrop-blur-sm sm:px-6"
    >
      <p id="cookie-consent-title" className="text-sm font-medium text-zinc-100">
        {t('legal.cookieTitle')}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{t('legal.cookieBody')}</p>
      <p className="mt-2 text-xs">
        <Link className="text-emerald-400 hover:text-emerald-300" to={legalDocHref('privacy')}>
          {t('legal.privacyLink')}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400"
          onClick={() => {
            setCookieConsent('accepted')
            onResolved()
          }}
        >
          {t('legal.cookieAccept')}
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
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
