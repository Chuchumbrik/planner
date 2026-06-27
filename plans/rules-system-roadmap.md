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
- [ ] Оркестрирующий тест-воркфлоу «код → unit-test-writer → autotest-writer» (раздельные агенты).
- [ ] Playwright-инфраструктура: `@playwright/test`, `playwright.config.ts`, скрипт `test:e2e`, CI-job (трогает `package.json`).
- [ ] Cursor-определения субагентов `unit-test-writer` / `autotest-writer` — через `_cursor-adapter-sync` (запуск в Cursor).

### Доводка гейтов
- [ ] Промоушен `warn → block` для `tests-for-new-code` и `pre-commit-docs` после обкатки.
- [ ] Подключение `.githooks` команде: `prepare`-скрипт npm vs инструкция в README (решение).

### Cursor-сторона
- [x] Инструкция генерации Cursor-стороны из канона → `.cursor/skills/_cursor-adapter-sync/SKILL.md`
  (агент Cursor сам делает `.mdc` и Cursor-агентов; формат агентов — на стороне Cursor).
- [ ] **Запустить `_cursor-adapter-sync` в Cursor** после коммита — подготовит недостающие `.mdc`
  (`russian-requirements`) и Cursor-агентов субагентов (`unit-test-writer`, `autotest-writer`). *(Делает владелец в Cursor.)*

### Governance / решения (за владельцем)
- [ ] `owner` для гейтов (сейчас `TBD`).
- [ ] Семантика `tests-for-new-code`: только колокация или любой изменённый тест.
- [ ] `CLAUDE.md` обрезан коммитом `193c3ee` (~66 строк) — возвращать ли вырезанное.
- [ ] Расширение `.claude/plugin-hints.json`.

### Документация по ГОСТ
- [ ] Правки obsidian-доков — см. отдельный план `plans/gost-doc-revision.md`.

## Фиксация
- [ ] Коммит наших файлов (только система правил, не WIP-дерево).
