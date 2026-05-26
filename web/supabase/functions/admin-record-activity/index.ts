/**
 * Heartbeat: ≥1 запись в `admin_user_activity_daily` на UTC-день (throttle на клиенте).
 * Любой авторизованный пользователь с JWT; без тела и без PII.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type MotivatorRoleWire = 'admin' | 'beta_tester' | 'user'

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function wireRoleFromUser(appMeta: Record<string, unknown> | undefined): MotivatorRoleWire {
  const r = appMeta?.motivator_role
  if (r === 'admin') return 'admin'
  if (r === 'beta_tester') return 'beta_tester'
  return 'user'
}

function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !anon || !service) {
    return json(500, { error: 'supabase_env_missing' })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!jwt) {
    return json(401, { error: 'missing_authorization' })
  }

  const userClient = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) {
    return json(401, { error: 'invalid_token' })
  }

  const uid = userData.user.id
  const role = wireRoleFromUser(userData.user.app_metadata as Record<string, unknown> | undefined)
  const activityDate = utcDateKey()
  const now = new Date().toISOString()

  const admin = createClient(supabaseUrl, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: existing, error: selErr } = await admin
    .from('admin_user_activity_daily')
    .select('user_id')
    .eq('user_id', uid)
    .eq('activity_date', activityDate)
    .maybeSingle()

  if (selErr) {
    if (selErr.message?.includes('admin_user_activity_daily') || selErr.code === '42P01') {
      return json(503, { error: 'activity_table_missing' })
    }
    return json(500, { error: 'record_failed', detail: String(selErr.message).slice(0, 300) })
  }

  if (existing) {
    const { error: updErr } = await admin
      .from('admin_user_activity_daily')
      .update({ last_seen_at: now, motivator_role: role })
      .eq('user_id', uid)
      .eq('activity_date', activityDate)
    if (updErr) {
      return json(500, { error: 'record_failed', detail: String(updErr.message).slice(0, 300) })
    }
  } else {
    const { error: insErr } = await admin.from('admin_user_activity_daily').insert({
      user_id: uid,
      activity_date: activityDate,
      motivator_role: role,
      first_seen_at: now,
      last_seen_at: now,
    })
    if (insErr) {
      if (insErr.message?.includes('admin_user_activity_daily') || insErr.code === '42P01') {
        return json(503, { error: 'activity_table_missing' })
      }
      return json(500, { error: 'record_failed', detail: String(insErr.message).slice(0, 300) })
    }
  }

  return json(200, { ok: true, activity_date: activityDate })
})
