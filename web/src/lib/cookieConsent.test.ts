import { beforeEach, describe, expect, it } from 'vitest'
import {
  COOKIE_CONSENT_STORAGE_KEY,
  getCookieConsent,
  needsCookieConsentBanner,
  setCookieConsent,
} from './cookieConsent'

beforeEach(() => {
  localStorage.clear()
})

describe('getCookieConsent', () => {
  // TS-086
  it("'accepted' в localStorage → 'accepted'", () => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted')
    expect(getCookieConsent()).toBe('accepted')
  })

  // TS-087
  it('нет записи → null', () => {
    expect(getCookieConsent()).toBeNull()
  })
})

describe('needsCookieConsentBanner', () => {
  // TS-088
  it("после setCookieConsent('declined') → false", () => {
    setCookieConsent('declined')
    expect(needsCookieConsentBanner()).toBe(false)
  })
})
