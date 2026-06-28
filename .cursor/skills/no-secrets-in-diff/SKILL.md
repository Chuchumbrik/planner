---
id: no-secrets-in-diff
title: Нет секретов в диффе
class: gate
scope: [cursor, claude]
applies-when: перед коммитом — патч не должен содержать секретов (токены, приватные ключи, строки подключения с паролем)
globs: ["**/*"]
enforcement: git-hook+ci
enforcement-level: warn
enforced-by: "scripts/check-gates/no-secrets-in-diff.mjs"
owner: "@Chuchumbrik"
status: active
links: [security-hygiene]
---

# Нет секретов в диффе

Гейт ловит секреты в staged-диффе **до** того, как они попадут в историю git.

## Что проверяет

`scripts/check-gates/no-secrets-in-diff.mjs` — 6 regex по добавленным строкам диффа:

1. Postgres connection url (`postgresql://…:…@…`);
2. JWT (три base64url-сегмента через точку);
3. приватный ключ (`-----BEGIN … PRIVATE KEY-----`);
4. VAPID private key;
5. GitHub token (`ghp_…` и пр.);
6. generic `KEY=secret` (присвоение секрета в открытом виде).

## Режим

**warn** — гейт логирует находки, но не валит коммит. Промоушен в **block** — через `GATE_BLOCK=1`.

## Как закрыть

- Убрать секрет из диффа.
- Вынести значение в env / секреты Amvera (см. `docs/amvera-secrets.md`), в git — только имя переменной.

## См. также

Детальный guidance по безопасности (authz, PII, rate-limit, path-traversal) — [[security-hygiene]].
