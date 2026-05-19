/** Web Push dispatch helpers for Edge (Deno). */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import webpush from 'npm:web-push@3.6.7'

import { buildPushPayload } from './pushPayload.ts'

export type PushSubscriptionRow = {
  endpoint: string
  p256dh: string
  auth: string
}

export type FireDispatchRow = {
  id: string
  user_id: string
  task_id: string
  kind: string
  title: string | null
  locale: string
  dedupe_key: string
}

function isGonePushError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const statusCode = (err as { statusCode?: number }).statusCode
  return statusCode === 410 || statusCode === 404
}

/**
 * Sends push for one fire row to all subscriptions of the user.
 * Removes subscriptions that return 410/404.
 * @returns Number of successful device deliveries.
 */
export async function dispatchFireToUserSubscriptions(
  sb: SupabaseClient,
  row: FireDispatchRow,
  subs: PushSubscriptionRow[],
): Promise<number> {
  if (subs.length === 0) return 0

  const payload = buildPushPayload({
    kind: String(row.kind),
    title: row.title,
    locale: String(row.locale ?? 'ru'),
    task_id: String(row.task_id),
    dedupe_key: String(row.dedupe_key),
  })
  const body = JSON.stringify(payload)

  let sent = 0
  const staleEndpoints: string[] = []

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body,
      )
      sent += 1
    } catch (err) {
      if (isGonePushError(err)) {
        staleEndpoints.push(sub.endpoint)
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await sb
      .from('push_subscriptions')
      .delete()
      .eq('user_id', row.user_id)
      .in('endpoint', staleEndpoints)
  }

  return sent
}

/**
 * Loads push subscriptions for many users in one query.
 */
export async function loadPushSubscriptionsByUserIds(
  sb: SupabaseClient,
  userIds: string[],
): Promise<Map<string, PushSubscriptionRow[]>> {
  const map = new Map<string, PushSubscriptionRow[]>()
  if (userIds.length === 0) return map

  const unique = [...new Set(userIds)]
  const { data, error } = await sb
    .from('push_subscriptions')
    .select('user_id,endpoint,p256dh,auth')
    .in('user_id', unique)

  if (error) throw error

  for (const row of data ?? []) {
    const uid = String(row.user_id)
    const list = map.get(uid) ?? []
    list.push({
      endpoint: String(row.endpoint),
      p256dh: String(row.p256dh),
      auth: String(row.auth),
    })
    map.set(uid, list)
  }

  return map
}
