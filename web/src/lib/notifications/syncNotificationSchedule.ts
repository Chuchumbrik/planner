import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationDeliveryMode, VaultPayload } from '@motivator/core'

import { computeScheduledFireRequests, type FireRowInput } from './computeScheduledFires'

function fireRowsToRpcPayload(rows: FireRowInput[]): Record<string, string | null>[] {
  return rows.map((r) => ({
    task_id: r.task_id,
    kind: r.kind,
    fire_at_utc: r.fire_at_utc,
    dedupe_key: r.dedupe_key,
    title: r.title,
    locale: r.locale,
  }))
}

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
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' },
  )
  if (error) throw error
}

/**
 * Атомарно заменяет все `scheduled` срабатывания текущего пользователя (RPC в Postgres).
 */
export async function replaceScheduledFires(
  client: SupabaseClient,
  _userId: string,
  rows: FireRowInput[],
): Promise<void> {
  const { error } = await client.rpc('replace_user_scheduled_fires', {
    p_rows: fireRowsToRpcPayload(rows),
  })
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
    await replaceScheduledFires(client, userId, [])
    return
  }

  const rows = computeScheduledFireRequests(vault, { deliveryMode, locale })
  await replaceScheduledFires(client, userId, rows)
}
