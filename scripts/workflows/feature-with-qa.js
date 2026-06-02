/**
 * Workflow: feature-with-qa
 * Полный цикл разработки фичи с встроенным QA.
 *
 * Запуск: Workflow({ scriptPath: '/root/Projects/planner/scripts/workflows/feature-with-qa.js', args })
 *
 * args:
 *   projectPath — путь к проекту (default: /root/Projects/planner)
 *   feature     — описание фичи (обязательно)
 *   base        — base ветка для diff (default: main)
 *   skipImpl    — true если код уже написан, пропустить фазу Implement
 */
export const meta = {
  name: 'feature-with-qa',
  description: 'Полный цикл фичи: Explore → Architect → Implement → QA Scan → Scenarios → Tests → Report',
  whenToUse: 'При старте любой новой фичи. Проводит через весь цикл разработки с QA.',
  phases: [
    { title: 'Explore',    detail: 'Изучаем кодовую базу под фичу' },
    { title: 'Architect',  detail: 'Проектируем реализацию' },
    { title: 'Implement',  detail: 'Пишем код' },
    { title: 'QA Scan',    detail: 'test-selector + functional-reviewer параллельно' },
    { title: 'Scenarios',  detail: 'Генерация тест-сценариев' },
    { title: 'Tests',      detail: 'Пишем тесты по high-priority сценариям' },
    { title: 'Report',     detail: 'Verdict: ready-for-pr / needs-work / blocked' },
  ],
}

const projectPath = (args && args.projectPath) ? args.projectPath : '/root/Projects/planner'
const featureDesc = (args && args.feature)     ? args.feature     : 'описание фичи не передано'
const baseBranch  = (args && args.base)        ? args.base        : 'main'
const skipImpl    = (args && args.skipImpl)    ? args.skipImpl    : false

// ── Watchdog: предохранители на agent() ─────────────────────────────────────────
// Зачем: schema-фазы (Tests/Report) могут зациклиться на авто-ретраях, а среда —
// встать на паузу; без границы прогон висит часами (см. инцидент 7.12). guard()
// ограничивает каждый вызов по времени и при превышении/ошибке отдаёт null
// («деградированная фаза»), а не зависает. Если в песочнице нет таймеров —
// откатываемся на обычный agent() (guard никогда не делает хуже).
const TIMEOUT_MIN = { default: 8, Implement: 20, Tests: 20 }
const HAS_TIMER = typeof setTimeout === 'function'

async function guard(prompt, opts) {
  const ms = (TIMEOUT_MIN[opts.phase] ?? TIMEOUT_MIN.default) * 60 * 1000
  const safe = (p) => p.catch((e) => {
    log(`⚠️ ${opts.label || opts.phase}: ${e && e.message ? e.message : e} — фаза деградирована (null)`)
    return null
  })
  if (!HAS_TIMER) return safe(agent(prompt, opts))
  let timer
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error(`timeout ${ms / 60000}м — фаза не уложилась`)), ms)
  })
  const run = Promise.race([agent(prompt, opts), timeout])
  try {
    return await run
  } catch (e) {
    log(`⚠️ ${opts.label || opts.phase}: ${e && e.message ? e.message : e} — фаза деградирована (null)`)
    return null
  } finally {
    if (timer && typeof clearTimeout === 'function') clearTimeout(timer)
  }
}

const orNote = (v, what) => v || `(нет данных: фаза «${what}» прервана watchdog'ом)`

// ── Explore ───────────────────────────────────────────────────────────────────
phase('Explore')

const exploration = await guard(
  `Проект: ${projectPath}
Задача: ${featureDesc}

Изучи кодовую базу и ответь:
1. Какие существующие файлы/компоненты затронет эта фича?
2. Какие паттерны уже используются (стиль компонентов, хуки, типы)?
3. Какие зависимости (store, context, API) нужно учесть?
4. Какие существующие тесты рядом с этой областью уже есть?

Верни структурированный анализ.`,
  { label: 'explore:codebase', phase: 'Explore', agentType: 'feature-dev:code-explorer' }
)

// ── Architect ─────────────────────────────────────────────────────────────────
phase('Architect')

const architecture = await guard(
  `Проект: ${projectPath}
Задача: ${featureDesc}

Анализ кодовой базы:
${orNote(exploration, 'Explore')}

Спроектируй реализацию:
1. Какие файлы создать / изменить (конкретные пути)
2. Структура компонентов и их интерфейсы
3. Поток данных
4. Порядок реализации
5. Что НЕ входит в scope`,
  { label: 'architect:plan', phase: 'Architect', agentType: 'feature-dev:code-architect' }
)

log('Архитектура готова')

// ── Implement ─────────────────────────────────────────────────────────────────
phase('Implement')

let implResult
if (skipImpl) {
  implResult = 'Реализация пропущена (skipImpl=true) — анализируем существующий diff'
  log('Пропускаем реализацию')
} else {
  implResult = await guard(
    `Проект: ${projectPath}
Задача: ${featureDesc}

Архитектурный план:
${orNote(architecture, 'Architect')}

Реализуй фичу строго по плану.
Следуй существующим паттернам. Не выходи за scope.
После: запусти typecheck чтобы убедиться в отсутствии ошибок типов.
Верни: список изменённых файлов + краткое описание.`,
    { label: 'implement:code', phase: 'Implement' }
  )
}

