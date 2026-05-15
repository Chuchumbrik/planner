export const COOKIE_CONSENT_STORAGE_KEY = 'motivator_cookie_consent_v1'

export type CookieConsentChoice = 'accepted' | 'declined'

export function getCookieConsent(): CookieConsentChoice | null {
  const v = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  if (v === 'accepted' || v === 'declined') return v
  return null
}

export function setCookieConsent(choice: CookieConsentChoice): void {
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice)
}

export function needsCookieConsentBanner(): boolean {
  return getCookieConsent() === null
}
