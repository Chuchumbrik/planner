function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function getVapidPublicKey(): string | null {
  const k = import.meta.env.VITE_VAPID_PUBLIC_KEY
  return typeof k === 'string' && k.trim() ? k.trim() : null
}

export async function ensurePushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') return null
  const vapid = getVapidPublicKey()
  if (!vapid) return null
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return null

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid),
  })
}
