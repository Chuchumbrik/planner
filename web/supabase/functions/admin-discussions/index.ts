/**
 * Discussions backend (Phase 7.8). Треды обсуждений админа: list/get/create/reply/
 * resolve/mark-synced/archive/mark-read/subscribe/unsubscribe.
 *
 * Доступ: admin — все действия; beta_tester — чтение + reply + read/subscribe; user — 403.
 * Все записи — service role (обходит RLS); роль проверяется здесь по app_metadata.motivator_role.
 * Секреты: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_TITLE = 200
const MAX_BODY = 20_000
const MAX_SUMMARY = 20_000
const STATUS_RANK: Record<string, number> = { open: 0, 'pending-journal': 1, synced: 2, archived: 3 }

type Role = 'admin' | 'beta_tester' | 'user'

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function roleFromMeta(meta: Record<string, unknown> | undefined): Role {
  const r = meta?.motivator_role
  return r === 'admin' || r === 'beta_tester' ? r : 'user'
}

async function gate(
  url: string,
  anon: string,
  service: string,
  jwt: string,
): Promise<{ ok: true; uid: string; role: Role } | { ok: false; response: Response }> {
  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${jwt}` } } })
  const { data: userData, error } = await userClient.auth.getUser()
  if (error || !userData.user) return { ok: false, response: json(401, { error: 'invalid_token' }) }
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: full, error: rErr } = await admin.auth.admin.getUserById(userData.user.id)
  if (rErr || !full?.user) return { ok: false, response: json(500, { error: 'role_lookup_failed' }) }
  const role = roleFromMeta(full.user.app_metadata as Record<string, unknown> | undefined)
  if (role === 'user') return { ok: false, response: json(403, { error: 'forbidden' }) }
  return { ok: true, uid: userData.user.id, role }
}

async function autoSubscribe(admin: SupabaseClient, uid: string, discussionId: string) {
  await admin
    .from('admin_discussion_subscribers')
    .upsert({ user_id: uid, discussion_id: discussionId }, { onConflict: 'user_id,discussion_id', ignoreDuplicates: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!url || !anon || !service) return json(500, { error: 'supabase_env_missing' })

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!jwt) return json(401, { error: 'missing_authorization' })

  const g = await gate(url, anon, service, jwt)
  if (!g.ok) return g.response
  const { uid, role } = g

  let body: Record<string, unknown>
  try {
    body = JSON.parse((await req.text()) || '{}')
  } catch {
    return json(400, { error: 'invalid_body' })
  }

  const action = typeof body.action === 'string' ? body.action : ''
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } })

  const adminOnly = new Set(['create', 'resolve', 'mark-synced', 'archive'])
  if (adminOnly.has(action) && role !== 'admin') return json(403, { error: 'admin_only' })

  const discussionId = str(body.discussionId, 100)
  const needsId = new Set(['get', 'reply', 'resolve', 'mark-synced', 'archive', 'mark-read', 'subscribe', 'unsubscribe'])
  if (needsId.has(action) && !UUID_RE.test(discussionId)) return json(400, { error: 'invalid_discussion_id' })

  switch (action) {
    case 'list': {
      const { data: rows, error } = await admin
        .from('admin_discussions')
        .select('id,title,body,status,created_at,updated_at,reply_count,last_reply_at,linked_journal_entry,linked_version')
      if (error) return json(500, { error: 'list_failed', detail: error.message })
      const { data: reads } = await admin
        .from('admin_discussion_read')
        .select('discussion_id,last_read_at')
        .eq('user_id', uid)
      const readMap = new Map((reads ?? []).map((r) => [r.discussion_id, r.last_read_at]))
      const list = (rows ?? [])
        .map((d) => {
          const lastRead = readMap.get(d.id)
          const unread = Boolean(d.last_reply_at && (!lastRead || d.last_reply_at > lastRead))
          return { ...d, unread }
        })
        .sort((a, b) => {
          const r = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9)
          if (r !== 0) return r
          return String(b.last_reply_at ?? b.created_at).localeCompare(String(a.last_reply_at ?? a.created_at))
        })
      return json(200, { discussions: list })
    }

    case 'get': {
      const { data: discussion, error } = await admin
        .from('admin_discussions')
        .select('*')
        .eq('id', discussionId)
        .maybeSingle()
      if (error) return json(500, { error: 'get_failed', detail: error.message })
      if (!discussion) return json(404, { error: 'not_found' })
      const { data: replies } = await admin
        .from('admin_discussion_replies')
        .select('id,body,created_at,created_by')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true })
      const { data: sub } = await admin
        .from('admin_discussion_subscribers')
        .select('user_id')
        .eq('discussion_id', discussionId)
        .eq('user_id', uid)
        .maybeSingle()
      return json(200, { discussion, replies: replies ?? [], subscribed: Boolean(sub) })
    }

    case 'create': {
      const title = str(body.title, MAX_TITLE)
      const text = str(body.body, MAX_BODY)
      if (!title || !text) return json(400, { error: 'title_body_required' })
      const linkedVersion = str(body.linkedVersion, 50) || null
      const { data: created, error } = await admin
        .from('admin_discussions')
        .insert({ title, body: text, created_by: uid, linked_version: linkedVersion })
        .select('*')
        .single()
      if (error) return json(500, { error: 'create_failed', detail: error.message })
      await autoSubscribe(admin, uid, created.id)
      return json(200, { discussion: created })
    }

    case 'reply': {
      const text = str(body.body, MAX_BODY)
      if (!text) return json(400, { error: 'body_required' })
      const { data: exists } = await admin.from('admin_discussions').select('id').eq('id', discussionId).maybeSingle()
      if (!exists) return json(404, { error: 'not_found' })
      const { data: reply, error } = await admin
        .from('admin_discussion_replies')
        .insert({ discussion_id: discussionId, body: text, created_by: uid })
        .select('id,body,created_at,created_by')
        .single()
      if (error) return json(500, { error: 'reply_failed', detail: error.message })
      await autoSubscribe(admin, uid, discussionId)
      return json(200, { reply })
    }

    case 'resolve': {
      const summary = str(body.resolutionSummary, MAX_SUMMARY)
      if (!summary) return json(400, { error: 'summary_required' })
      const { data: cur } = await admin.from('admin_discussions').select('status').eq('id', discussionId).maybeSingle()
      if (!cur) return json(404, { error: 'not_found' })
      if (cur.status !== 'open') return json(409, { error: 'bad_status', current: cur.status })
      const { data: upd, error } = await admin
        .from('admin_discussions')
        .update({ status: 'pending-journal', resolution_summary: summary, updated_at: new Date().toISOString() })
        .eq('id', discussionId)
        .select('*')
        .single()
      if (error) return json(500, { error: 'resolve_failed', detail: error.message })
      return json(200, { discussion: upd })
    }

    case 'mark-synced': {
      const journalEntry = str(body.linkedJournalEntry, 100)
      if (!journalEntry) return json(400, { error: 'journal_entry_required' })
      const linkedVersion = str(body.linkedVersion, 50) || null
      const { data: cur } = await admin.from('admin_discussions').select('status').eq('id', discussionId).maybeSingle()
      if (!cur) return json(404, { error: 'not_found' })
      if (cur.status !== 'pending-journal') return json(409, { error: 'bad_status', current: cur.status })
      const patch: Record<string, unknown> = {
        status: 'synced',
        linked_journal_entry: journalEntry,
        updated_at: new Date().toISOString(),
      }
      if (linkedVersion) patch.linked_version = linkedVersion
      const { data: upd, error } = await admin
        .from('admin_discussions')
        .update(patch)
        .eq('id', discussionId)
        .select('*')
        .single()
      if (error) return json(500, { error: 'mark_synced_failed', detail: error.message })
      return json(200, { discussion: upd })
    }

    case 'archive': {
      const { data: upd, error } = await admin
        .from('admin_discussions')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', discussionId)
        .select('*')
        .single()
      if (error) return json(500, { error: 'archive_failed', detail: error.message })
      return json(200, { discussion: upd })
    }

    case 'mark-read': {
      const { error } = await admin
        .from('admin_discussion_read')
        .upsert({ user_id: uid, discussion_id: discussionId, last_read_at: new Date().toISOString() }, { onConflict: 'user_id,discussion_id' })
      if (error) return json(500, { error: 'mark_read_failed', detail: error.message })
      return json(200, { ok: true })
    }

    case 'subscribe': {
      await autoSubscribe(admin, uid, discussionId)
      return json(200, { ok: true, subscribed: true })
    }

    case 'unsubscribe': {
      const { error } = await admin
        .from('admin_discussion_subscribers')
        .delete()
        .eq('user_id', uid)
        .eq('discussion_id', discussionId)
      if (error) return json(500, { error: 'unsubscribe_failed', detail: error.message })
      return json(200, { ok: true, subscribed: false })
    }

    default:
      return json(400, { error: 'unknown_action' })
  }
})
