---
id: frontend-api-client-cutover
title: Cutover фронта на apiClient
class: guidance
scope: [cursor, claude]
applies-when: замена прямого supabase.* на HTTP API, VITE_API_URL, auth/vault/notify/defects/admin/ai клиенты
globs: ["web/src/**/*.ts", "web/src/**/*.tsx", "web/.env.example"]
enforcement: none
status: active
lifecycle: migration
sunset-when: "cutover (план §12)"
links: [layer-boundaries-and-ports, supabase-edge-to-api-porting, api-http-contracts, amvera-migration-orchestrator, test-contour-orchestrator]
---

# Cutover фронта на apiClient

Цель (план §9): **`grep supabase` = 0** в prod path или только legacy adapter за flag.

## Единая точка

`web/src/api/client.ts` (создать по плану):

- base URL из `import.meta.env.VITE_API_URL`
- `Authorization: Bearer` из auth session
- parse errors → typed `ApiError`
- retry только где осознанно (не vault upload loop)

## Порядок миграции (зависимости)

```
1. authClient + AuthProvider (flag)
2. vault remote (VaultRemotePort HTTP)
3. notify (subscriptions, schedule)
4. hasRemoteVault / meta
5. defects (upload, submit)
6. admin (invokeAdminFn → fetch)
7. ai (chat, transcribe)
8. удалить @supabase/supabase-js из prod path / deps (post-cutover)
```

## Feature flag

- **`VITE_API_URL` задан** → API path; иначе legacy Supabase (гибрид на stage).
- `isSupabaseConfigured` → **`isApiConfigured`** (или union: api OR supabase для перехода).
- Не ломать local dev без `.env.local`.

## Карта файлов (legacy → API)

| Файл / зона | API |
|-------------|-----|
| `AuthProvider.tsx` | `/api/auth/*` |
| `supabaseVaultRemote.ts` | `createApiVaultRemote` |
| `syncNotificationSchedule.ts`, `pushSubscription.ts` | `/api/notify/*` |
| `hasRemoteVault.ts` | `GET /api/vault/meta` |
| `FileDefectModal`, `useFileDefect` | `/api/defects/*` |
| `admin/*`, `discussionsApi` | `/api/admin/*` |
| `useAiChat`, `useSpeechInput` | `/api/ai/*` |
| `adminActivityPing.ts` | `POST /api/admin/activity` |

## Правила

- **Порт** в core не менять контракт ciphertext ([[vault-and-crypto-invariants]]).
- Компоненты вызывают **hooks/services**, не raw `fetch`.
- i18n сообщения об ошибках — ключи, не текст API verbatim.
- Каждый шаг — vitest (mock apiClient); сквозной smoke — §9.3 плана / [[autotest-writer]].

## .env.example

```bash
# Legacy (hybrid)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Target
VITE_API_URL=https://<api>.amvera.io
VITE_VAPID_PUBLIC_KEY=
```

## DoD шага 9.1

- [ ] Нет новых `supabase.from` / `supabase.functions.invoke` вне adapter слоя
- [ ] README Amvera + `.env.example` актуальны
- [ ] Stage smoke §9.3 пройден
