/**
 * Create 3 synthetic QA users (user / beta_tester / admin), verify roles, delete legacy test account.
 * Run: node scripts/qa-provision-role-accounts.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SUPABASE_URL = 'https://ntpkveicqetjjvlnfrwc.supabase.co'
const LEGACY_EMAIL = 'mussha2010@yandex.ru'
const PROJECT_REF = 'ntpkveicqetjjvlnfrwc'
const QA_EMAIL_PREFIX = 'planner-qa-'

function getServiceRoleKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
  }
  const out = execSync(
    `npx supabase projects api-keys --project-ref ${PROJECT_REF}`,
    { encoding: 'utf8', cwd: join(dirname(fileURLToPath(import.meta.url)), '..', 'web') },
  )
  const line = out.split('\n').find((l) => l.includes('service_role'))
  if (!line) throw new Error('service_role key not found in CLI output')
  const parts = line.split('|').map((s) => s.trim())
  const key = parts[parts.length - 1]
  if (!key?.startsWith('eyJ')) throw new Error('invalid service_role key')
  return key
}

function synthEmail(roleSlug) {
  const tag = randomBytes(4).toString('hex')
  return `${QA_EMAIL_PREFIX}${roleSlug}-${tag}@qa.motivator.invalid`
}

function synthPassword() {
  return `SynthQa-${randomBytes(5).toString('base64url')}!9`
}

function synthSeedB64() {
  return randomBytes(32).toString('base64')
}

const ROLES = [
  { role: 'user', slug: 'user', labelRu: 'Обычный пользователь' },
  { role: 'beta_tester', slug: 'beta', labelRu: 'Бета-тестер' },
  { role: 'admin', slug: 'admin', labelRu: 'Администратор' },
]

async function setMotivatorRole(admin, userId, role, prevMeta = {}) {
  const nextMeta = { ...prevMeta }
  if (role === 'user') {
    nextMeta.motivator_role = null
  } else {
    nextMeta.motivator_role = role
  }
  const { error } = await admin.auth.admin.updateUserById(userId, { app_metadata: nextMeta })
  if (error) throw new Error(`setRole ${role}: ${error.message}`)
}

function wireRole(meta) {
  const r = meta?.motivator_role
  if (r === 'admin') return 'admin'
  if (r === 'beta_tester') return 'beta_tester'
  return 'user'
}

async function deleteQaUsers(admin) {
  for (let page = 1; page <= 40; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const batch = data?.users ?? []
    for (const u of batch) {
      const email = (u.email ?? '').toLowerCase()
      if (email.startsWith(QA_EMAIL_PREFIX) || email === LEGACY_EMAIL.toLowerCase()) {
        const { error: delErr } = await admin.auth.admin.deleteUser(u.id)
        console.log(delErr ? `FAIL delete ${email}` : `deleted ${email}`)
      }
    }
    if (batch.length < 100) break
  }
}

async function createOne(admin, spec) {
  const email = synthEmail(spec.slug)
  const password = synthPassword()
  const seed = synthSeedB64()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`createUser ${spec.role}: ${error.message}`)

  const userId = data.user.id
  await setMotivatorRole(admin, userId, spec.role, data.user.app_metadata ?? {})

  const { data: check } = await admin.auth.admin.getUserById(userId)
  const wire = wireRole(check.user?.app_metadata)
  if (wire !== spec.role) {
    throw new Error(`role mismatch ${email}: expected ${spec.role}, got ${wire}`)
  }

  console.log(`OK ${spec.role}: ${email}`)
  return {
    role: spec.role,
    labelRu: spec.labelRu,
    email,
    password,
    seed,
    userId,
    verifiedRole: wire,
  }
}

function writeDocs(created, legacyDeleted) {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
  const outPath = join(repoRoot, '.cursor', 'test-accounts.local.md')
  const date = new Date().toISOString().slice(0, 10)

  const body = `# Тестовые учётные записи QA (роли)

**Не коммитить.** Файл в \`.gitignore\` — только для ручного QA и агентов.

**Создано:** ${date} (скрипт \`scripts/qa-provision-role-accounts.mjs\`, синтетические данные).

**Прежняя УЗ:** \`${LEGACY_EMAIL}\` — ${legacyDeleted ? '**удалена** из Supabase Auth' : 'не найдена при прогоне'}.

**Supabase project:** \`${PROJECT_REF}\` · \`${SUPABASE_URL}\`

**Пароль KDF (vault):** не задавали — на \`/onboarding\` вставить seed из таблицы; KDF сначала **пустой**.

---

${created
  .map(
    (a) => `## ${a.labelRu} (\`motivator_role: ${a.role}\`)

| Поле | Значение |
|------|----------|
| Email | \`${a.email}\` |
| Пароль входа (Supabase Auth) | \`${a.password}\` |
| User ID | \`${a.userId}\` |
| Seed vault (base64, синт.) | \`${a.seed}\` |
| Роль (проверено) | \`${a.verifiedRole}\` |
`,
  )
  .join('\n')}

## Проверка ролей (ожидание)

| Роль | Доступ |
|------|--------|
| **user** | Планировщик, отчёты, настройки; **нет** AI, прототипов, дефектов, \`/admin/*\` |
| **beta_tester** | + AI, прототипы, «Завести дефект»; **нет** \`/admin/access\` |
| **admin** | + \`/admin/access\`, \`/admin/roadmap\`, управление ролями |

См. \`web/README.md\`.
`

  writeFileSync(outPath, body, 'utf8')
  console.log(`Wrote ${outPath}`)

  writeFileSync(
    join(repoRoot, '.cursor', 'test-account.local.md'),
    `# Устарело

Актуальные тестовые УЗ: **\`.cursor/test-accounts.local.md\`** (${date}).
`,
    'utf8',
  )
}

async function main() {
  const clean = process.argv.includes('--clean-only')
  const serviceKey = getServiceRoleKey()
  const admin = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (clean) {
    await deleteQaUsers(admin)
    return
  }

  await deleteQaUsers(admin)

  const created = []
  for (const spec of ROLES) {
    created.push(await createOne(admin, spec))
  }

  let legacyDeleted = false
  for (let page = 1; page <= 40; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    const legacy = (data?.users ?? []).find(
      (u) => (u.email ?? '').toLowerCase() === LEGACY_EMAIL.toLowerCase(),
    )
    if (legacy) {
      const { error } = await admin.auth.admin.deleteUser(legacy.id)
      if (error) throw error
      legacyDeleted = true
      console.log(`OK deleted legacy ${LEGACY_EMAIL}`)
    }
    if ((data?.users ?? []).length < 100) break
  }

  writeDocs(created, legacyDeleted)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
