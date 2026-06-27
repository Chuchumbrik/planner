---
id: layer-boundaries-and-ports
title: Границы слоёв и порты
class: guidance
scope: [cursor, claude]
applies-when: при добавлении или изменении логики в web, @motivator/core, services/planner-api — куда класть код и как не ломать архитектуру
globs: ["web/src/**/*.ts", "web/src/**/*.tsx", "packages/*/src/**/*.ts", "packages/*/src/**/*.tsx", "services/**/*.ts"]
enforcement: none
status: active
links: [plan-before-implement, amvera-migration-orchestrator, engineering-craft, vault-and-crypto-invariants, react-ui-conventions, test-contour-orchestrator, security-hygiene]
---

# Границы слоёв и порты

Правило: **каждый кусок логики живёт ровно в одном слое**. Слои общаются через **узкие контракты**
(типы, порты, HTTP), а не через «дотянуться до чужой БД/клиента из UI».

## Слои (сверху вниз)

| Слой | Где | Ответственность | Запрещено |
|------|-----|----------------|-----------|
| **UI** | `web/src/pages`, `components`, hooks UI | рендер, локальный UX-state, вызов сервисов | бизнес-правила vault, crypto, SQL, прямой `supabase.*` в новом коде |
| **Web adapters** | `web/src/lib`, `web/src/api`, providers | реализация портов (Supabase → позже `apiClient`), i18n, routing | дублировать домен из core «для удобства» |
| **Domain kernel** | `packages/motivator-core/src` | vault ops, normalize, crypto, календарь, отчёты **без React/DOM/Supabase** | import React, fetch, env browser |
| **API** *(миграция)* | `services/planner-api/src/modules/*` | auth, persistence, cron, push; JWT → `user_id` | SQL между модулями; логика UI; decrypt vault на сервере (paid E2E) |
| **DB** | схемы `auth`, `vault`, `notify`, … | таблицы, индексы, миграции | RLS/`auth.uid()` на Amvera; триггеры `pg_net` без замены на API |

Ориентир: [[08-Архитектура]] (Obsidian), DR-019 — модульный монолит с **ports/** между доменами API.

## Алгоритм «куда положить код»

1. **Чистая логика над данными vault/датами/повторами?** → `@motivator/core` (`domain/`, `lib/`, `vault/`).
2. **Нужен React, роут, модалка?** → `web/src`, но правила вызывай из core.
3. **Нужен сеть/БД/файлы/cron?** → модуль `planner-api` (+ миграция в своей схеме).
4. **Только отображение уже готовых данных?** → компонент + hook; hook тянет порт, не Supabase.

Если сомневаешься — **опусти на один слой** (core вместо web, порт вместо inline fetch).

## Порты (Ports & Adapters)

В core уже есть контракт:

```ts
// packages/motivator-core/src/domain/ports.ts
VaultRemotePort: { fetchVault, upsertVault }
```

- **Порт** — что нужно домену (интерфейс/тип).
- **Адаптер** — как это делает Supabase, HTTP API или mock в тесте.
- Новый внешний ресурс (notify, defects, admin) — **сначала тип порта**, потом реализация в `web/src/api/*` или API-модуле.

**Тесты:** mock порта, не mock всего Supabase SDK в unit-тестах core.

## API-модули (Amvera, DR-019)

```
services/planner-api/src/
  modules/{auth,vault,notify,defects,admin,ai}/
  shared/{middleware,db,ports}/
```

- Модуль **не импортирует** SQL/таблицы другого модуля — только свой `search_path` / своя схема.
- Общение между доменами — HTTP internal или вызов через **shared port interface**, не cross-schema JOIN.
- `/internal/cron/*` — только с `CRON_SECRET`; не публичный роут.

## Антипаттерны (останавливай PR)

| ❌ | ✅ |
|----|-----|
| `normalizeVault` только в компоненте | всегда после `JSON.parse` в клиенте; логика миграций — в core |
| `supabase.from('user_vault')` в новом feature-коде | `VaultRemotePort` / `apiClient` |
| 200 строк бизнес-логики в `*Page.tsx` | вынести в core или `web/src/lib` |
| `packages/motivator-core` импортирует `@/…` из web | только наоборот |
| Decrypt vault на API для «удобства админки» | только ciphertext; decrypt — клиент (paid) |

## Перед коммитом (self-check)

- [ ] Файл лежит в **правильном** слое (см. таблицу).
- [ ] Нет новых «пробросов» Supabase/fetch мимо порта в UI.
- [ ] Core не тянет React/DOM.
- [ ] При смене публичного API core — экспорт через `packages/motivator-core/src/index.ts` осознан.
- [ ] Тесты на логику — колокация; процесс — [[test-contour-orchestrator]].

## Связанные артеfactы

- `packages/motivator-core/docs/VAULT_CRYPTO_CONTRACT.md`
- `obsidian-motivator/08-Архитектура.md`, `22-План-миграции-Amvera.md`
- [[engineering-craft]], [[vault-and-crypto-invariants]], [[react-ui-conventions]]