// ── QA Scan ───────────────────────────────────────────────────────────────────
phase('QA Scan')

const [testMap, funcReview] = await parallel([
  () => guard(
    `Проект: ${projectPath}
Изменения: ${orNote(implResult, 'Implement')}
Используй Grep/Glob/Read:
1. Найди все *.test.ts / *.test.tsx (исключая node_modules)
2. Какие изменённые файлы покрыты тестами?
3. Какие без тестов?
4. Какие тесты могут сломаться?
Два раздела: "Покрыто" и "Не покрыто".`,
    { label: 'qa:test-selector', phase: 'QA Scan', agentType: 'smart-test-selector' }
  ),
  () => guard(
    `Проект: ${projectPath}
Фича: ${featureDesc}
Что реализовано: ${orNote(implResult, 'Implement')}
Найди:
1. Функциональные пробелы — новая логика без тестов
2. Риски регрессии
3. Edge cases без обработки
Пиши без жаргона.`,
    { label: 'qa:functional', phase: 'QA Scan', agentType: 'functional-reviewer' }
  ),
])

// ── Scenarios ─────────────────────────────────────────────────────────────────
phase('Scenarios')

const scenarios = await guard(
  `Проект: ${projectPath}
Фича: ${featureDesc}
Покрытие: ${orNote(testMap, 'QA Scan')}
Пробелы: ${orNote(funcReview, 'QA Scan')}
Сгенерируй тест-сценарии (только high/medium).
Название, тип (unit/UI/integration), приоритет, что проверяем.
Сгруппируй по файлам.`,
  { label: 'scenarios:design', phase: 'Scenarios', agentType: 'test-scenario-designer' }
)

// ── Tests ─────────────────────────────────────────────────────────────────────
phase('Tests')

const TESTS_SCHEMA = {
  type: 'object',
  required: ['writtenTests', 'skippedScenarios', 'allPass'],
  properties: {
    writtenTests:     { type: 'array', items: { type: 'string' } },
    skippedScenarios: { type: 'array', items: { type: 'string' } },
    allPass:          { type: 'boolean' },
  },
}

const testsResult = await guard(
  `Проект: ${projectPath}
Тест-сценарии: ${orNote(scenarios, 'Scenarios')}

Напиши тесты для HIGH-приоритетных сценариев.
Следуй паттернам существующих тестов (vitest, testing-library).
После написания: cd ${projectPath} && npm test 2>&1 | tail -20
Верни: writtenTests (список файлов), skippedScenarios, allPass (bool).`,
  { label: 'tests:write', phase: 'Tests', schema: TESTS_SCHEMA }
)

// ── Report ────────────────────────────────────────────────────────────────────
phase('Report')

const REPORT_SCHEMA = {
  type: 'object',
  required: ['verdict', 'summary', 'prReadiness', 'nextSteps'],
  properties: {
    verdict:      { type: 'string', enum: ['ready-for-pr', 'needs-work', 'blocked'] },
    summary:      { type: 'string' },
    prReadiness:  { type: 'string' },
    nextSteps:    { type: 'array', items: { type: 'string' } },
  },
}

const report = await guard(
  `Подведи итог разработки фичи.
Фича: ${featureDesc}
Тесты написаны: ${testsResult ? testsResult.writtenTests.join(', ') : 'нет'}
Все тесты проходят: ${testsResult ? testsResult.allPass : 'неизвестно'}
Пропущенные сценарии: ${testsResult ? testsResult.skippedScenarios.join('; ') : 'нет'}
Функциональные пробелы: ${orNote(funcReview, 'QA Scan')}

verdict: ready-for-pr / needs-work / blocked
summary: 2-3 предложения для PR description
prReadiness: одна строка — готов или что мешает
nextSteps: список действий если нужны`,
  { label: 'report:final', phase: 'Report', schema: REPORT_SCHEMA }
)

if (!report) {
  // Report-фаза прервана watchdog'ом — отдаём явный blocked, а не падаем.
  log('⚠️ Report не сформирован (watchdog) — verdict=blocked, нужен ручной разбор диффа')
  return {
    verdict: 'blocked',
    summary: 'Workflow прерван watchdog\'ом до формирования отчёта — проверь дифф и тесты вручную.',
    prReadiness: 'Не готов: отчёт не сформирован (таймаут/ошибка фазы).',
    nextSteps: ['Сверить git diff и npm test вручную', 'Перезапустить прогон или довести вручную'],
    testsWritten: testsResult ? testsResult.writtenTests : [],
    allTestsPass: testsResult ? testsResult.allPass : false,
  }
}

return {
  verdict:      report.verdict,
  summary:      report.summary,
  prReadiness:  report.prReadiness,
  nextSteps:    report.nextSteps,
  testsWritten: testsResult ? testsResult.writtenTests : [],
  allTestsPass: testsResult ? testsResult.allPass : false,
}
