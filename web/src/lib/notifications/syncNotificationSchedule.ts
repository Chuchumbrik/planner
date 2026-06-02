import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationDeliveryMode, VaultPayload } from '@motivator/core'

import { getAppNow } from '@/lib/appNow'
import { computeScheduledFireRequests, type FireRowInput } from './computeScheduledFires'

export async function deleteScheduledFiresForUser(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from('notification_fire_requests')
    .delete()
    .eq('user_id', userId)
    .eq('status', 'scheduled')
  if (error) throw error
}

export async function upsertPushSubscriptionRow(
  client: SupabaseClient,
  userId: string,
  sub: PushSubscription,
  locale?: string,
): Promise<void> {
  const json = sub.toJSON()
  const endpoint = json.endpoint
  const key = json.keys
  if (!endpoint || !key?.p256dh || !key?.auth) return

  const { error } = await client.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint,
      p256dh: key.p256dh,
      auth: key.auth,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      locale: locale === 'en' ? 'en' : 'ru',
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' },
  )
  if (error) throw error
}

export async function replaceScheduledFires(
  client: SupabaseClient,
  userId: string,
  rows: FireRowInput[],
): Promise<void> {
  await deleteScheduledFiresForUser(client, userId)
  if (rows.length === 0) return

  const { error } = await client.from('notification_fire_requests').insert(
    rows.map((r) => ({
      user_id: userId,
      task_id: r.task_id,
      kind: r.kind,
      fire_at_utc: r.fire_at_utc,
      dedupe_key: r.dedupe_key,
      title: r.title,
      locale: r.locale,
      status: 'scheduled' as const,
    })),
  )
  if (error) throw error
}

export async function syncNotificationScheduleFromVault(
  client: SupabaseClient,
  userId: string,
  vault: VaultPayload,
  deliveryMode: NotificationDeliveryMode,
  locale: 'ru' | 'en',
): Promise<void> {
  if (deliveryMode === 'off') {
    await deleteScheduledFiresForUser(client, userId)
    return
  }

  const rows = computeScheduledFireRequests(vault, { deliveryMode, locale, now: getAppNow() })
  await replaceScheduledFires(client, userId, rows)
}
