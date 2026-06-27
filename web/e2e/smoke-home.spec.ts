import { test, expect } from './fixtures'

test.describe('Публичная витрина', () => {
  test('главная: hero и переход на вход', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { level: 1, name: /приватный vault/i }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Войти' }).first().click()
    await expect(page).toHaveURL(/\/login$/)
  })
})
