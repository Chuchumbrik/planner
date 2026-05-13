/**
 * Удаляет неотправленные черновики вложений старше 24 ч (storage + строки defect_attachment_drafts).
 * Вызов: POST; если задан CRON_SECRET — заголовок Authorization: Bearer <CRON_SECRET>.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (cronSecret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${cronSecret}`) {
      return json(401, { error: 'unauthorized' })
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !service) {
    return json(500, { error: 'supabase_env_missing' })
  }

  const admin = createClient(supabaseUrl, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error: selErr } = await admin
    .from('defect_attachment_drafts')
    .select('user_id, draft_id, storage_paths')
    .is('submitted_at', null)
    .lt('created_at', cutoff)

  if (selErr) {
    return json(500, { error: 'select_failed', detail: selErr.message })
  }

  let removedRows = 0
  let removedFiles = 0

  for (const row of rows ?? []) {
    const paths = Array.isArray(row.storage_paths) ? (row.storage_paths as string[]) : []
    for (const p of paths) {
      if (typeof p === 'string' && p.length > 0) {
        const { error: rmErr } = await admin.storage.from('defect-attachments').remove([p])
        if (!rmErr) removedFiles++
      }
    }
    const { error: delErr } = await admin
      .from('defect_attachment_drafts')
      .delete()
      .eq('user_id', row.user_id as string)
      .eq('draft_id', row.draft_id as string)
    if (!delErr) removedRows++
  }

  return json(200, { removed_rows: removedRows, removed_files: removedFiles })
})
