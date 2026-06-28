---
id: api-implementation-and-logging
title: Реализация API и логирование
class: guidance
scope: [cursor, claude]
applies-when: написание handlers, services, middleware и логов в services/planner-api — как писать код, что логировать, чего избегать
globs: ["services/planner-api/**", "api/**"]
enforcement: none
status: active
lifecycle: permanent
links: [api-http-contracts, security-hygiene, supabase-edge-to-api-porting, layer-boundaries-and-ports, tests-for-new-code, vault-and-crypto-invariants]
---

# Реализация API и логирование

**Контракты URL и модулей** — [[api-http-contracts]]. Этот skill — **как писать код** внутри `planner-api`: слои handler → service → repo, валидация, ошибки, **структурные логи**.

---

## Принципы API-кода

1. **Routes тонкие** — parse HTTP, вызов service, map result → status + JSON. Без SQL и бизнес-веток в route.
2. **Service — бизнес-правила** — plan_tier, роли, orchestration между repo и ports. Без `req`/`res`.
3. **Repo — только persistence** — SQL/pg под ролью `*_svc`; один модуль — одна схема.
4. **Типы на границах** — DTO in/out в `*.types.ts`; не протаскивать `any` из DB row.
5. **Fail fast** — validate → 400 с `code`; не молчаливые `undefined`.
6. **Идempotency** — cron и webhooks безопасны при повторе (dedupe по id/fire_request).

---

## Шаблон handler (псевдокод)

```ts
// routes: только HTTP
export async function putVault(req: AuthedRequest, res: Response) {
  const parsed = vaultPutSchema.safeParse(req.body);
  if (!parsed.success) {
    throw apiError(400, 'invalid_body', '…');
  }
  await vaultService.upsert(req.user.id, parsed.data);
  res.status(200).json({ version: … });
}
```

```ts
// service: правила + вызов repo
export async function upsert(userId: string, body: VaultPutDto) {
  if (!(await canUseVault(userId))) throw apiError(403, 'forbidden', '…');
  return vaultRepo.upsert(userId, body.ciphertext, body.version);
}
```

**Async errors** — централизованный `errorHandler` middleware; в route — `throw apiError(...)` или `next(err)`.

---

## Валидация

- **Zod** (или выбранная схема в проекте) на входе route — body, query, params.
- UUID path params — явная проверка формата.
- Размер body — limit middleware **до** parse (defects, AI audio).
- Enum labels (defect type) — whitelist как на Edge.

---

## Ответы и ошибки

Единый helper:

```ts
function apiError(status: number, code: string, message: string) {
  const err = new Error(message) as ApiError;
  err.status = status;
  err.code = code;
  return err;
}
```

| code | HTTP | Когда |
|------|------|-------|
| `invalid_body` | 400 | schema fail |
| `missing_authorization` | 401 | нет Bearer |
| `invalid_token` | 401 | JWT bad/expired |
| `forbidden` | 403 | role/plan |
| `not_found` | 404 | row missing |
| `payload_too_large` | 413 | upload |
| `github_rate_limit` | 429 | external |
| `internal_error` | 500 | unexpected |

**Клиенту** — только `{ code, message }`. **Stack** — только в server log (level error), не в JSON response.

---

## Специальные паттерны

| Сценарий | Паттерн |
|----------|---------|
| **SSE** (`/api/ai/chat`) | `Content-Type: text/event-stream`; heartbeat; abort on client disconnect |
| **Multipart** (defects) | stream to `/data`; virus-scan/size — до записи |
| **Cron** | sync handler; log `sentCount`; 401 без secret |
| **Internal module call** | port interface, не HTTP loopback в монолите |

---

## Логирование — инварианты

### Никогда не логировать

- `password`, seed, KDF material, JWT (full), refresh tokens
- **ciphertext** vault (целиком или фрагменты)
- VAPID private, `GITHUB_TOKEN`, `DATABASE_URL`, `CRON_SECRET`
- Тело запроса с PII без redaction (email — только hash/id если нужно)

См. [[vault-and-crypto-invariants]], [[security-hygiene]].

### Всегда

- **Structured JSON** (одна строка на событие) — удобно для Amvera log viewer.
- **requestId** (correlation) — в каждой строке после middleware.
- **module** + **handler** (или `operation`) — где произошло.
- **userId** — только uuid, без email в info.
- **durationMs** — для медленных операций (admin list, send-due batch).

### Уровни

| Level | Когда |
|-------|-------|
| **info** | старт/конец cron, login success, deploy health |
| **warn** | slow query (> порог), retry, external 429, audit insert fail (non-fatal) |
| **error** | uncaught, 5xx path, DB connection fail |
| **debug** | только `NODE_ENV !== 'production'` или явный `LOG_LEVEL=debug` |

**Не** `console.log` в production path — единый `logger` из `shared/logging.ts`.

---

## Формат log line (рекомендация)

```json
{
  "level": "info",
  "time": "2026-06-28T12:00:00.000Z",
  "requestId": "uuid",
  "module": "notify",
  "operation": "sendDue",
  "msg": "cron completed",
  "sentCount": 42,
  "durationMs": 180
}
```

Поля **стабильные** — не произвольные строки каждый раз; `msg` короткий, детали — в named fields.

---

## Request logging middleware

На **входе** (после requestId):

- method, path (без query secrets), status — на **выходе**
- **Не** логировать Authorization header value
- **Не** логировать body vault/ai по умолчанию

На **ошибке** — `error` с `code`, `status`, `requestId`; stack только server-side.

---

## Перенос с Edge (legacy)

| Edge | API logging |
|------|-------------|
| `console.warn('[admin] slow…')` | `logger.warn({ module:'admin', operation, durationMs, … })` |
| `console.warn('audit log insert failed')` | warn + `err.code`; не падать если audit optional |
| ad-hoc strings | structured fields |

Сохранить **смысл** slow-path warnings из Edge — перенести в поля, не терять observability.

---

## Тесты

- Service: mock repo + assert throws `apiError` codes.
- Routes: supertest — status + `{ code }` body.
- **Не** assert на exact log text — при необходимости mock `logger`.

---

## PR checklist (API + logs)

- [ ] Handler без SQL; service без `req`
- [ ] Zod/validation на входе
- [ ] Errors через единый `apiError` / handler
- [ ] Нет секретов/ciphertext в логах
- [ ] Cron/admin slow paths — warn с durationMs
- [ ] Тесты на happy + error codes ([[tests-for-new-code]])

---

## Связанные skills

[[api-http-contracts]], [[supabase-edge-to-api-porting]], [[security-hygiene]], [[layer-boundaries-and-ports]]
