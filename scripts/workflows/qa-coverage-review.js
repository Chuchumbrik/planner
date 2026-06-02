/**
 * Workflow: qa-coverage-review
 * Запуск: Workflow({ name: 'qa-coverage-review', args: { projectPath, base } })
 *         или через Claude Code: /workflows → qa-coverage-review
 *
 * args:
 *   projectPath — путь к проекту (default: /root/Projects/planner)
 *   base        — base ветка для diff (default: main)
 */
export const meta = {
  name: 'qa-coverage-review',
  description: 'QA-анализ изменений: test-selector → functional-reviewer → scenario-designer → verdict',
  whenToUse: 'После любых изменений в .ts/.tsx файлах перед написанием тестов',
  phases: [
    { title: 'Scan',      detail: 'Diff + карта существующих тестов' },
    { title: 'Review',    detail: 'test-selector + functional-reviewer параллельно' },
    { title: 'Scenarios', detail: 'Генерация тест-сценариев по пробелам' },
    { title: 'Report',    detail: 'Verdict + рекомендация' },
  ],
}

const projectPath = (args && args.projectPath) ? args.projectPath : '/root/Projects/planner'
const baseBranch  = (args && args.base)        ? args.base        : 'main'

// ── Scan ──────────────────────────────────────────────────────────────────────
phase('Scan')

const DIFF_SCHEMA = {
  type: 'object',
  required: ['diff', 'changedFiles', 'hasChanges'],
  properties: {
    diff:         { type: 'string' },
    changedFiles: { type: 'array', items: { type: 'string' } },
    hasChanges:   { type: 'boolean' },
  },
}

const diffResult = await agent(
  `Собери diff в проекте ${projectPath}.
1. cd ${projectPath} && git diff ${baseBranch}...HEAD -- '*.ts' '*.tsx' | head -500
   Если пусто: git diff HEAD~1 -- '*.ts' '*.tsx' | head -500
2. git diff ${baseBranch}...HEAD --name-only --diff-filter=ACMR | grep -E '\\.(ts|tsx)$' | grep -v node_modules
   Если пусто: git diff HEAD~1 --name-only --diff-filter=ACMR | grep -E '\\.(ts|tsx)$' | grep -v node_modules
Верни: diff (полный текст), changedFiles (список путей), hasChanges (bool).`,
  { label: 'scan:diff', phase: 'Scan', schema: DIFF_SCHEMA }
)

if (!diffResult || !diffResult.hasChanges) {
  log('Нет изменений в .ts/.tsx файлах')
  return { status: 'no-changes' }
}

log(`Изменено файлов: ${diffResult.changedFiles.length}`)

// ── Review ────────────────────────────────────────────────────────────────────
phase('Review')

const [testMap, funcReview] = await parallel([
  () => agent(
    `Проект: ${projectPath}
Изменённые файлы:\n${diffResult.changedFiles.join('\n')}
Используй Grep/Glob/Read чтобы:
1. Найти все *.test.ts / *.test.tsx (исключая node_modules)
2. Определить какие из изменённых файлов покрыты тестами
3. Выявить изменённые файлы БЕЗ тестов
4. Найти тесты, которые могут сломаться
Два раздела: "Покрыто" и "Не покрыто".`,
    { label: 'review:test-selector', phase: 'Review', agentType: 'smart-test-selector' }
  ),
  () => agent(
    `Проект: ${projectPath}
Diff:\n${diffResult.diff}
Найди:
1. Функциональные пробелы — новая логика без тестов
2. Риски регрессии — что старое могло сломаться
3. Edge cases без обработки
Пиши без тех. жаргона, понятно для бизнеса.`,
    { label: 'review:functional', phase: 'Review', agentType: 'functional-reviewer' }
  ),
])

// ── Scenarios ─────────────────────────────────────────────────────────────────
phase('Scenarios')

const scenarios = await agent(
  `Проект: ${projectPath}
Покрытие тестами: ${testMap}
Пробелы и риски: ${funcReview}
Сгенерируй тест-сценарии (только high/medium приоритет).
Для каждого: название (без жаргона), тип (unit/UI/integration), приоритет, что проверяем (1 предл.).
Сгруппируй по файлам.`,
  { label: 'scenarios:design', phase: 'Scenarios', agentType: 'test-scenario-designer' }
)

// ── Report ────────────────────────────────────────────────────────────────────
phase('Report')

const REPORT_SCHEMA = {
  type: 'object',
  required: ['verdict', 'summary', 'recommendation', 'scenarioCount'],
  properties: {
    verdict:        { type: 'string', enum: ['ready', 'needs-tests', 'blocked'] },
    summary:        { type: 'string' },
    recommendation: { type: 'string' },
    scenarioCount:  { type: 'number' },
  },
}

const report = await agent(
  `Итоговый QA-отчёт по изменениям в planner.
Файлов изменено: ${diffResult.changedFiles.length}: ${diffResult.changedFiles.join(', ')}
Покрытие: ${testMap}
Пробелы: ${funcReview}
Сценарии: ${scenarios}

verdict: "ready"(всё покрыто) / "needs-tests"(пробелы есть, мёрдж допустим) / "blocked"(high-risk без тестов)
summary: 2-3 предложения без жаргона
recommendation: одно конкретное действие прямо сейчас
scenarioCount: число предложенных сценариев`,
  { label: 'report', phase: 'Report', schema: REPORT_SCHEMA }
)

return {
  verdict:         report.verdict,
  summary:         report.summary,
  recommendation:  report.recommendation,
  scenarioCount:   report.scenarioCount,
  testCoverageMap: testMap,
  functionalGaps:  funcReview,
  scenarios,
}
