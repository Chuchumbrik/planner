/**
 * Seed admin QA vault for reports UI parity (FIXTURE_MIXED + EOD, T=2026-05-28).
 * Run: node scripts/qa-seed-reports-vault.mjs
 * Requires: Supabase CLI keys (same as qa-finish-role-accounts.mjs).
 */
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SUPABASE_URL = 'https://ntpkveicqetjjvlnfrwc.supabase.co'
const PROJECT_REF = 'ntpkveicqetjjvlnfrwc'

/** planner-qa-admin — см. .cursor/test-accounts.local.md */
const ADMIN_USER_ID = '1ed90199-6119-41da-9baa-fe177fd1a3bd'
const ADMIN_SEED_B64 = 'J8v//Q2Y6Pk3KKKKxpsDC5sVFZGgrHnWZmCr2PAwvDs='
const KDF_PASSWORD = ''

const PBKDF2_ITERATIONS = 310_000

function bytesToB64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return Buffer.from(binary).toString('base64')
}

function b64ToBytes(b64) {
  return new Uint8Array(Buffer.from(b64, 'base64'))
}

function asBufferSource(data) {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
}

async function deriveAesKey(seedB64, password) {
  const salt = b64ToBytes(seedB64)
  const baseKey = await crypto.subtle.importKey(
    'raw',
    asBufferSource(new TextEncoder().encode(password)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: asBufferSource(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    256,
  )
  return crypto.subtle.importKey(
    'raw',
    asBufferSource(new Uint8Array(bits)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function encryptUtf8(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asBufferSource(iv) },
    key,
    asBufferSource(new TextEncoder().encode(plaintext)),
  )
  return `${bytesToB64(iv)}.${bytesToB64(new Uint8Array(ct))}`
}

async function decryptUtf8(payload, key) {
  const [ivB64, ctB64] = payload.split('.')
  if (!ivB64 || !ctB64) throw new Error('bad ciphertext format')
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(b64ToBytes(ivB64)) },
    key,
    asBufferSource(b64ToBytes(ctB64)),
  )
  return new TextDecoder().decode(plain)
}

function parseKeyLine(out, name) {
  const line = out.split('\n').find((l) => l.includes(name))
  if (!line) return null
  const parts = line.split('|').map((s) => s.trim())
  const key = parts[parts.length - 1]
  return key?.startsWith('eyJ') ? key : null
}

function getServiceKey() {
  const out = execSync(`npx supabase projects api-keys --project-ref ${PROJECT_REF}`, {
    encoding: 'utf8',
    cwd: join(dirname(fileURLToPath(import.meta.url)), '..', 'web'),
  })
  const service = parseKeyLine(out, 'service_role')
  if (!service) throw new Error('service_role key not found')
  return service
}

const taskBase = {
  done: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  groupId: 'grp_default',
  colorKey: 'zinc',
  checklist: [],
  priorityRank: 3,
  scheduledLocalDate: null,
  estimatedMinutes: null,
  timeMode: 'none',
  timeMinutesFromMidnight: null,
  recurrence: null,
  recurrenceAnchorLocalDate: null,
  completedOccurrenceLocalDates: [],
}

function buildReportsFixtureVault() {
  const tasks = [
    {
      ...taskBase,
      id: 'rec-daily',
      title: 'Daily habit',
      recurrence: { kind: 'daily' },
      recurrenceAnchorLocalDate: '2026-05-01',
      completedOccurrenceLocalDates: ['2026-05-27', '2026-05-28'],
    },
    {
      ...taskBase,
      id: 'rec-weekly',
      title: 'Weekly Mon/Wed/Fri',
      recurrence: { kind: 'weekly', weekdays: [1, 3, 5] },
      recurrenceAnchorLocalDate: '2026-05-01',
      completedOccurrenceLocalDates: [],
    },
    {
      ...taskBase,
      id: 'one-off-miss',
      title: 'One-off overdue',
      scheduledLocalDate: '2026-05-23',
    },
    {
      ...taskBase,
      id: 'one-off-done',
      title: 'One-off done',
      scheduledLocalDate: '2026-05-22',
      done: true,
    },
    {
      ...taskBase,
      id: 'orphan-mark',
      title: 'Mark outside window',
      recurrence: { kind: 'daily' },
      recurrenceAnchorLocalDate: '2026-05-01',
      completedOccurrenceLocalDates: ['2026-05-10'],
    },
    {
      ...taskBase,
      id: 'archived-series',
      title: 'Archived series',
      done: true,
      recurrence: { kind: 'daily' },
      recurrenceAnchorLocalDate: '2026-05-01',
    },
  ]

  return {
    schemaVersion: 8,
    priorityLabels: {
      1: 'Уровень 1',
      2: 'Уровень 2',
      3: 'Уровень 3',
      4: 'Уровень 4',
      5: 'Уровень 5',
    },
    groups: [{ id: 'grp_default', name: 'Общее', sortOrder: 0 }],
    tasks,
    drafts: [],
    eodCompletedLocalDates: ['2026-05-26', '2026-05-27', '2026-05-28'],
    eodPreferences: { enabled: true, autoCloseAtDayEnd: false },
    notificationPreferences: { deliveryMode: 'off' },
  }
}

/** Ожидания UI при QA clock T=2026-05-28 (сверка с vitest contract). */
export const QA_REPORTS_UI_EXPECTED = {
  todayKey: '2026-05-28',
  fromKey: '2026-05-21',
  toKey: '2026-05-27',
  streak: 2,
  completionPct: 29,
  completionFraction: '2/7',
  totalMarks: 2,
  recurring: [
    { title: 'Daily habit', misses: 6 },
    { title: 'Weekly Mon/Wed/Fri', misses: 3 },
  ],
  oneOff: [{ title: 'One-off overdue', date: '2026-05-23' }],
}

async function main() {
  const vault = buildReportsFixtureVault()
  const key = await deriveAesKey(ADMIN_SEED_B64, KDF_PASSWORD)
  const json = JSON.stringify(vault)
  const ciphertext = await encryptUtf8(json, key)
  const localCheck = JSON.parse(await decryptUtf8(ciphertext, key))
  if (localCheck.tasks?.length !== vault.tasks.length) {
    throw new Error('local encrypt round-trip failed')
  }
  console.log('Local encrypt OK, tasks=', localCheck.tasks.length)

  const service = getServiceKey()
  const admin = createClient(SUPABASE_URL, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: existing } = await admin
    .from('user_vault')
    .select('version')
    .eq('user_id', ADMIN_USER_ID)
    .maybeSingle()
  const nextVersion = Math.max(100, (existing?.version ?? 0) + 1)

  const { error } = await admin.from('user_vault').upsert(
    {
      user_id: ADMIN_USER_ID,
      ciphertext,
      version: nextVersion,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(error.message)

  const { data: row } = await admin
    .from('user_vault')
    .select('ciphertext')
    .eq('user_id', ADMIN_USER_ID)
    .single()
  const roundTrip = JSON.parse(await decryptUtf8(row.ciphertext, key))
  console.log('Verify remote vault: tasks=', roundTrip.tasks?.length, 'eod=', roundTrip.eodCompletedLocalDates)

  const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'qa-reports-ui-expected.json')
  writeFileSync(outPath, JSON.stringify(QA_REPORTS_UI_EXPECTED, null, 2), 'utf8')

  console.log('Seeded user_vault for', ADMIN_USER_ID)
  console.log('Expected UI metrics:', outPath)
  console.log(JSON.stringify(QA_REPORTS_UI_EXPECTED, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
