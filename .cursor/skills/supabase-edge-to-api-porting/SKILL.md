---
id: supabase-edge-to-api-porting
title: Портирование Supabase Edge → planner-api
class: guidance
scope: [cursor, claude]
applies-when: перенос логики из web/supabase/functions в services/planner-api — модуль, контракт, cron
globs: ["web/supabase/functions/**", "services/planner-api/**", "api/**"]
enforcement: none
status: active
lifecycle: migration
sunset-when: "cutover (план §12)"
links: [api-http-contracts, sql-amvera-migration-adaptation, amvera-migration-orchestrator, security-hygiene, layer-boundaries-and-ports]
---

# Портирование Supabase Edge → planner-api

## Карта legacy → API (P0–P3)

| Edge / legacy | Модуль API | HTTP | Cron |
|---------------|------------|------|------|
| GoTrue (client) | `auth` | `/api/auth/*` | — |
| `user_vault` direct | `vault` | `/api/vault` | — |
| `send-due` | `notify` | `/internal/cron/send-due` | минутный |
| `notifications-test` | `notify` | `/api/notify/test` | — |
| `admin-record-activity` | `admin` | `/api/admin/activity` | — |
| `admin-motivator-roles` | `admin` | `/api/admin/users/*` | — |
| `admin-discussions*` | `admin` | `/api/admin/discussions/*` | — |
| `file-defect` | `defects` | `/api/defects/submit` | — |
| `defect-attachments-cleanup` | `defects` | `/internal/cron/defect-cleanup` | daily |
| `ai-task-assistant` | `ai` | `/api/ai/chat`, `/api/ai/transcribe` | — |
| Vercel `api/send-due-cron.js` | — | → internal notify | Amvera jobs |

Исходники Edge: `web/supabase/functions/`. Общий код — `_shared/` → вынести в `services/planner-api/src/shared/` или модуль.

## Алгоритм порта (одна функция)

1. **Прочитать** Edge: auth, body, секреты, side effects (DB, storage, GitHub, web-push).
2. **Выписать** контракт: method, path, headers, JSON schema, коды ошибок (сохранить совместимость с фронтом где возможно).
3. **Разместить** в `services/planner-api/src/modules/<name>/` — handler + service + repo ([[api-implementation-and-logging]]).
4. **Заменить** Supabase client на pg/репозиторий **своей схемы** (см. [[sql-amvera-migration-adaptation]]).
5. **JWT middleware** — `user_id` из токена, не `auth.uid()`.
6. **Тесты** — unit на service; HTTP — supertest на handler (`*.test.ts` колокация).
7. **Фронт** — переключить invoke на `apiClient` ([[frontend-api-client-cutover]]); feature flag до cutover.
8. **Доки** — README + строка в плане миграции.

## Что переносить / что менять

| Edge | API |
|------|-----|
| `Deno.serve` | Express/Fastify route (как выбрано в каркасе) |
| `createClient` service role | pool + role `*_svc` |
| Storage upload | `/data/...` mount или S3 adapter |
| `pg_net` trigger side effect | явный вызов notify из admin module |
| CORS на Edge | middleware CORS для stage web origin |

## Безопасность

- Не логировать ciphertext, tokens, push keys ([[security-hygiene]]).
- Admin routes — проверка `motivator_role` на сервере.
- Cron — только `CRON_SECRET`, не anon key.

## PR checklist

- [ ] Модуль в правильной схеме БД
- [ ] Edge больше не единственный путь (или за flag)
- [ ] Тесты + гейт [[tests-for-new-code]]
- [ ] Секреты в `docs/amvera-secrets.md` если новые
