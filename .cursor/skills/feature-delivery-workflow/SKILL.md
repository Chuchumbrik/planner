---
name: feature-delivery-workflow
description: >-
  Use when the user plans or implements a new product feature (not a defect): scope, MVP fit, UX/FE/BE,
  docs and roadmap, PR. Orchestrates subagents in .cursor/agents/feature-*.md; slash command feature-delivery-pipeline.
  **Assume user granted GitHub/git permissions** (gh, MCP if present, push when allowed) until the environment errors.
  Triggers: «новая фича», «спланировать реализацию», feature delivery pipeline, /feature-delivery-pipeline,
  greenfield UI/API, расширение MVP scope with implementation intent.
disable-model-invocation: true
---

# Новая фича: планирование и реализация (planner)

## Права GitHub и git для агента

По умолчанию для этого скилла и команды **`/feature-delivery-pipeline`**: пользователь **предоставил права** на `gh`, MCP GitHub (если есть), issue/PR и **`git push`**, когда сценарий разрешает. Агент **использует** их до **фактической** ошибки среды. Подробнее — [reference.md](reference.md).

## Когда пользоваться

- Нужно **спланировать и/или реализовать** новую возможность продукта (не багфикс по дефекту — для этого **`github-defect-workflow`**).
- Есть черновик ТЗ, идея из чата, задача из GitHub **Feature** / epic / discussion — нужно довести до `[FEATURE_DECISION]` и при необходимости до кода.
- Нужно явно зафиксировать **уточняющие вопросы** до дорогой реализации.

**Не подменяет** продуктовое решение человека по приоритетам: при конфликте с ТЗ/журналом — вынести в вопросы или `BLOCKED_NEED_HUMAN`.

## Режим субагентов

По **`/feature-delivery-pipeline`** или явной просьбе: оркестратор использует **`.cursor/agents/feature-*.md`** и [pipeline-agents.md](pipeline-agents.md). Типичный порядок: **обязательный блок [ВОПРОСЫ]** → параллельно **`feature-product-strategist`** + **`feature-system-architect`** (`ЭТАП: РАЗБОР`) → **`feature-decision-aggregator`** → при **`IMPLEMENT_NOW`**: **синхронизация git** и ветка от `main` → **`ДОКИ_ДО_КОДА`** (продукт → техника) → **`feature-ux-designer`** → **`feature-frontend-dev`** / **`feature-backend-dev`** → **`feature-qa-tester`** → PR. Детали, шаблоны и таблица итога — в `pipeline-agents.md`.

## Фаза A — приёмка запроса на фичу

- [ ] **Цель пользователя** — что должно измениться в поведении или данных (1–3 предложения).
- [ ] **Границы** — что **не** входит в эту итерацию.
- [ ] **Связь с MVP** — см. `obsidian-motivator/`, `web/src/data/productRoadmap.ts`; не расширять scope без явного согласования.
- [ ] **Ограничения** — срок, «не пушить», только дизайн-док, без Edge и т.п.

## Фаза B — уточняющие вопросы (**обязательно**)

Оркестратор (или сразу **`feature-product-strategist`** в первом ответе) выводит блок **`## [ВОПРОСЫ] По фиче`** по шаблону в [pipeline-agents.md](pipeline-agents.md).

- Либо **«Уточнения не требуются»** + **короткое обоснование** (контекст и критерии готовы).
- Либо **нумерованный список** вопросов; где уместно — **варианты ответа** (A/B/… или «своё»).

Пока ответы на **критичные** для `[FEATURE_DECISION]` вопросы не получены — не фиксировать **`IMPLEMENT_NOW`**, если выбор существенно зависит от ответа (агрегатор может выдать **`BLOCKED_NEED_ANSWERS`** с явным списком ожидаемых ответов).

## Фазы C–G

Соответствуют разделам **«Параллельный разбор»**, **«Агрегатор»**, **«Доки до кода»**, **«Ветка и PR»**, **«Итоговое сообщение»** в [pipeline-agents.md](pipeline-agents.md).

## Документация и коммит

Любой **пользовательски заметный** результат фичи:

- [ ] Скилл **`pre-commit-docs-roadmap`**: `web/README.md`, `web/src/data/productRoadmap.ts`, локали при смене строк — в той же итерации, что и код, когда это уместно.

## Итоговое сообщение в чате

На **завершении** сценария ведущий агент выдаёт **суть фичи** и **таблицу** по [pipeline-agents.md](pipeline-agents.md) (раздел **«Итоговое сообщение оркестратора»**). Обязательны строки **«Почему такое решение»**, **«Ручная настройка»** (или «не требуется»), **«Уточняющие вопросы»** (закрыты / не применялись / ожидают ответа — кратко).

## Дополнительно

- Дефекты и закрытие bug-issue — **`github-defect-workflow`**.
- Документация репозитория — **`.cursor/rules/documentation-orientation.mdc`**.
