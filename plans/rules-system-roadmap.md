# План: система правил проекта — остаток работ

> Рабочий бэклог по системе правил (спецификация — `RULES.md`, реестр — `RULES.md §9`).
> Обновляется по мере выполнения. Дата среза: 2026-06-27.

## Готово
- ✅ Спецификация `RULES.md` (3 класса, контракт frontmatter, governance, проекция).
- ✅ Правила `tests-for-new-code` (gate), `tests-by-independent-agent` (process-invariant).
- ✅ Субагенты `unit-test-writer`, `autotest-writer` (канон + Claude-агенты `.claude/agents/*`).
- ✅ Реформат старых: `pre-commit-docs-roadmap`, `documentation-orientation`, `russian-requirements`; удалён `github-defect-workflow`.
- ✅ Проекция под Claude (`scripts/project-rules-to-claude.mjs` + `post-merge` + `SessionStart`).
- ✅ Подсказки по плагинам — Claude-only (`UserPromptSubmit` + `claude-plugin-hints.mjs`).
- ✅ **Слой гейтов рабочий**: `tests-for-new-code` + `pre-commit-docs` в `.githooks/pre-commit` и в CI (`pr-checks.yml`, шаг warn).
- ✅ Дубль в `CLAUDE.md` («Процесс разработки с QA») заменён ссылкой на правила.

## Остаток (по приоритету)

### Документация системы
- [x] **Обзорный документ системы правил** → `docs/rules-system-overview.md` (карта: реестр, классы,
  триггеры pre-commit/CI/post-merge/SessionStart/UserPromptSubmit, субагенты, как расширять).

### Тест-контур (основной новый)
- [x] Оркестрирующий тест-воркфлоу «код → unit-test-writer → autotest-writer» → `.cursor/skills/test-contour-orchestrator/SKILL.md` + `.cursor/rules/test-contour-orchestrator.mdc`.
- [x] Playwright-инфраструктура: `@playwright/test`, `playwright.config.ts`, `test:e2e`, CI-job `e2e` (warn).
- [x] Cursor-определения субагентов `unit-test-writer` / `autotest-writer` → `.cursor/agents/*.md` (sync 2026-06-27).

### Доводка гейтов
- [x] Промоушен `warn → block` для `tests-for-new-code` и `pre-commit-docs` (2026-06-27).
- [ ] Подключение `.githooks` команде: `prepare`-скрипт npm vs инструкция в README (решение).

### Cursor-сторона
- [x] Инструкция генерации Cursor-стороны из канона → `.cursor/skills/_cursor-adapter-sync/SKILL.md`
  (агент Cursor сам делает `.mdc` и Cursor-агентов; формат агентов — на стороне Cursor).
- [x] **`_cursor-adapter-sync` (gaps)** — `.mdc` для `russian-requirements-writing-skill`, агенты в `.cursor/agents/` (2026-06-26).

### Инженерное мастерство (волна 1) — done
- [x] `engineering-craft`, `plan-before-implement`, `layer-boundaries-and-ports`, `vault-and-crypto-invariants`, `react-ui-conventions`.

### Миграция Amvera (волна 2) — done
- [x] `amvera-migration-orchestrator`, `amvera-secrets-and-env`, `supabase-edge-to-api-porting`, `sql-amvera-migration-adaptation`, `frontend-api-client-cutover`, `security-hygiene`, `api-http-contracts`, `docs/amvera-secrets.md`, гейты secrets/SQL, `services/*/src` в tests-for-new-code.

### PR и ADR (волна 3) — done
- [x] `pr-and-code-review`, `adr-and-architecture-decisions`, subagent `code-reviewer` (`.cursor/agents/` + `.claude/agents/`).
- [x] `api-implementation-and-logging` — реализация API + structured logging (доп. к `api-http-contracts`).

### Governance / решения (за владельцем)
- [ ] `owner` для гейтов (сейчас `TBD`).
- [ ] Семантика `tests-for-new-code`: только колокация или любой изменённый тест.
- [ ] `CLAUDE.md` обрезан коммитом `193c3ee` (~66 строк) — возвращать ли вырезанное.
- [x] Расширение `.claude/plugin-hints.json` (review, amvera, implement).

### Документация по ГОСТ
- [ ] Правки obsidian-доков — см. отдельный план `plans/gost-doc-revision.md`.

## Фиксация
- [ ] Коммит наших файлов (только система правил, не WIP-дерево). *(Частично: тест-контур 2026-06-27.)*
