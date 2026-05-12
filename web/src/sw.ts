/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: string[] }

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

const navigationHandler = createHandlerBoundToURL('/index.html')
registerRoute(new NavigationRoute(navigationHandler))

type PushPayload = {
  title?: string
  body?: string
  url?: string
  tag?: string
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return
  let payload: PushPayload
  try {
    payload = event.data.json() as PushPayload
  } catch {
    payload = { title: 'Мотиватор', body: '' }
  }
  const title = payload.title ?? 'Мотиватор'
  const body = payload.body ?? ''
  const url = typeof payload.url === 'string' ? payload.url : '/app'
  const tag = payload.tag

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      data: { url },
      tag,
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const raw = event.notification.data as { url?: string } | undefined
  const url = typeof raw?.url === 'string' ? raw.url : '/app'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if ('focus' in c) return (c as WindowClient).focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
