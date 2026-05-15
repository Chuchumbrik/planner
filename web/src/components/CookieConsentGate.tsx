import { useState } from 'react'
import { needsCookieConsentBanner } from '@/lib/cookieConsent'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'

export function CookieConsentGate() {
  const [visible, setVisible] = useState(() => needsCookieConsentBanner())

  if (!visible) return null
  return <CookieConsentBanner onResolved={() => setVisible(false)} />
}
