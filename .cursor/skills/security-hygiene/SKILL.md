---
id: security-hygiene
title: Гигиена безопасности
class: guidance
scope: [cursor, claude]
applies-when: любой код, конфиг, diff, логи — секреты, authz, PII, vault ciphertext
globs: ["**/*"]
enforcement: none
status: active
links: [vault-and-crypto-invariants, amvera-secrets-and-env, api-http-contracts, engineering-craft, no-secrets-in-diff]
---

# Гигиена безопасности

Грань «нет секретов в диффе» вынесена в отдельный гейт [[no-secrets-in-diff]] (там автопроверка); здесь — guidance по authz, PII, rate-limit, path-traversal.

## Секреты

- **Не в git:** passwords, JWT secrets, private keys, `postgresql://`, PAT `ghp_`, API keys.
- **VITE_** — только то, что безопасно светить в браузере (anon, public VAPID, API URL).
- Таблица имён — [`docs/amvera-secrets.md`](../../docs/amvera-secrets.md); значения — Amvera LK / `.env.local`.
- Гейт **`no-secrets-in-diff`** — warn; перед merge проверить diff вручную.

## Auth / authz

- Проверка роли **на сервере** для admin/beta/defects/ai.
- JWT: короткий access, refresh rotation; logout инвалидирует refresh.
- Не доверять `user_id` из body — только из verified JWT.
- Cron/internal — `CRON_SECRET`, не anon/service key в query string.

## Vault и PII

- [[vault-and-crypto-invariants]] — без исключений.
- Логи: user id допустим; email — осторожно; ciphertext/seed — **никогда**.
- Error responses — без stack trace наружу в prod.

## Input / abuse

- Лимит размера body (defect attachments, AI audio).
- Rate limit на `/api/ai/*` per user.
- Path traversal: uploads только в `/data/defect-attachments/<user>/…`.
- Validate UUIDs и enum labels (defect types).

## Зависимости

- Новая npm deps — осознанно; проверить known CVE для critical path (auth, crypto).
- Не добавлять server-only libs в `web` bundle.

## PR self-check

- [ ] Diff без секретов (гейт + глаза)
- [ ] Admin не «только скрыта кнопка»
- [ ] Ciphertext не в логах/Analytics
- [ ] Secrets documented in `docs/amvera-secrets.md` if new

## Связанные skills

[[amvera-secrets-and-env]], [[vault-and-crypto-invariants]], [[engineering-craft]]
