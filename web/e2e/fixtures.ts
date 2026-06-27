import { test as base } from '@playwright/test'

const COOKIE_CONSENT_STORAGE_KEY = 'motivator_cookie_consent_v1'
const I18N_STORAGE_KEY = 'motivator_lang'

/** Стабильный старт без баннера cookies и с русской локалью (дефолт продукта). */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(
      ({ cookieKey, langKey }: { cookieKey: string; langKey: string }) => {
        localStorage.setItem(cookieKey, 'accepted')
        localStorage.setItem(langKey, 'ru')
      },
      { cookieKey: COOKIE_CONSENT_STORAGE_KEY, langKey: I18N_STORAGE_KEY },
    )
    await use(page)
  },
})

export { expect } from '@playwright/test'
