import { registerSW } from 'virtual:pwa-register'

const UPDATE_INTERVAL_MS = 60 * 60 * 1000

/**
 * Production: регистрирует service worker и чаще проверяет обновления (`registration.update()`),
 * чтобы мобильный PWA не залипал на старой сборке до «своего» расписания браузера.
 * Режим `autoUpdate` в `vite.config` по-прежнему активирует новый SW и перезагружает страницу.
 */
export function initPwaServiceWorker(): void {
  if (!import.meta.env.PROD) return

  registerSW({
    immediate: true,
    onRegisteredSW(_swScriptUrl, registration) {
      if (!registration) return

      const check = () => {
        void registration.update()
      }

      const onVisibility = () => {
        if (document.visibilityState === 'visible') check()
      }

      document.addEventListener('visibilitychange', onVisibility)
      window.addEventListener('focus', check)
      window.setInterval(check, UPDATE_INTERVAL_MS)
    },
  })
}
