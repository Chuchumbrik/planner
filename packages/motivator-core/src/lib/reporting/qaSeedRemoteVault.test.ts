/**
 * Upload reports QA fixture to admin user_vault (service role).
 * Run: QA_SEED_REPORTS=1 npx vitest run src/lib/reporting/qaSeedRemoteVault.test.ts
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { decryptUtf8, deriveAesKey, encryptUtf8 } from '../cryptoVault'
import {
  FIXTURE_EOD,
  FIXTURE_MIXED_TASKS,
  FIXTURE_TODAY,
} from './reportsMetricsFixtures'
import {
  aggregateRecurringMisses,
  completionDayRate,
  consecutiveDr013DaysEndingOn,
  reportsWindowKeys,
  topOneOffMissesInWindow,
  totalCompletionMarksInRange,
} from './vaultAnalytics'
import { DEFAULT_GROUP_ID, emptyVault, type VaultPayload } from '../../vault/types'

const SUPABASE_URL = 'https://ntpkveicqetjjvlnfrwc.supabase.co'
const PROJECT_REF = 'ntpkveicqetjjvlnfrwc'
const ADMIN_USER_ID = '1ed90199-6119-41da-9baa-fe177fd1a3bd'
const ADMIN_SEED_B64 = 'J8v//Q2Y6Pk3KKKKxpsDC5sVFZGgrHnWZmCr2PAwvDs='

function buildVault(): VaultPayload {
  const base = emptyVault()
  return {
    ...base,
    tasks: FIXTURE_MIXED_TASKS.map((t) => ({ ...t, groupId: DEFAULT_GROUP_ID })),
    eodCompletedLocalDates: [...FIXTURE_EOD],
  }
}

function expectedUi() {
  const periodDays = 7
  const { todayKey, fromKey, toKey } = reportsWindowKeys(periodDays, FIXTURE_TODAY)
  const eodSet = new Set(FIXTURE_EOD)
  const tasks = FIXTURE_MIXED_TASKS
  const rate = completionDayRate(tasks, fromKey, toKey)
  return {
    todayKey,
    fromKey,
    toKey,
    streak: consecutiveDr013DaysEndingOn(tasks, todayKey, eodSet),
    completionPct: Math.round(rate.ratio * 100),
    completionFraction: `${rate.daysWithCompletion}/${rate.totalDays}`,
    totalMarks: totalCompletionMarksInRange(tasks, fromKey, toKey),
    recurring: aggregateRecurringMisses(tasks, fromKey, toKey, todayKey).map((r) => ({
      title: r.task.title,
      misses: r.missedCount,
    })),
    oneOff: topOneOffMissesInWindow(tasks, fromKey, toKey, todayKey, 5).map((r) => ({
      title: r.task.title,
      date: r.scheduledLocalDate,
    })),
  }
}

function getServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key?.startsWith('eyJ')) {
    throw new Error('Set SUPABASE_SERVICE_ROLE_KEY (supabase projects api-keys --project-ref …)')
  }
  return key
}

describe.skipIf(!process.env.QA_SEED_REPORTS)('qa seed reports vault (remote)', () => {
  it('upserts admin fixture and writes expected JSON', async () => {
    const vault = buildVault()
    const key = await deriveAesKey(ADMIN_SEED_B64, '')
    const ciphertext = await encryptUtf8(JSON.stringify(vault), key)
    const roundTrip = JSON.parse(await decryptUtf8(ciphertext, key))
    expect(roundTrip.tasks).toHaveLength(6)

    const service = getServiceKey()
    const admin = createClient(SUPABASE_URL, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: existing } = await admin
      .from('user_vault')
      .select('version')
      .eq('user_id', ADMIN_USER_ID)
      .maybeSingle()
    const version = Math.max(100, (existing?.version ?? 0) + 1)

    const { error } = await admin.from('user_vault').upsert(
      {
        user_id: ADMIN_USER_ID,
        ciphertext,
        version,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    expect(error).toBeNull()

    const expected = expectedUi()
    const outPath = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../../docs/qa-reports-ui-expected.json',
    )
    writeFileSync(outPath, JSON.stringify(expected, null, 2), 'utf8')
    console.log('Seeded version', version, 'expected ->', outPath)
  })
})
