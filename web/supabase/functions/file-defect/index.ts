/**
 * Создание GitHub Issue от имени пользователя с ролью admin или beta_tester (JWT).
 * Секреты: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GITHUB_TOKEN,
 * GITHUB_DEFECT_REPO (owner/repo). Опционально: GITHUB_DEFECT_LABELS (через запятую).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_TITLE = 120
const MAX_DESCRIPTION = 8000
const MAX_STEPS = 4000
const MAX_APP_VERSION = 200
const MAX_ROUTE = 512
const MAX_BODY_JSON = 48_000

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
  if (role !== 'admin' && role !== 'beta_tester') {
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
  const appVersion = typeof b.appVersion === 'string' ? b.appVersion.trim() : ''
  const route = typeof b.route === 'string' ? b.route.trim() : ''
  const locale =
    b.locale === 'en' || b.locale === 'ru' ? (b.locale as 'en' | 'ru') : undefined

  if (!title || title.length > MAX_TITLE) {
    return json(400, { error: 'invalid_body' })
  }
  if (!description || description.length > MAX_DESCRIPTION) {
    return json(400, { error: 'invalid_body' })
  }
  if (steps.length > MAX_STEPS) {
    return json(400, { error: 'invalid_body' })
  }
  if (appVersion.length > MAX_APP_VERSION || route.length > MAX_ROUTE) {
    return json(400, { error: 'invalid_body' })
  }

  const issueBodyParts: string[] = []
  issueBodyParts.push(description)
  issueBodyParts.push('')
  issueBodyParts.push('---')
  issueBodyParts.push('')
  issueBodyParts.push('### Environment')
  issueBodyParts.push(`- **App version:** ${appVersion || '(not provided)'}`)
  issueBodyParts.push(`- **Route:** ${route || '(not provided)'}`)
  issueBodyParts.push(`- **Locale:** ${locale ?? '(not provided)'}`)
  issueBodyParts.push(`- **User id:** \`${uid}\``)
  if (steps) {
    issueBodyParts.push('')
    issueBodyParts.push('### Steps to reproduce')
    issueBodyParts.push(steps)
  }

  const issueBody = issueBodyParts.join('\n')
  if (issueBody.length > 65_000) {
    return json(413, { error: 'payload_too_large' })
  }

  const defaultLabels = parseLabels(ghLabelsRaw)
  const ghPayload: Record<string, unknown> = {
    title,
    body: issueBody,
  }
  if (defaultLabels.length) {
    ghPayload.labels = defaultLabels
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

  return json(200, { issue_url: htmlUrl, issue_number: Number.isFinite(issueNumber) ? issueNumber : null })
})
