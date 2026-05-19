/**
 * Отправка просроченных `notification_fire_requests` (cron / ручной POST).
 * Секреты: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, VAPID_PUBLIC_KEY,
 * VAPID_PRIVATE_KEY, VAPID_SUBJECT.
 * Заголовок: Authorization: Bearer <CRON_SECRET>.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import webpush from 'npm:web-push@3.6.7'

import {
  dispatchFireToUserSubscriptions,
  loadPushSubscriptionsByUserIds,
  type FireDispatchRow,
} from '../_shared/pushDispatch.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_LIMIT = 150
const STALE_PROCESSING_MS = 10 * 60 * 1000

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:noreply@local.invalid'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('CRON_SECRET') ?? ''
  if (!cronSecret) {
    return json(500, { error: 'cron_secret_not_configured' })
  }

  const auth = req.headers.get('Authorization') ?? ''
  if (auth !== `Bearer ${cronSecret}`) {
    return json(401, { error: 'unauthorized' })
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return json(500, { error: 'vapid_not_configured' })
  }

  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!url || !key) {
    return json(500, { error: 'supabase_env_missing' })
  }

  const sb = createClient(url, key)
  const nowIso = new Date().toISOString()
  const staleProcessingBefore = new Date(Date.now() - STALE_PROCESSING_MS).toISOString()

  await sb
    .from('notification_fire_requests')
    .update({ status: 'scheduled', updated_at: nowIso })
    .eq('status', 'processing')
    .lt('updated_at', staleProcessingBefore)

  const { data: claimed, error: claimErr } = await sb.rpc('claim_due_notification_fires', {
    p_limit: BATCH_LIMIT,
  })

  if (claimErr) {
    return json(500, { error: claimErr.message })
  }

  const rows = (claimed ?? []) as FireDispatchRow[]
  if (rows.length === 0) {
    return json(200, { processed: 0, sent: 0, failed: 0 })
  }

  const subsByUser = await loadPushSubscriptionsByUserIds(
    sb,
    rows.map((r) => String(r.user_id)),
  )

  let sentRows = 0
  let failedRows = 0

  for (const row of rows) {
    const rid = String(row.id)
    const uid = String(row.user_id)
    const subs = subsByUser.get(uid) ?? []

    try {
      const delivered = await dispatchFireToUserSubscriptions(sb, row, subs)
      const finalStatus = delivered > 0 || subs.length === 0 ? 'sent' : 'failed'

      await sb
        .from('notification_fire_requests')
        .update({ status: finalStatus, updated_at: new Date().toISOString() })
        .eq('id', rid)

      if (finalStatus === 'sent') sentRows += 1
      else failedRows += 1
    } catch {
      await sb
        .from('notification_fire_requests')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', rid)
      failedRows += 1
    }
  }

  return json(200, {
    processed: rows.length,
    sent: sentRows,
    failed: failedRows,
  })
})
