/** Finish: reset passwords, verify sign-in + roles, write .cursor/test-accounts.local.md */
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SUPABASE_URL = 'https://ntpkveicqetjjvlnfrwc.supabase.co'
const PROJECT_REF = 'ntpkveicqetjjvlnfrwc'
const LEGACY_EMAIL = 'mussha2010@yandex.ru'

const accounts = [
  {
    email: 'planner-qa-user-9e7f17dc@qa.motivator.invalid',
    role: 'user',
    labelRu: 'Обычный пользователь',
    id: 'cf9a1f9a-bab9-44d9-bc1f-92942625ea3f',
  },
  {
    email: 'planner-qa-beta-35ca4c22@qa.motivator.invalid',
    role: 'beta_tester',
    labelRu: 'Бета-тестер',
    id: '1b45397e-c033-42b2-b291-1ed0809985b8',
  },
  {
    email: 'planner-qa-admin-5749d652@qa.motivator.invalid',
    role: 'admin',
    labelRu: 'Администратор',
    id: '1ed90199-6119-41da-9baa-fe177fd1a3bd',
  },
]

function parseKeyLine(out, name) {
  const line = out.split('\n').find((l) => l.includes(name))
  if (!line) return null
  const parts = line.split('|').map((s) => s.trim())
  const key = parts[parts.length - 1]
  return key?.startsWith('eyJ') ? key : null
}

function getKeys() {
  const out = execSync(`npx supabase projects api-keys --project-ref ${PROJECT_REF}`, {
    encoding: 'utf8',
    cwd: join(dirname(fileURLToPath(import.meta.url)), '..', 'web'),
  })
  const service = parseKeyLine(out, 'service_role')
  const anon = parseKeyLine(out, 'anon')
  if (!service || !anon) throw new Error('Could not parse API keys from supabase CLI')
  return { service, anon }
}

async function withRetry(label, fn, attempts = 5) {
  let last
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      console.warn(`${label} attempt ${i + 1}/${attempts}:`, e.message ?? e)
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
    }
  }
  throw last
}

function wireRole(meta) {
  const r = meta?.motivator_role
  if (r === 'admin') return 'admin'
  if (r === 'beta_tester') return 'beta_tester'
  return 'user'
}

async function main() {
  const { service, anon } = getKeys()
  const admin = createClient(SUPABASE_URL, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const legacy = []
  for (let page = 1; page <= 40; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    for (const u of data?.users ?? []) {
      if ((u.email ?? '').toLowerCase() === LEGACY_EMAIL.toLowerCase()) legacy.push(u.id)
    }
    if ((data?.users ?? []).length < 100) break
  }
  for (const id of legacy) {
    await admin.auth.admin.deleteUser(id)
    console.log('deleted legacy', LEGACY_EMAIL)
  }

  const enriched = []
  for (const a of accounts) {
    const password = `SynthQa-${randomBytes(5).toString('base64url')}!9`
    const seed = randomBytes(32).toString('base64')
    await withRetry(`password ${a.email}`, async () => {
      const { error } = await admin.auth.admin.updateUserById(a.id, { password })
      if (error) throw new Error(error.message)
    })

    const wire = await withRetry(`role ${a.email}`, async () => {
      const { data: u } = await admin.auth.admin.getUserById(a.id)
      const w = wireRole(u.user?.app_metadata)
      if (w !== a.role) throw new Error(`${w} !== ${a.role}`)
      return w
    })

    await withRetry(`signin ${a.email}`, async () => {
      const client = createClient(SUPABASE_URL, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { error: signErr } = await client.auth.signInWithPassword({
        email: a.email,
        password,
      })
      if (signErr) throw new Error(signErr.message)
      await client.auth.signOut()
    })

    enriched.push({ ...a, password, seed, verifiedRole: wire })
    console.log('OK', a.role, a.email)
  }

  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
  const date = new Date().toISOString().slice(0, 10)
  const body = `# Тестовые учётные записи QA (роли)

**Не коммитить.** Файл в \`.gitignore\`.

**Создано:** ${date} — синтетические УЗ (\`scripts/qa-provision-role-accounts.mjs\` + финализация).

**Удалена прежняя УЗ:** \`${LEGACY_EMAIL}\` (Supabase Auth).

**Проект:** \`${PROJECT_REF}\` · ${SUPABASE_URL}

**Vault:** seed из таблицы на \`/onboarding\`; пароль KDF — сначала **пустой**.

---

${enriched
  .map(
    (a) => `## ${a.labelRu} (\`motivator_role: ${a.role}\`)

| Поле | Значение |
|------|----------|
| Email | \`${a.email}\` |
| Пароль входа (Supabase Auth) | \`${a.password}\` |
| User ID | \`${a.id}\` |
| Seed vault (base64, синт.) | \`${a.seed}\` |
| Роль (sign-in + metadata) | \`${a.verifiedRole}\` |
`,
  )
  .join('\n')}

## Ожидаемый доступ

| Роль | UI |
|------|-----|
| user | Планировщик, отчёты, настройки |
| beta_tester | + AI, прототипы, «Завести дефект» |
| admin | + \`/admin/access\`, \`/admin/roadmap\` |
`

  writeFileSync(join(repoRoot, '.cursor', 'test-accounts.local.md'), body, 'utf8')
  writeFileSync(
    join(repoRoot, '.cursor', 'test-account.local.md'),
    `# Устарело\n\nАктуально: **\`.cursor/test-accounts.local.md\`** (${date}).\n`,
    'utf8',
  )
  console.log('Wrote .cursor/test-accounts.local.md')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
