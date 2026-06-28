---
id: amvera-migration-orchestrator
title: Оркестратор миграции Amvera
class: guidance
scope: [cursor, claude]
applies-when: работа по переезду Vercel+Supabase → Amvera — кластеры плана, ветки, DoD, связанные skills
globs: ["services/**", "deploy/**", "amvera.yaml", "amvera.build.commands.example.txt", "scripts/build-amvera.mjs", "scripts/migrate-from-supabase/**", "web/src/api/**", "docs/amvera-secrets.md"]
enforcement: none
status: active
lifecycle: migration
sunset-when: "cutover (план §12)"
links: [plan-before-implement, supabase-edge-to-api-porting, sql-amvera-migration-adaptation, frontend-api-client-cutover, amvera-secrets-and-env, api-http-contracts, security-hygiene, layer-boundaries-and-ports]
---

# Оркестратор миграции Amvera

Процедура для агента и человека при работе по **DR-019** и
[`obsidian-motivator/22-План-миграции-Amvera.md`](../../obsidian-motivator/22-План-миграции-Amvera.md).

**Перед кодом** — [[plan-before-implement]] (декомпозиция, план, противоречия).

## Ветки (актуальная политика)

| Ветка | Назначение |
|-------|------------|
| **`dev`** | Основная интеграция переезда, stage Amvera, гибрид с legacy |
| **`main`** | Prod до cutover — legacy Vercel+Supabase; **после cutover** — prod Amvera |

- Миграционный код **обычно** мержится в **`dev`**; один PR — один **кластер/подшаг** плана.
- **`main`** не обязан быть «запретной зоной навсегда»: влитие миграции в `main` — только по **чеклисту cutover** (план §12), не «случайным» PR.
- Не смешивать unrelated prod-fix на legacy с большим кластером API без явного решения.

## Кластеры (карта)

| ID | Содержание | Skill / артефакт |
|----|------------|------------------|
| 0 | Amvera проекты, секреты, решения free/paid | [[amvera-secrets-and-env]], `docs/amvera-secrets.md` |
| 1 | БД, схемы, миграции SQL | [[sql-amvera-migration-adaptation]] |
| 2–8 | `planner-api` каркас + модули | [[api-http-contracts]], [[supabase-edge-to-api-porting]] |
| 9 | Фронт, apiClient | [[frontend-api-client-cutover]] |
| 10–12 | Data migration, cutover, legacy off | план §14–16; README + Obsidian |

**Блокер 0.3:** vault free/paid — не начинать кластер 4.x без ADR.

## Вход PR по миграции

- Какой **кластер и шаг** закрывается (номер из плана).
- Зависимости (нужна ли уже поднятая БД / auth).
- Критерии готовности + smoke (§9.3 плана при касании фронта).

## Фазы (как test-contour, но для миграции)

1. **План** — [[plan-before-implement]] + таблица «legacy → новое» для затронутых Edge/файлов.
2. **Реализация** — [[layer-boundaries-and-ports]], [[api-http-contracts]], [[security-hygiene]].
3. **Тесты** — [[test-contour-orchestrator]]; API — supertest/vitest в `services/planner-api`.
4. **Доки** — README (Amvera), `docs/amvera-secrets.md`, Obsidian `08`/`10`/`12` при смене поведения.
5. **Smoke** — stage URL `*.amvera.io` по чеклисту §9.3 (ручной или e2e с `E2E_BASE_URL`).

## Definition of Done (переезд целиком)

План §12 + §1: prod на Amvera, legacy off, smoke 48h, `main` = Amvera prod, Supabase/Vercel отключены для prod.

## Связанные артефакты

- `amvera.yaml`, `scripts/build-amvera.mjs`, `web/README.md` → Amvera Cloud
- [[supabase-edge-to-api-porting]], [[frontend-api-client-cutover]]
