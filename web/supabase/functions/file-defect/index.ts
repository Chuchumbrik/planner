/**
 * GitHub Issue из приложения (JWT, роли admin | beta_tester).
 * Секреты: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GITHUB_TOKEN,
 * GITHUB_DEFECT_REPO. Опционально: GITHUB_DEFECT_LABELS, GITHUB_DEFECT_ALLOWED_LABELS,
 * GITHUB_DEFECT_TYPE_LABELS (JSON переопределения slug→label), DEFECT_ATTACHMENT_SIGNED_URL_TTL_SEC.
 *
 * Тело: title, description; optional steps, expected, actual, userAgent, appVersion, route, locale,
 * defect_type (bug|ui_ux|performance|enhancement|other), attachment_paths (≤2), draft_id (uuid),
 * device_meta { viewport?, device_class?, device_pixel_ratio? }.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_TITLE = 120
const MAX_DESCRIPTION = 8000
const MAX_STEPS = 4000
const MAX_EXPECTED = 2000
const MAX_ACTUAL = 2000
const MAX_USER_AGENT = 400
const MAX_APP_VERSION = 200
const MAX_ROUTE = 512
const MAX_BODY_JSON = 96_000
const MAX_ATTACHMENTS = 2
const MAX_VIEWPORT = 40
/** Максимум отправок дефектов на пользователя за скользящее окно (см. defect_submissions). */
const DEFECT_RATE_LIMIT_PER_HOUR = 10
const DEFECT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

const DEFECT_TYPES = ['bug', 'ui_ux', 'performance', 'enhancement', 'other'] as const
type DefectType = (typeof DEFECT_TYPES)[number]

