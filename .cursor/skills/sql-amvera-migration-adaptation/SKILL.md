---
id: sql-amvera-migration-adaptation
title: Адаптация SQL для Amvera Postgres
class: gate
scope: [cursor, claude]
applies-when: перенос или создание SQL-миграций для planner-db / services/planner-api/migrations
globs: ["services/**/migrations/**/*.sql", "web/supabase/migrations/**/*.sql"]
enforcement: git-hook+ci
enforcement-level: warn
enforced-by: "scripts/check-gates/no-supabase-patterns-in-amvera-sql.mjs"
owner: "@Chuchumbrik"
status: active
lifecycle: migration
sunset-when: "cutover (план §12)"
links: [amvera-migration-orchestrator, api-http-contracts, layer-boundaries-and-ports]
---

# Адаптация SQL для Amvera Postgres

Legacy: `web/supabase/migrations/*.sql` (14 файлов). Цель: `services/planner-api/migrations/` по **схемам модулей**.

## Схемы и роли

| Схема | Таблицы (из плана) | DB role |
|-------|-------------------|---------|
| `auth` | users, refresh_tokens, email_*, motivator_role, plan_tier | `auth_svc` |
| `vault` | user_vault (`user_id uuid`, без FK auth.users) | `vault_svc` |
| `notify` | push_subscriptions, notification_fire_requests | `notify_svc` |
| `defects` | defect_submissions, defect_attachment_drafts | `defects_svc` |
| `admin` | activity, discussions, … | `admin_svc` |

`search_path` роли — **только своя схема**. Cross-schema JOIN в приложении — **запрещён** (DR-019).

## Что убрать при адаптации Supabase SQL

| Supabase | Amvera |
|----------|--------|
| `references auth.users` | `user_id uuid` без FK или FK внутри `auth` |
| `enable row level security` + policies | **нет RLS** — authz в API |
| `auth.uid()` | — |
| `pg_net` / HTTP trigger | HTTP из API или cron job |
| Storage policies | файлы `/data` + API |
| `auth.users` as table | `auth.users` в **схеме auth** (своя модель) |

## Инструмент

- Runner: `node-pg-migrate` / drizzle / SQL + `npm run migrate -w planner-api` (зафиксировать в README при выборе).
- Нумерация: `001_auth_users.sql`, `002_vault_user_vault.sql`, …
- Откат одной миграции — документировать в README.

## Гейт

`scripts/check-gates/no-supabase-patterns-in-amvera-sql.mjs` — **warn** на staged SQL под `services/**/migrations/`; block — `GATE_BLOCK=1`.

Паттерны: `auth.uid()`, RLS, `pg_net`, `references auth.users`.

## PR checklist

- [ ] Файл в `services/.../migrations/`, не правка prod Supabase dump в web/
- [ ] Схема соответствует модулю
- [ ] Триггер 012 заменён планом «вызов API», не копипастой
- [ ] Obsidian `11-Модель-данных` при смене модели
