---
id: api-http-contracts
title: HTTP-контракты planner-api
class: guidance
scope: [cursor, claude]
applies-when: проектирование или реализация services/planner-api — модули, роуты, ошибки, middleware, cron
globs: ["services/planner-api/**", "deploy/**"]
enforcement: none
status: active
links: [api-http-contracts, api-implementation-and-logging, layer-boundaries-and-ports, supabase-edge-to-api-porting, security-hygiene, sql-amvera-migration-adaptation, tests-for-new-code]
---

# HTTP-контракты planner-api

Модульный монолит на Amvera (Node Server). Задел на split: модули общаются через **ports**, не cross-schema SQL.

## Структура репозитория

```
services/planner-api/
  package.json
  src/
    server.ts              # entry, mount routes
    shared/
      middleware/          # auth, cors, cronGuard, errorHandler, requestLog
      db/                  # pool per role / schema
      ports/               # inter-module interfaces
    modules/
      auth/
      vault/
      notify/
      defects/
      admin/
      ai/
  migrations/              # SQL by schema — см. sql-amvera-migration-adaptation
```

Workspace: корневой `package.json` → `npm install`, `npm run start -w planner-api` (уточнить в README при создании).

## URL layout

| Prefix | Auth | Назначение |
|--------|------|------------|
| `/health` | none | `{ ok: true }` |
| `/api/auth/*` | public / refresh | register, login, logout |
| `/api/vault` | Bearer JWT | GET/PUT ciphertext |
| `/api/notify/*` | Bearer | subscriptions, schedule, test |
| `/api/defects/*` | Bearer + role | drafts, submit |
| `/api/admin/*` | Bearer + admin | users, discussions, activity |
| `/api/ai/*` | Bearer + rate limit | chat SSE, transcribe |
| `/internal/cron/*` | `CRON_SECRET` | send-due, defect-cleanup |

## Формат ошибок (единый)

```json
{
  "code": "invalid_body",
  "message": "Human-readable short message"
}
```

- HTTP status: 400 validation, 401 auth, 403 forbidden, 404 not found, 413 payload, 429 rate limit, 5xx server.
- Сохранять **codes** совместимые с Edge где фронт уже парсит (`invalid_token`, `github_rate_limit`, …).
- **Не** отдавать stack trace клиенту в production.

## Middleware (порядок)

1. Request id + structured log — см. [[api-implementation-and-logging]]
2. CORS (stage/prod web origins)
3. JSON body parser + size limit
4. `authMiddleware` → `req.user = { id, role, planTier, … }`
5. Routes
6. `errorHandler`

## Модуль (шаблон)

```
modules/vault/
  vault.routes.ts    # HTTP
  vault.service.ts   # business rules (plan_tier check)
  vault.repo.ts      # SQL vault_svc only
  vault.types.ts
  vault.service.test.ts
  vault.routes.test.ts  # supertest optional colocated
```

## Тесты

- Service — unit с mock repo.
- Routes — supertest + mock service или test DB.
- Гейт [[tests-for-new-code]] на `services/planner-api/src/**/*.ts`.

## Deploy

- `deploy/planner-api.amvera.yaml` — Node Server, `containerPort`, start command.
- Env — см. [[amvera-secrets-and-env]].

## Связанные skills

[[supabase-edge-to-api-porting]], [[api-implementation-and-logging]], [[security-hygiene]], [[layer-boundaries-and-ports]]
