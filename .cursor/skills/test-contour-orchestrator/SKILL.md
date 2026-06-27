---
id: test-contour-orchestrator
title: Оркестратор тест-контура после изменений кода
class: guidance
scope: [cursor, claude]
applies-when: после реализации или правки логики в web/src или packages/*/src — закрыть tests-by-independent-agent и tests-for-new-code через двух субагентов, не автором кода
globs: ["web/src/**/*.ts", "web/src/**/*.tsx", "packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"]
enforcement: workflow
enforced-by: "процедура ниже; субагенты unit-test-writer + autotest-writer; гейты scripts/check-gates/tests-for-new-code.mjs"
status: active
links: [tests-by-independent-agent, tests-for-new-code, unit-test-writer, autotest-writer]
---

# Оркестратор тест-контура

Процедура для **агента-автора кода** и **человека** после изменения логики. Заменяет удалённые
workflow-скрипты: тот же смысл (независимые тесты + пирамида), но явные шаги и отдельные субагенты.

## Инварианты (не нарушать)

1. **Автор кода не пишет первичный набор тестов** на новую логику — [[tests-by-independent-agent]].
2. **Unit и e2e — разные субагенты**, запуск **в отдельных контекстах** (отдельный Task / новый чат / явный `/unit-test-writer`).
3. **Гейт [[tests-for-new-code]]** — backstop: в коммите должен меняться тест на каждый изменённый исходник; качество — на субагентах.

## Вход

- Список изменённых логических файлов (дифф или явный перечень).
- Критерии приёмки / спека / описание фичи (если есть).
- Явное указание: нужны ли **e2e** (см. критерии ниже).

## Фаза 0 — стоп автору кода

Агент, писавший фичу, **останавливается** после реализации. Не добавляет `*.test.*` / `*.spec.*` на новую логику
в том же контексте (мелкая правка существующего теста — допустима).

## Фаза 1 — unit-test-writer

**Запуск:** отдельно — Cursor: Task `unit-test-writer` или `/unit-test-writer`; Claude: субагент `.claude/agents/unit-test-writer.md`.

**Передать субагенту:**

- diff или список `web/src/**`, `packages/*/src/**` (без `*.test.*`);
- критерии приёмки;
- напоминание: канон `.cursor/skills/unit-test-writer/SKILL.md`.

**Критерий готовности:**

```bash
cd web && npx vitest run
# при правках packages/motivator-core:
npm test
```

Все новые/изменённые исходники имеют колокированные тесты.

## Фаза 2 — нужен ли autotest-writer?

Запускать **только если** выполняется **хотя бы одно**:

| Запускать e2e | Не запускать e2e |
|---------------|------------------|
| Новый/изменённый **сквозной** пользовательский путь (онбординг, login flow, оплата, необратимое действие) | Поведение полностью проверяемо vitest/RTL |
| Регрессия на уровне **маршрута + UI + навигации** | Только lib/утилиты, редьюсеры, чистая логика |
| Явный запрос человека «нужен e2e» | Инфраструктурный коммит без UX-пути |

Если e2e не нужен — зафиксировать в отчёте **почему** (делегировано unit-уровню).

## Фаза 3 — autotest-writer (условно)

**Предусловие:** Playwright в `web/` (`npm run test:e2e`, см. `web/README.md`).

**Запуск:** отдельно — Task `autotest-writer` или `/autotest-writer`.

**Критерий готовности:**

```bash
cd web && npm run test:e2e
```

Минимум сценариев под критичный риск; без дублирования unit-покрытия.

## Фаза 4 — отчёт перед PR

Кратко для ревьюера:

1. Изменённые исходники и кто писал тесты (unit-writer / autotest-writer — не автор кода).
2. Команды прогона и результат (vitest / e2e).
3. Осознанные пробелы и что отложено наверх/вниз пирамиды.
4. Self-review по [[pr-and-code-review]]; при необходимости — findings [[code-reviewer]].

## Краевые случаи

| Ситуация | Действие |
|----------|----------|
| Только docs / README / roadmap | Оркестратор не обязателен |
| Только правка существующих тестов человеком | Инвариант не про auto-генерацию |
| Playwright ещё не введён | Фаза 3 пропускается; autotest-writer сообщает об инфраструктуре |
| Субагент недоступен | Человек запускает второй чат с инструкцией из `.cursor/agents/*.md`; не смешивать с автором кода |

## Автоматический вызов субагентов?

Cursor **не** порождает изолированный subagent сам по себе — только **подталкивает** родительский агент
через hook или гейты. Явный `/unit-test-writer` / Task остаётся надёжнее hook.

| Механизм | Эффект |
|----------|--------|
| Hook `.cursor/hooks.json` → `stop` / `subagentStop` | после завершения хода: если в `git diff HEAD` есть логические исходники без колокированного теста — `followup_message` с просьбой запустить **unit-test-writer** (скрипт `.cursor/hooks/nudge-unit-test-writer.mjs`; `loop_limit: 2`; subagent `unit-test-writer` / `autotest-writer` не триггерит повтор) |
| Гейт `tests-for-new-code` (**block**) | без теста в коммите — **не пройдёт** hook/CI |
| Гейт `pre-commit-docs` (**block**) | продуктовый код без README/сводки — **не пройдёт** |
| Rule `.cursor/rules/test-contour-orchestrator.mdc` | напоминание при правке исходников |
| Привычка / чеклист перед PR | явный вызов subagent после Implement |

**Ограничения hook:** не гарантирует отдельный контекст; лимит follow-up (~2 на скрипт); при только docs/data — тишина.

---

## Связанные артеfactы

| Артеfact | Путь |
|----------|------|
| Unit-субагент (канон) | `.cursor/skills/unit-test-writer/SKILL.md` |
| E2e-субагент (канон) | `.cursor/skills/autotest-writer/SKILL.md` |
| Cursor-агенты | `.cursor/agents/unit-test-writer.md`, `autotest-writer.md` |
| E2e-тесты | `web/e2e/**` |
| CI e2e | `.github/workflows/pr-checks.yml` → job `e2e` (warn) |
