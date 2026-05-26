/**
 * Список пользователей Auth и смена `app_metadata.motivator_role` (только вызывающий с ролью admin).
 * `list` / `overview` — метаданные vault, push, defects (без ciphertext).
 * Секреты: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_SEARCH_LEN = 200
const LIST_PER_PAGE = 100
const MAX_LIST_PAGES = 40
/** Keep in sync with `web/src/lib/adminMonitoringConstants.ts`. */
const STALE_VAULT_DAYS = 14
const MS_PER_DAY = 86_400_000

type MotivatorRoleWire = 'admin' | 'beta_tester' | 'user'

type AuthUserRow = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  motivator_role: MotivatorRoleWire
}

type MonitoringEnrichment = {
  has_vault: boolean
  vault_updated_at: string | null
  push_device_count: number
  push_last_seen_at: string | null
  defect_submission_count: number
  defect_last_at: string | null
}

type ListUserRow = AuthUserRow & MonitoringEnrichment

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

function parseTime(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? null : t
}

function emptyEnrichment(): MonitoringEnrichment {
  return {
    has_vault: false,
    vault_updated_at: null,
    push_device_count: 0,
    push_last_seen_at: null,
    defect_submission_count: 0,
    defect_last_at: null,
  }
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

async function listAuthUsers(
  admin: SupabaseClient,
  search: string,
): Promise<{ ok: true; users: AuthUserRow[] } | { ok: false; response: Response }> {
  const users: AuthUserRow[] = []

  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: LIST_PER_PAGE })
    if (error) {
      return { ok: false, response: json(500, { error: 'list_failed', detail: String(error.message).slice(0, 300) }) }
    }
    const batch = data?.users ?? []
    if (batch.length === 0) break

    for (const u of batch) {
      const meta = u.app_metadata as Record<string, unknown> | undefined
      const email = (u.email ?? '').trim()
      const row: AuthUserRow = {
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

  return { ok: true, users }
}

type MonitoringMaps = {
  vaultUpdatedAt: Map<string, string>
  push: Map<string, { count: number; lastSeen: string | null }>
  defects: Map<string, { count: number; lastAt: string | null }>
  degraded: boolean
}

async function loadMonitoringMaps(admin: SupabaseClient): Promise<MonitoringMaps> {
  const vaultUpdatedAt = new Map<string, string>()
  const push = new Map<string, { count: number; lastSeen: string | null }>()
  const defects = new Map<string, { count: number; lastAt: string | null }>()
  let degraded = false

  const [vaultRes, pushRes, defectRes] = await Promise.all([
    admin.from('user_vault').select('user_id, updated_at'),
    admin.from('push_subscriptions').select('user_id, last_seen_at'),
    admin.from('defect_submissions').select('user_id, created_at'),
  ])

  if (vaultRes.error) degraded = true
  else {
    for (const row of vaultRes.data ?? []) {
      const uid = row.user_id as string
      const updated = row.updated_at as string
      if (uid && updated) vaultUpdatedAt.set(uid, updated)
    }
  }

  if (pushRes.error) degraded = true
  else {
    for (const row of pushRes.data ?? []) {
      const uid = row.user_id as string
      if (!uid) continue
      const seen = typeof row.last_seen_at === 'string' ? row.last_seen_at : null
      const prev = push.get(uid) ?? { count: 0, lastSeen: null }
      let lastSeen = prev.lastSeen
      if (seen) {
        const t = parseTime(seen)
        const pt = parseTime(prev.lastSeen)
        if (t != null && (pt == null || t > pt)) lastSeen = seen
      }
      push.set(uid, { count: prev.count + 1, lastSeen })
    }
  }

  if (defectRes.error) degraded = true
  else {
    for (const row of defectRes.data ?? []) {
      const uid = row.user_id as string
      if (!uid) continue
      const at = typeof row.created_at === 'string' ? row.created_at : null
      const prev = defects.get(uid) ?? { count: 0, lastAt: null }
      let lastAt = prev.lastAt
      if (at) {
        const t = parseTime(at)
        const pt = parseTime(prev.lastAt)
        if (t != null && (pt == null || t > pt)) lastAt = at
      }
      defects.set(uid, { count: prev.count + 1, lastAt })
    }
  }

  return { vaultUpdatedAt, push, defects, degraded }
}

function enrichmentForUser(userId: string, maps: MonitoringMaps): MonitoringEnrichment {
  const vaultAt = maps.vaultUpdatedAt.get(userId)
  const pushRow = maps.push.get(userId)
  const defectRow = maps.defects.get(userId)
  return {
    has_vault: vaultAt != null,
    vault_updated_at: vaultAt ?? null,
    push_device_count: pushRow?.count ?? 0,
    push_last_seen_at: pushRow?.lastSeen ?? null,
    defect_submission_count: defectRow?.count ?? 0,
    defect_last_at: defectRow?.lastAt ?? null,
  }
}

function isVaultStale(enrichment: MonitoringEnrichment, nowMs: number): boolean {
  if (!enrichment.has_vault) return false
  const t = parseTime(enrichment.vault_updated_at)
  if (t == null) return true
  return t < nowMs - STALE_VAULT_DAYS * MS_PER_DAY
}

function buildOverview(users: ListUserRow[], nowMs: number) {
  const regCutoff = nowMs - 7 * MS_PER_DAY
  const signCutoff = regCutoff
  const defectCutoff = regCutoff

  let registered_last_7d = 0
  let signed_in_last_7d = 0
  let with_vault = 0
  let vault_stale_14d = 0
  let with_push = 0
  let defect_submissions_7d = 0
  const by_role = { admin: 0, beta_tester: 0, user: 0 }

  for (const u of users) {
    const created = parseTime(u.created_at)
    if (created != null && created >= regCutoff) registered_last_7d++
    const sign = parseTime(u.last_sign_in_at)
    if (sign != null && sign >= signCutoff) signed_in_last_7d++
    if (u.has_vault) {
      with_vault++
      if (isVaultStale(u, nowMs)) vault_stale_14d++
    }
    if (u.push_device_count > 0) with_push++
    if (u.defect_last_at) {
      const dt = parseTime(u.defect_last_at)
      if (dt != null && dt >= defectCutoff) defect_submissions_7d++
    }
    if (u.motivator_role === 'admin') by_role.admin++
    else if (u.motivator_role === 'beta_tester') by_role.beta_tester++
    else by_role.user++
  }

  return {
    total_users: users.length,
    registered_last_7d,
    signed_in_last_7d,
    with_vault,
    without_vault: users.length - with_vault,
    vault_stale_14d,
    with_push,
    defect_submissions_7d,
    by_role,
    stale_vault_days: STALE_VAULT_DAYS,
  }
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
  const action =
    b.action === 'list' || b.action === 'setRole' || b.action === 'overview' ? b.action : null
  if (!action) {
    return json(400, { error: 'invalid_body' })
  }

  if (action === 'list' || action === 'overview') {
    const searchRaw = typeof b.search === 'string' ? b.search : ''
    const search = searchRaw.trim().slice(0, MAX_SEARCH_LEN).toLowerCase()

    const authResult = await listAuthUsers(admin, search)
    if (!authResult.ok) return authResult.response

    const maps = await loadMonitoringMaps(admin)
    const enriched: ListUserRow[] = authResult.users.map((u) => ({
      ...u,
      ...enrichmentForUser(u.id, maps),
    }))

    if (action === 'overview') {
      return json(200, {
        overview: buildOverview(enriched, Date.now()),
        list_degraded: maps.degraded,
      })
    }

    return json(200, { users: enriched, list_degraded: maps.degraded })
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
    nextMeta.motivator_role = null
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
