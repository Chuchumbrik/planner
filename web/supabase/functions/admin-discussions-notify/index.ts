/**
 * Push-уведомления подписчикам треда при новом reply (Phase 7.10).
 * Вызывается БД-триггером `discussion_reply_notify` через pg_net (net.http_post).
 *
 * Auth: Authorization: Bearer <secret> (передаёт триггер из Vault); функция
 *       сверяет токен с тем же vault-секретом через RPC `discussion_notify_check`.
 * Body: { discussion_id: string, reply_author_id: string }
 * Секреты: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY,
 *          VAPID_PRIVATE_KEY, VAPID_SUBJECT.
 *
 * Рассылает всем подписчикам треда (admin_discussion_subscribers), кроме автора
 * reply. Текст — title треда; локаль (ru/en) берётся из `push_subscriptions.locale`
 * получателя (как в send-due), через `buildDiscussionReplyPayload`.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import webpush from 'npm:web-push@3.6.7'
import { buildDiscussionReplyPayload } from '../_shared/pushPayload.ts'

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

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!url || !service) return json(500, { error: 'supabase_env_missing' })
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json(500, { error: 'vapid_not_configured' })

  const sb = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })

  // Auth: сверяем входящий Bearer-токен с общим секретом в Vault через RPC
  // (`discussion_notify_check`). Платформенный env-ключ для разных проектов
  // бывает в разном формате, поэтому не сравниваем с ним напрямую.
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const { data: authorized, error: authErr } = await sb.rpc('discussion_notify_check', { token })
  if (authErr) return json(500, { error: 'auth_check_failed', detail: authErr.message })
  if (!authorized) return json(401, { error: 'unauthorized' })

  let body: Record<string, unknown>
  try {
    body = JSON.parse((await req.text()) || '{}')
  } catch {
    return json(400, { error: 'invalid_body' })
  }

  const discussionId = typeof body.discussion_id === 'string' ? body.discussion_id : ''
  const replyAuthorId = typeof body.reply_author_id === 'string' ? body.reply_author_id : ''
  if (!UUID_RE.test(discussionId)) return json(400, { error: 'invalid_discussion_id' })

  const { data: discussion } = await sb
    .from('admin_discussions')
    .select('title')
    .eq('id', discussionId)
    .maybeSingle()
  if (!discussion) return json(404, { error: 'not_found' })

  const { data: subs, error: subErr } = await sb
    .from('admin_discussion_subscribers')
    .select('user_id')
    .eq('discussion_id', discussionId)
  if (subErr) return json(500, { error: 'subscribers_lookup_failed', detail: subErr.message })

  const recipients = (subs ?? [])
    .map((s) => s.user_id as string)
    .filter((uid) => uid && uid !== replyAuthorId)

  const title = String(discussion.title ?? '')

  let sent = 0
  let skipped = 0
  for (const uid of recipients) {
    const { data: pushSubs } = await sb
      .from('push_subscriptions')
      .select('endpoint,p256dh,auth,locale')
      .eq('user_id', uid)
    if (!pushSubs || pushSubs.length === 0) {
      skipped += 1
      continue
    }
    for (const ps of pushSubs) {
      // Локаль получателя берётся из его подписки (как в send-due/locale).
      const payload = JSON.stringify(
        buildDiscussionReplyPayload(discussionId, title, String(ps.locale ?? 'ru')),
      )
      try {
        await webpush.sendNotification(
          {
            endpoint: ps.endpoint as string,
            keys: { p256dh: ps.p256dh as string, auth: ps.auth as string },
          },
          payload,
        )
        sent += 1
      } catch {
        skipped += 1
      }
    }
  }

  return json(200, { sent, skipped, recipients: recipients.length })
})
