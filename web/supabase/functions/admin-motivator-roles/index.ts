/**
 * Список пользователей Auth и смена `app_metadata.motivator_role` (только вызывающий с ролью admin).
 * `list` / `overview` — метаданные vault, push, defects (без ciphertext).
 * `activityChart` / `activityDayUsers` — агрегаты и drill-down по `admin_user_activity_daily`.
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
const MAX_ACTIVITY_CHART_DAYS = 90
const WAU_DAYS = 7

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

function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addUtcDays(d: Date, days: number): Date {
  const x = new Date(d.getTime())
  x.setUTCDate(x.getUTCDate() + days)
  return x
}

type ActivityChartRoleFilter = 'all' | MotivatorRoleWire

async function buildActivityChart(
  admin: SupabaseClient,
  days: number,
  roleFilter: ActivityChartRoleFilter,
): Promise<
  | {
      ok: true
      chart: {
        days: number
        role: ActivityChartRoleFilter
        timezone: 'UTC'
        series: Array<{ date: string; unique_users: number }>
        dau_today: number
        wau: number
      }
    }
  | { ok: false; response: Response }
> {
  const safeDays = Math.min(MAX_ACTIVITY_CHART_DAYS, Math.max(7, Math.floor(days)))
  const end = new Date()
  const start = addUtcDays(end, -(safeDays - 1))
  const fromKey = utcDateKey(start)
  const todayKey = utcDateKey(end)
  const wauFromKey = utcDateKey(addUtcDays(end, -(WAU_DAYS - 1)))

  const { data, error } = await admin
    .from('admin_user_activity_daily')
    .select('user_id, activity_date, motivator_role')
    .gte('activity_date', wauFromKey)
    .order('activity_date', { ascending: true })

  if (error) {
    if (error.message?.includes('admin_user_activity_daily') || error.code === '42P01') {
      return { ok: false, response: json(503, { error: 'activity_table_missing' }) }
    }
    return { ok: false, response: json(500, { error: 'activity_chart_failed', detail: String(error.message).slice(0, 300) }) }
  }

  const rows = (data ?? []).filter((row) => {
    if (roleFilter === 'all') return true
    return row.motivator_role === roleFilter
  })

  const seriesMap = new Map<string, Set<string>>()
  for (let i = 0; i < safeDays; i++) {
    seriesMap.set(utcDateKey(addUtcDays(start, i)), new Set())
  }

  const wauSet = new Set<string>()
  const dauTodaySet = new Set<string>()

  for (const row of rows) {
    const uid = String(row.user_id)
    const date = String(row.activity_date)
    if (date >= wauFromKey) wauSet.add(uid)
    if (date === todayKey) dauTodaySet.add(uid)
    const bucket = seriesMap.get(date)
    if (bucket) bucket.add(uid)
  }

  const series = [...seriesMap.entries()].map(([date, set]) => ({
    date,
    unique_users: set.size,
  }))

  return {
    ok: true,
    chart: {
      days: safeDays,
      role: roleFilter,
      timezone: 'UTC',
      series,
      dau_today: dauTodaySet.size,
      wau: wauSet.size,
    },
  }
}

const ACTIVITY_DAY_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ACTIVITY_DAY_USER_BATCH = 25

async function buildActivityDayUsers(
  admin: SupabaseClient,
  date: string,
  roleFilter: ActivityChartRoleFilter,
): Promise<
  | {
      ok: true
      detail: {
        date: string
        role: ActivityChartRoleFilter
        timezone: 'UTC'
        users: Array<{
          user_id: string
          email: string
          motivator_role: MotivatorRoleWire
          first_seen_at: string
          last_seen_at: string
        }>
      }
    }
  | { ok: false; response: Response }
> {
  if (!ACTIVITY_DAY_DATE_RE.test(date)) {
    return { ok: false, response: json(400, { error: 'invalid_body' }) }
  }

  const { data, error } = await admin
    .from('admin_user_activity_daily')
    .select('user_id, motivator_role, first_seen_at, last_seen_at')
    .eq('activity_date', date)
    .order('last_seen_at', { ascending: false })

  if (error) {
    if (error.message?.includes('admin_user_activity_daily') || error.code === '42P01') {
      return { ok: false, response: json(503, { error: 'activity_table_missing' }) }
    }
    return {
      ok: false,
      response: json(500, { error: 'activity_day_users_failed', detail: String(error.message).slice(0, 300) }),
    }
  }

  const rows = (data ?? []).filter((row) => {
    if (roleFilter === 'all') return true
    return row.motivator_role === roleFilter
  })

  const users: Array<{
    user_id: string
    email: string
    motivator_role: MotivatorRoleWire
    first_seen_at: string
    last_seen_at: string
  }> = []

  for (let i = 0; i < rows.length; i += ACTIVITY_DAY_USER_BATCH) {
    const chunk = rows.slice(i, i + ACTIVITY_DAY_USER_BATCH)
    const chunkUsers = await Promise.all(
      chunk.map(async (row) => {
        const user_id = String(row.user_id)
        const { data: authData } = await admin.auth.admin.getUserById(user_id)
        const email = (authData?.user?.email ?? '').trim()
        const role = row.motivator_role
        const motivator_role: MotivatorRoleWire =
          role === 'admin' || role === 'beta_tester' || role === 'user' ? role : 'user'
        return {
          user_id,
          email,
          motivator_role,
          first_seen_at: String(row.first_seen_at),
          last_seen_at: String(row.last_seen_at),
        }
      }),
    )
    users.push(...chunkUsers)
  }

  users.sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at))

  return {
    ok: true,
    detail: {
      date,
      role: roleFilter,
      timezone: 'UTC',
      users,
    },
  }
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
    b.action === 'list' ||
    b.action === 'setRole' ||
    b.action === 'overview' ||
    b.action === 'activityChart' ||
    b.action === 'activityDayUsers'
      ? b.action
      : null
  if (!action) {
    return json(400, { error: 'invalid_body' })
  }

  if (action === 'activityChart') {
    const daysRaw = typeof b.days === 'number' ? b.days : 30
    const roleRaw = b.role === 'admin' || b.role === 'beta_tester' || b.role === 'user' || b.role === 'all'
      ? b.role
      : 'all'
    const chartResult = await buildActivityChart(admin, daysRaw, roleRaw)
    if (!chartResult.ok) return chartResult.response
    return json(200, { chart: chartResult.chart })
  }

  if (action === 'activityDayUsers') {
    const dateRaw = typeof b.date === 'string' ? b.date.trim() : ''
    const roleRaw = b.role === 'admin' || b.role === 'beta_tester' || b.role === 'user' || b.role === 'all'
      ? b.role
      : 'all'
    const dayResult = await buildActivityDayUsers(admin, dateRaw, roleRaw)
    if (!dayResult.ok) return dayResult.response
    return json(200, { detail: dayResult.detail })
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
