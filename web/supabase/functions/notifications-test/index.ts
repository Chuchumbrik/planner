/**
 * Тестовый push для текущего пользователя (JWT). Секреты: SUPABASE_URL, SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY, VAPID_* как в send-due.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import webpush from 'npm:web-push@3.6.7'

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

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: 'vapid_not_configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !anon || !service) {
    return new Response(JSON.stringify({ error: 'supabase_env_missing' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'missing_authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'invalid_token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const uid = userData.user.id

  let locale: 'ru' | 'en' = 'ru'
  try {
    const body = await req.json()
    if (body?.locale === 'en' || body?.locale === 'ru') locale = body.locale
  } catch {
    /* empty */
  }

  const admin = createClient(supabaseUrl, service)
  const { data: subs, error: serr } = await admin.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id', uid)
  if (serr) {
    return new Response(JSON.stringify({ error: serr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!subs?.length) {
    return new Response(JSON.stringify({ error: 'no_subscriptions' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const payload =
    locale === 'en'
      ? { title: 'Motivator', body: 'Test notification.', url: '/app', tag: 'motivator:test' }
      : { title: 'Мотиватор', body: 'Тестовое уведомление.', url: '/app', tag: 'motivator:test' }

  const body = JSON.stringify(payload)
  for (const sub of subs) {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint as string,
        keys: { p256dh: sub.p256dh as string, auth: sub.auth as string },
      },
      body,
    )
  }

  return new Response(JSON.stringify({ ok: true, count: subs.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