const DEFAULT_TYPE_TO_LABEL: Record<DefectType, string> = {
  bug: 'bug',
  ui_ux: 'ui-ux',
  performance: 'performance',
  enhancement: 'enhancement',
  other: 'other',
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function parseRepo(raw: string): { owner: string; repo: string } | null {
  const s = raw.trim()
  const m = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/.exec(s)
  if (!m) return null
  return { owner: m[1], repo: m[2] }
}

function parseLabels(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function parseAllowedLabels(raw: string | undefined): Set<string> | null {
  if (!raw?.trim()) return null
  return new Set(
    raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  )
}

function parseTypeLabelOverrides(raw: string | undefined): Partial<Record<DefectType, string>> | null {
  if (!raw?.trim()) return null
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    if (!o || typeof o !== 'object') return null
    const out: Partial<Record<DefectType, string>> = {}
    for (const k of DEFECT_TYPES) {
      const v = o[k]
      if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 64)
    }
    return out
  } catch {
    return null
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

function validateAttachmentPaths(paths: string[], uid: string): boolean {
  if (paths.length > MAX_ATTACHMENTS) return false
  const prefix = `${uid}/`
  const draftRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\//i
  for (const p of paths) {
    if (typeof p !== 'string' || p.length > 512) return false
    if (!p.startsWith(prefix)) return false
    const rest = p.slice(prefix.length)
    if (!draftRe.test(rest)) return false
    if (/\.\.|%2f|%2F/i.test(p)) return false
  }
  return true
}

function parseDeviceMeta(raw: unknown): {
  viewport?: string
  device_class?: string
  device_pixel_ratio?: number
} {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const viewport = typeof o.viewport === 'string' ? o.viewport.trim().slice(0, MAX_VIEWPORT) : undefined
  const device_class = typeof o.device_class === 'string' ? o.device_class.trim().slice(0, 32) : undefined
  const device_pixel_ratio =
    typeof o.device_pixel_ratio === 'number' && Number.isFinite(o.device_pixel_ratio)
      ? Math.min(99, Math.max(0.25, o.device_pixel_ratio))
      : undefined
  return { viewport, device_class, device_pixel_ratio }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  const ghToken = Deno.env.get('GITHUB_TOKEN') ?? ''
  const ghRepoRaw = Deno.env.get('GITHUB_DEFECT_REPO') ?? ''
  const ghLabelsRaw = Deno.env.get('GITHUB_DEFECT_LABELS') ?? ''
  const allowedLabelsRaw = Deno.env.get('GITHUB_DEFECT_ALLOWED_LABELS') ?? ''
  const typeLabelsRaw = Deno.env.get('GITHUB_DEFECT_TYPE_LABELS') ?? ''
  const signedTtlSec = Math.min(
    7 * 24 * 3600,
    Math.max(60, Number(Deno.env.get('DEFECT_ATTACHMENT_SIGNED_URL_TTL_SEC') ?? '3600') || 3600),
  )
  const parsedRepo = parseRepo(ghRepoRaw)

  if (!ghToken || !parsedRepo) {
    return json(500, { error: 'github_not_configured' })
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

  const admin = createClient(supabaseUrl, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: adminUser, error: adminErr } = await admin.auth.admin.getUserById(uid)
  if (adminErr || !adminUser?.user) {
    return json(500, { error: 'role_lookup_failed' })
  }
  const role = (adminUser.user.app_metadata as Record<string, unknown> | undefined)?.motivator_role
  const isQa = role === 'admin' || role === 'beta_tester'
  if (!isQa) {
    return json(403, { error: 'forbidden' })
  }

  let rawText: string
  try {
    rawText = await req.text()
  } catch {
    return json(400, { error: 'invalid_body' })
  }
  if (rawText.length > MAX_BODY_JSON) {
    return json(413, { error: 'payload_too_large' })
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

  const title = typeof b.title === 'string' ? b.title.trim() : ''
  const description = typeof b.description === 'string' ? b.description.trim() : ''
  const steps = typeof b.steps === 'string' ? b.steps.trim() : ''
  const expected = typeof b.expected === 'string' ? b.expected.trim() : ''
  const actual = typeof b.actual === 'string' ? b.actual.trim() : ''
  const userAgent = typeof b.userAgent === 'string' ? b.userAgent.trim() : ''
  const appVersion = typeof b.appVersion === 'string' ? b.appVersion.trim() : ''
  const route = typeof b.route === 'string' ? b.route.trim() : ''
  const locale =
    b.locale === 'en' || b.locale === 'ru' ? (b.locale as 'en' | 'ru') : undefined
  const defectTypeRaw = typeof b.defect_type === 'string' ? b.defect_type.trim() : 'bug'
  const draftId = typeof b.draft_id === 'string' ? b.draft_id.trim() : ''
  const deviceMeta = parseDeviceMeta(b.device_meta)

  const attachmentPaths: string[] = []
  if (Array.isArray(b.attachment_paths)) {
    for (const x of b.attachment_paths) {
      if (typeof x === 'string' && x.trim()) attachmentPaths.push(x.trim())
    }
  }

  if (!DEFECT_TYPES.includes(defectTypeRaw as DefectType)) {
    return json(400, { error: 'invalid_defect_type' })
  }
  const defectType = defectTypeRaw as DefectType

  if (!title || title.length > MAX_TITLE) {
    return json(400, { error: 'invalid_body' })
  }
  if (!description || description.length > MAX_DESCRIPTION) {
    return json(400, { error: 'invalid_body' })
  }
  if (steps.length > MAX_STEPS) {
    return json(400, { error: 'invalid_body' })
  }
  if (expected.length > MAX_EXPECTED || actual.length > MAX_ACTUAL) {
    return json(400, { error: 'invalid_body' })
  }
  if (userAgent.length > MAX_USER_AGENT) {
    return json(400, { error: 'invalid_body' })
  }
  if (appVersion.length > MAX_APP_VERSION || route.length > MAX_ROUTE) {
    return json(400, { error: 'invalid_body' })
  }
  if (draftId && !isUuid(draftId)) {
    return json(400, { error: 'invalid_body' })
  }
  if (!validateAttachmentPaths(attachmentPaths, uid)) {
    return json(400, { error: 'invalid_attachments' })
  }

  const rateSince = new Date(Date.now() - DEFECT_RATE_LIMIT_WINDOW_MS).toISOString()
  const { count: recentCount, error: rateErr } = await admin
    .from('defect_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', uid)
    .gte('created_at', rateSince)

  if (rateErr) {
    return json(500, { error: 'rate_check_failed' })
  }
  if ((recentCount ?? 0) >= DEFECT_RATE_LIMIT_PER_HOUR) {
    return json(429, { error: 'rate_limited' })
  }

  const typeOverrides = parseTypeLabelOverrides(typeLabelsRaw)
  const typeLabel = (typeOverrides?.[defectType] ?? DEFAULT_TYPE_TO_LABEL[defectType]).slice(0, 64)
  const defaultLabels = parseLabels(ghLabelsRaw)
  const allowSet = parseAllowedLabels(allowedLabelsRaw)

  const issueLabels = [...new Set([...defaultLabels, typeLabel])]
  if (allowSet) {
    for (const lab of issueLabels) {
      if (!allowSet.has(lab)) {
        return json(400, { error: 'label_not_allowed', detail: lab })
      }
    }
  }

  const issueBodyParts: string[] = []
  issueBodyParts.push(description)
  if (steps) {
    issueBodyParts.push('')
    issueBodyParts.push('### Steps to reproduce')
    issueBodyParts.push(steps)
  }
  if (expected) {
    issueBodyParts.push('')
    issueBodyParts.push('### Expected')
    issueBodyParts.push(expected)
  }
  if (actual) {
    issueBodyParts.push('')
    issueBodyParts.push('### Actual')
    issueBodyParts.push(actual)
  }

  if (attachmentPaths.length) {
    issueBodyParts.push('')
    issueBodyParts.push('### Screenshots')
    for (let i = 0; i < attachmentPaths.length; i++) {
      const p = attachmentPaths[i]
      const { data: signed, error: signErr } = await admin.storage
        .from('defect-attachments')
        .createSignedUrl(p, signedTtlSec)
      if (signErr || !signed?.signedUrl) {
        return json(400, { error: 'storage_signed_url_failed' })
      }
      issueBodyParts.push(`![screenshot-${i + 1}](${signed.signedUrl})`)
    }
    issueBodyParts.push('')
    issueBodyParts.push(
      `*(Signed URLs expire after **${signedTtlSec}s**; clone or download before expiry if needed.)*`,
    )
  }

  issueBodyParts.push('')
  issueBodyParts.push('---')
  issueBodyParts.push('')
  issueBodyParts.push('### Environment')
  issueBodyParts.push(`- **App version:** ${appVersion || '(not provided)'}`)
  issueBodyParts.push(`- **Route:** ${route || '(not provided)'}`)
  issueBodyParts.push(`- **Locale:** ${locale ?? '(not provided)'}`)
  issueBodyParts.push(`- **Motivator role:** \`${String(role)}\``)
  issueBodyParts.push(`- **User id:** \`${uid}\``)
  if (userAgent) {
    issueBodyParts.push(`- **User agent:** \`${userAgent.replace(/`/g, "'")}\``)
  }
  if (deviceMeta.viewport) {
    issueBodyParts.push(`- **Viewport:** \`${deviceMeta.viewport.replace(/`/g, "'")}\``)
  }
  if (deviceMeta.device_pixel_ratio != null) {
    issueBodyParts.push(`- **Device pixel ratio:** ${deviceMeta.device_pixel_ratio}`)
  }
  if (deviceMeta.device_class) {
    issueBodyParts.push(`- **Device class:** \`${deviceMeta.device_class.replace(/`/g, "'")}\``)
  }

  const issueBody = issueBodyParts.join('\n')
  if (issueBody.length > 65_000) {
    return json(413, { error: 'payload_too_large' })
  }

  const ghPayload: Record<string, unknown> = {
    title,
    body: issueBody,
  }
  if (issueLabels.length) {
    ghPayload.labels = issueLabels
  }

  const ghRes = await fetch(
    `https://api.github.com/repos/${parsedRepo.owner}/${parsedRepo.repo}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'motivator-file-defect-edge',
      },
      body: JSON.stringify(ghPayload),
    },
  )

  if (ghRes.status === 429) {
    return json(429, { error: 'github_rate_limit' })
  }
  if (ghRes.status === 401 || ghRes.status === 403) {
    return json(502, { error: 'github_auth_error' })
  }

  let ghJson: unknown
  try {
    ghJson = await ghRes.json()
  } catch {
    return json(502, { error: 'github_error' })
  }

  if (!ghRes.ok) {
    const msg =
      ghJson && typeof ghJson === 'object' && 'message' in ghJson
        ? String((ghJson as { message?: unknown }).message).slice(0, 500)
        : `http_${ghRes.status}`
    return json(502, { error: 'github_error', detail: msg })
  }

  const htmlUrl =
    ghJson && typeof ghJson === 'object' && 'html_url' in ghJson
      ? String((ghJson as { html_url?: unknown }).html_url)
      : ''
  const issueNumber =
    ghJson && typeof ghJson === 'object' && 'number' in ghJson
      ? Number((ghJson as { number?: unknown }).number)
      : NaN

  if (!htmlUrl) {
    return json(502, { error: 'github_error' })
  }

  await admin.from('defect_submissions').insert({ user_id: uid })

  if (draftId && isUuid(draftId)) {
    const { error: upErr } = await admin
      .from('defect_attachment_drafts')
      .update({ submitted_at: new Date().toISOString(), storage_paths: [] })
      .eq('user_id', uid)
      .eq('draft_id', draftId)
    if (upErr) {
      console.warn('defect draft submit marker failed', upErr)
    }
  }

  return json(200, {
    issue_url: htmlUrl,
    issue_number: Number.isFinite(issueNumber) ? issueNumber : null,
    suggested_labels: issueLabels,
  })
})
