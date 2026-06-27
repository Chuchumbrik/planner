---
id: vault-and-crypto-invariants
title: Vault и крипто-инварианты
class: guidance
scope: [cursor, claude]
applies-when: при любой правке шифрования, vault JSON, sync, seed/KDF, remote save, schemaVersion или тарифов free/paid
globs: ["packages/motivator-core/src/**/crypto*.ts", "packages/motivator-core/src/vault/**", "packages/motivator-core/src/domain/**", "packages/motivator-core/src/sync/**", "web/src/**/*Vault*", "web/src/**/*vault*", "web/src/**/crypto*.ts"]
enforcement: none
status: active
links: [layer-boundaries-and-ports, engineering-craft, tests-for-new-code]
---

# Vault и крипто-инварианты

**Источник истины по форматам:** `packages/motivator-core/docs/VAULT_CRYPTO_CONTRACT.md`.
Этот skill — **операционные инварианты** для агента и разработчика: что нельзя нарушить даже «для быстрого фикса».

## Неприкосновенные правила

1. **Seed и пароль KDF не покидают клиент** (paid E2E). API хранит только **ciphertext** (и метаданные по ADR для free-tier).
2. **Сервер не decrypt vault** для бизнес-логики. Аналитика на сервере — только по явно разрешённым метаданным (notify hybrid и т.д., DR-019).
3. После `JSON.parse` vault — **всегда** `normalizeVault()` (`packages/motivator-core/src/vault/normalize.ts`).
4. **Не менять** PBKDF2-итерации, длину IV, формат ciphertext string без:
   - обновления `VAULT_CRYPTO_CONTRACT.md`;
   - золотого вектора в `cryptoVault.test.ts`;
   - записи в журнале решений (ломает существующих пользователей).
5. **`schemaVersion`** поднимается только с миграцией в `normalize.ts` + тестами на v(N-1)→vN.
6. **Не логировать:** seed, password, derived key, полный ciphertext, расшифрованный JSON vault.

## Формат (краткая шпаргалка)

| Элемент | Значение |
|---------|----------|
| Ciphertext string | `base64(IV).base64(cipher+tag)` |
| IV | 12 байт, уникальный на encrypt |
| KDF | PBKDF2-HMAC-SHA256, **310000** iter, salt = decoded seed (32 B) |
| Открытый текст | UTF-8 JSON, актуально **`schemaVersion: 8`** |

Проверка паритета: `cryptoVault.test.ts` + hex-ключ в контракте.

## Sync и remote

- Debounce remote save: `VAULT_REMOTE_SAVE_DEBOUNCE_MS` (`sync/constants.ts`) — не убирать без причины.
- **`remoteHydrated`:** пока первая гидрация не завершена — не включать редактирование (см. README, VaultProvider).
- Конфликты версий: уважать `version` на сервере; не затирать новее без явной стратегии.
- Encrypted commands (batch ops) — **backlog**; до ADR не импровизировать «сервер мержит plaintext».

## Free vs paid (DR-019)

- Модель **free-tier storage** — только после решения **0.3** в плане миграции; не кодировать «наугад».
- **`vault_encryption_enabled`** / **`plan_tier`** — источник правды в auth/API, не хардкод в UI.
- UI показывает разный UX, но **контракт crypto** для paid остаётся как в DR-005.

## Где что менять

| Задача | Файлы |
|--------|--------|
| KDF / AES-GCM | `packages/motivator-core/src/lib/cryptoVault.ts` |
| Типы, empty vault | `packages/motivator-core/src/vault/types.ts` |
| Миграции JSON | `packages/motivator-core/src/vault/normalize.ts` |
| Доменные операции | `packages/motivator-core/src/domain/vaultOperations.ts` |
| Supabase/API адаптер | `web/src/lib/supabaseVaultRemote.ts` → будущий api vault client |
| React lifecycle | `VaultProvider`, hooks — **без** дублирования crypto |

## Тесты (обязательны при правках)

- `cryptoVault.test.ts` — KDF golden vector, round-trip.
- `normalize.test.ts` — каждая новая версия схемы.
- `vaultOperations.test.ts` — доменные инварианты.
- Компоненты vault — RTL по **поведению**, не по внутренностям crypto.

Процесс: [[tests-by-independent-agent]]; гейт [[tests-for-new-code]].

## Красные флаги в review

- `console.log` рядом с vault/ciphertext.
- Новый способ хранения seed (sessionStorage без обоснования).
- `atob`/`btoa` вне `cryptoVault` для «своего» формата.
- Парс vault без `normalizeVault`.
- «Временно» decrypt на Edge/API.

## Связанные артеfactы

- `packages/motivator-core/docs/VAULT_CRYPTO_CONTRACT.md`
- `obsidian-motivator/06-Приватность-и-безопасность.md`, DR-005, DR-019
- [[layer-boundaries-and-ports]], [[engineering-craft]]
