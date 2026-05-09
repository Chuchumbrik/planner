# Контракт хранения vault (криптография и JSON)

Документ фиксирует **стабильный контракт** между веб-клиентом, будущими нативными клиентами и Telegram Mini App. Любая реализация, которая соблюдает этот контракт, читает и пишет те же данные в Supabase (`public.user_vault`).

## Таблица `user_vault`

| Колонка | Тип | Смысл |
|---------|-----|--------|
| `user_id` | `uuid` | PK, совпадает с `auth.users.id` |
| `ciphertext` | `text` | Строка формата см. ниже |
| `version` | `integer` | Монотонный счётчик сохранений (клиент инкрементирует при успешном upsert) |
| `updated_at` | `timestamptz` | Время записи |

RLS: доступ только к строке с `user_id = auth.uid()`.

## Формат `ciphertext`

Одна строка ASCII:

```
<base64(IV)> "." <base64(ciphertext_plus_tag)>
```

- Разделитель — один символ `.` (точка).
- **IV** — ровно **12 байт** (`AES_GCM_IV_LENGTH_BYTES`), случайные, уникальные на каждое шифрование.
- **ciphertext_plus_tag** — вывод AES-256-GCM: шифротекст + **16 байт** auth tag (как возвращает Web Crypto `encrypt` для AES-GCM).

Кодировка Base64 — стандартная **RFC 4648** без переносов строк (как `btoa` в браузере для байтов).

## Ключ шифрования (KDF)

Параметры PBKDF2 (должны совпадать побайтово между платформами):

| Параметр | Значение |
|----------|----------|
| Алгоритм | PBKDF2 |
| PRF | HMAC-SHA-256 |
| Итерации | **310000** (`PBKDF2_ITERATIONS` в `packages/motivator-core/src/lib/cryptoVault.ts`) |
| Соль | **32 байта**, равные декодированному **seed** из Base64 (не пароль и не отдельное поле) |
| Пароль KDF | Строка пароля пользователя в **UTF-8** |
| Длина выходного ключа | **256 бит** → AES-256 |

Импорт ключа для PBKDF2 в Web Crypto: материал пароля — `TextEncoder.encode(password)` как `raw` ключ для `PBKDF2`.

Итог: один ключ **AES-256-GCM** для шифрования UTF-8 JSON vault.

## Открытый текст

После расшифровки — **UTF-8** строка, являющаяся `JSON.stringify` объекта vault. Минимальная актуальная схема — **`schemaVersion: 5`** (см. `packages/motivator-core/src/vault/types.ts`). Любая запись должна проходить через **`normalizeVault`** (`packages/motivator-core/src/vault/normalize.ts`) после парсинга JSON.

## Золотой вектор PBKDF2 (проверка паритета)

Фиксированные входы для межплатформенных тестов:

- `seedB64` = `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=` (32 нулевых байта в Base64).
- `password` = `contract-test-password` (UTF-8).

Ожидаемые **256 бит** ключа (сырой материал AES-256), hex:

```
63c24bd708d1b43c7ce0cebe8b34780d1309b847a62af172851ff3661a40db7a
```

Проверка: `packages/motivator-core/src/lib/cryptoVault.test.ts` — функция `deriveAes256RawKey` (PBKDF2 `deriveBits`, 256 бит) vs эталон в этом документе; плюс round-trip AES-GCM через `deriveAesKey`.

## Ссылки на код

| Элемент | Файл |
|---------|------|
| KDF + AES-GCM | `packages/motivator-core/src/lib/cryptoVault.ts` (`deriveAes256RawKey`, `deriveAesKey`, `encryptUtf8` / `decryptUtf8`) |
| Нормализация / миграции JSON | `packages/motivator-core/src/vault/normalize.ts` |
| Типы и `emptyVault` | `packages/motivator-core/src/vault/types.ts` |
| Доменные операции над vault (без UI/Supabase) | `packages/motivator-core/src/domain/vaultOperations.ts` |
| Debounce удалённого сохранения | `packages/motivator-core/src/sync/constants.ts` (`VAULT_REMOTE_SAVE_DEBOUNCE_MS`) |
