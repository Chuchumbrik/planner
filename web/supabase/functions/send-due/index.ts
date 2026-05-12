/**
 * Отправка просроченных `notification_fire_requests` (cron / ручной POST).
 * Секреты: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT;
 * опционально CRON_SECRET — тогда заголовок Authorization: Bearer <CRON_SECRET>.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import webpush from 'npm:web-push@3.6.7'

import { buildPushPayload } from '../_shared/pushPayload.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:noreply@local.invalid'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const auth = req.headers.get('Authorization') ?? ''
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: 'vapid_not_configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!url || !key) {
    return new Response(JSON.stringify({ error: 'supabase_env_missing' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sb = createClient(url, key)
  const nowIso = new Date().toISOString()

  const { data: rows, error } = await sb
    .from('notification_fire_requests')
    .select('id,user_id,task_id,kind,title,locale,dedupe_key')
    .eq('status', 'scheduled')
    .lte('fire_at_utc', nowIso)
    .order('fire_at_utc', { ascending: true })
    .limit(150)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  for (const row of rows ?? []) {
    const rid = row.id as string
    const uid = row.user_id as string
    try {
      const { data: subs, error: subErr } = await sb
        .from('push_subscriptions')
        .select('endpoint,p256dh,auth')
        .eq('user_id', uid)
      if (subErr) throw subErr

      const payload = buildPushPayload({
        kind: String(row.kind),
        title: (row.title as string | null) ?? null,
        locale: String(row.locale ?? 'ru'),
        task_id: String(row.task_id),
        dedupe_key: String(row.dedupe_key),
      })

      const body = JSON.stringify(payload)
      for (const sub of subs ?? []) {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint as string,
            keys: { p256dh: sub.p256dh as string, auth: sub.auth as string },
          },
          body,
        )
      }

      await sb
        .from('notification_fire_requests')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', rid)
      sent += 1
    } catch {
      await sb
        .from('notification_fire_requests')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', rid)
    }
  }

  return new Response(JSON.stringify({ processed: rows?.length ?? 0, sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
