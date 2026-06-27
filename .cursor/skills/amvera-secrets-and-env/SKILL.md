---
id: amvera-secrets-and-env
title: Секреты и env Amvera
class: guidance
scope: [cursor, claude]
applies-when: настройка Amvera, сборка web, env API, cron, документирование секретов — без значений в git
globs: ["amvera.yaml", "amvera.build.commands.example.txt", "scripts/build-amvera.mjs", "docs/amvera-secrets.md", "deploy/**", "web/.env.example"]
enforcement: none
status: active
links: [security-hygiene, amvera-migration-orchestrator]
---

# Секреты и env Amvera

**Таблица имён (без значений):** [`docs/amvera-secrets.md`](../../docs/amvera-secrets.md).

## Инварианты

1. **Значения секретов не в git** — ни в коде, ни в `amvera.yaml`, ни в коммитах.
2. **`VITE_*`** — только **публичное**; на Amvera задаются в **override `build.additionalCommands`** (runtime env на build **не** видны).
3. **Private keys** (VAPID private, JWT secret, DB password, GROQ, GITHUB) — только runtime env **`planner-api`** или password manager команды.
4. **Cron** — shared secret; вызов internal только с `Authorization: Bearer <CRON_SECRET>`.
5. При добавлении нового секрета — **строка в `docs/amvera-secrets.md`** в том же PR.

## Сборка web

```text
VITE_SUPABASE_URL=… VITE_SUPABASE_ANON_KEY=… VITE_VAPID_PUBLIC_KEY=… npm run build:amvera
```

После cutover клиента: **`VITE_API_URL`** вместо/вместе с Supabase (см. [[frontend-api-client-cutover]]).

Проверка: `scripts/build-amvera.mjs` падает, если нет обязательных `VITE_*` на гибридном этапе.

## Локальная разработка

- `web/.env.local` — gitignore; образец — `web/.env.example`.
- Не копировать prod secrets в `.env.local` без need-to-know.

## Гейт

`scripts/check-gates/no-secrets-in-diff.mjs` — warn по умолчанию; не игнорировать предупреждения без проверки diff.

## Связанные skills

[[security-hygiene]], [[amvera-migration-orchestrator]]
