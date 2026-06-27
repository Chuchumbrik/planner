---
id: tests-for-new-code
title: Новый код несёт тесты
class: gate
scope: [cursor, claude]
applies-when: коммит трогает логику в web/src, packages/*/src или services/*/src — на изменённый исходник должен меняться его тест
globs: ["web/src/**/*.ts", "web/src/**/*.tsx", "packages/*/src/**/*.ts", "packages/*/src/**/*.tsx", "services/*/src/**/*.ts", "services/*/src/**/*.tsx"]
enforcement: git-hook+ci
enforcement-level: block
enforced-by: "scripts/check-gates/tests-for-new-code.mjs"
owner: TBD
status: active
links: [tests-by-independent-agent, pre-commit-docs-roadmap, api-http-contracts]
---

# Новый код несёт тесты

## Правило (результат, не механизм)

Коммит, который меняет **логический исходник** под:

- `web/src/**`
- `packages/*/src/**`
- `services/*/src/**` *(planner-api и др.)*

(`.ts`/`.tsx`, кроме `*.test.*`, `*.spec.*`, `*.d.ts`), **обязан** в том же коммите менять **соответствующий тест-файл** (колокация).

## Что проверяется

`scripts/check-gates/tests-for-new-code.mjs` + общая логика `scripts/check-gates/_lib.mjs` (тот же критерий в hook `nudge-unit-test-writer`).

**Режим:** `block`. Локальный warn: `GATE_WARN=1`. Исключение: `web/src/data/**`.

## API (`services/planner-api`)

- Unit: `*.service.test.ts` рядом с service.
- HTTP: supertest на routes — `*.routes.test.ts` или колокация с handler.
- Запуск: `npm test` / `npx vitest run` в workspace API (когда появится package).

## Как удовлетворить

- [[unit-test-writer]] — отдельно от автора кода ([[tests-by-independent-agent]]).
- [[test-contour-orchestrator]] — порядок после фичи.

## Краевые случаи

- Чистый рефакторинг — обновить существующий тест.
- Конфиги, CSS, `web/src/data/**` — вне scope.
