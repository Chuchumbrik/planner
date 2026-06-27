import { test, expect } from './fixtures'

test.describe('Страница входа', () => {
  test('форма email/пароль без авторизации', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Пароль')).toBeVisible()
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible()
  })
})
