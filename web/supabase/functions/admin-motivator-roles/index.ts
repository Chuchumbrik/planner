/**
 * Список пользователей Auth и смена `app_metadata.motivator_role` (только вызывающий с ролью admin).
 * Секреты: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_SEARCH_LEN = 200
const LIST_PER_PAGE = 100
const MAX_LIST_PAGES = 40

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

async function assertCallerIsAdmin(
  supabaseUrl: string,
  anon: string,
  service: string,
  jwt: string,
): Promise<{ ok: true; uid: string } | { ok: false; response: Response }> {
  const userClient = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) {
    return { ok: false, response: json(401, { error: 'invalid_token' }) }
  }
  const uid = userData.user.id

  const admin = createClient(supabaseUrl, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: adminUser, error: adminErr } = await admin.auth.admin.getUserById(uid)
  if (adminErr || !adminUser?.user) {
    return { ok: false, response: json(500, { error: 'role_lookup_failed' }) }
  }
  const role = (adminUser.user.app_metadata as Record<string, unknown> | undefined)?.motivator_role
  if (role !== 'admin') {
    return { ok: false, response: json(403, { error: 'forbidden' }) }
  }
  return { ok: true, uid }
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

  const gate = await assertCallerIsAdmin(supabaseUrl, anon, service, jwt)
  if (!gate.ok) return gate.response

  const admin = createClient(supabaseUrl, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let rawText: string
  try {
    rawText = await req.text()
  } catch {
    return json(400, { error: 'invalid_body' })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText || '{}')
  } catch {
    return json(400, { error: 'invalid_body' })
  }
  if (!parsed || typeof parsed !== 'object') {
    return json(400, { error: 'invalid_body' })
  }
  const b = parsed as Record<string, unknown>
  const action = b.action === 'list' || b.action === 'setRole' ? b.action : null
  if (!action) {
    return json(400, { error: 'invalid_body' })
  }

  if (action === 'list') {
    const searchRaw = typeof b.search === 'string' ? b.search : ''
    const search = searchRaw.trim().slice(0, MAX_SEARCH_LEN).toLowerCase()

    const users: Array<{
      id: string
      email: string
      created_at: string
      last_sign_in_at: string | null
      motivator_role: MotivatorRoleWire
    }> = []

    for (let page = 1; page <= MAX_LIST_PAGES; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: LIST_PER_PAGE })
      if (error) {
        return json(500, { error: 'list_failed', detail: String(error.message).slice(0, 300) })
      }
      const batch = data?.users ?? []
      if (batch.length === 0) break

      for (const u of batch) {
        const meta = u.app_metadata as Record<string, unknown> | undefined
        const email = (u.email ?? '').trim()
        const row = {
          id: u.id,
          email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          motivator_role: wireRoleFromUser(meta),
        }
        if (!search) {
          users.push(row)
          continue
        }
        const hay = `${email} ${u.id}`.toLowerCase()
        if (hay.includes(search)) users.push(row)
      }

      if (batch.length < LIST_PER_PAGE) break
    }

    users.sort((a, b) => {
      const ae = a.email.toLowerCase()
      const be = b.email.toLowerCase()
      if (ae && be && ae !== be) return ae.localeCompare(be)
      return a.id.localeCompare(b.id)
    })

    return json(200, { users })
  }

  // setRole
  const userId = typeof b.userId === 'string' ? b.userId.trim() : ''
  const role = b.role === 'admin' || b.role === 'beta_tester' || b.role === 'user' ? b.role : null
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return json(400, { error: 'invalid_body' })
  }
  if (!role) {
    return json(400, { error: 'invalid_role' })
  }

  const { data: target, error: gErr } = await admin.auth.admin.getUserById(userId)
  if (gErr || !target?.user) {
    return json(404, { error: 'user_not_found' })
  }

  const prevMeta = { ...(target.user.app_metadata as Record<string, unknown>) }
  const nextMeta: Record<string, unknown> = { ...prevMeta }
  if (role === 'user') {
    delete nextMeta.motivator_role
  } else {
    nextMeta.motivator_role = role
  }

  const { error: uErr } = await admin.auth.admin.updateUserById(userId, { app_metadata: nextMeta })
  if (uErr) {
    return json(500, { error: 'update_failed', detail: String(uErr.message).slice(0, 300) })
  }

  return json(200, {
    ok: true,
    user: {
      id: userId,
      email: (target.user.email ?? '').trim(),
      motivator_role: role,
    },
  })
})
