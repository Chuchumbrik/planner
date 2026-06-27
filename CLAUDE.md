# Инструкции для Claude — проект Planner (Мотиватор)

## Документирование в Obsidian

После реализации, изменения или обсуждения любой функциональности — обновляй соответствующий файл в `/root/Projects/planner/obsidian-motivator/`.

### Главное правило

В каждом затронутом файле функция должна быть описана так, чтобы было понятно:
1. **Как она работает** — кратко и по существу (логика, ключевые компоненты, API-эндпоинты или UI-элементы)
2. **Статус** — одна из трёх меток:
   - `✅ Реализовано` — функция работает на сайте/в приложении
   - `🚧 В процессе` — частично реализована или в активной разработке
   - `📋 Планируется` — есть в плане, но ещё не написана

### Какой файл обновлять

| Что изменилось | Файл |
|---|---|
| Новая функция или модуль | `10-Каталог-функций-и-взаимодействий.md` |
| Архитектурное решение | `08-Архитектура.md` + `12-Журнал-решений.md` |
| Модель данных | `11-Модель-данных-концептуально.md` |
| User flow изменился | `09-User-Flow-одного-дня.md` |
| Продуктовое решение / trade-off | `12-Журнал-решений.md` |
| Появилась неопределённость | `99-Открытые-вопросы-к-команде.md` |
| Идея на будущее | `15-Идеи-для-развития.md` |

Если изменение касается нескольких файлов — обновляй все.

### Формат записи функции

В `10-Каталог-функций-и-взаимодействий.md` каждая функция оформляется так:

```
## Название функции — ✅ Реализовано

**Как работает:** ...краткое описание логики...

| Элемент | Описание |
|---------|----------|
| Компонент/эндпоинт | ... |
| Ключевая логика | ... |

**Связи:** [[файл]] если есть зависимости
```

### Когда обновлять

- После завершения реализации функции — обязательно
- После значимого изменения в уже реализованной функции — обновить описание и статус
- После принятия продуктового решения — даже если код ещё не написан (статус `📋 Планируется`)
- Не нужно документировать: мелкие правки стилей, рефакторинг без изменения поведения, исправление опечаток

---

## Версионирование

После любого значимого изменения кода — обновлять версию в `web/package.json`.

### Схема версии `0.Y.Z`

| Сегмент | Смысл | Когда менять |
|---|---|---|
| `0` | Глобальная стадия | Только после выхода MVP (станет `1`) |
| `Y` (сейчас `7`) | Фаза разработки | При завершении текущей фазы и переходе к следующей |
| `Z` | Всё остальное | При каждом значимом изменении — функция, фикс, UI-изменение |

**Правило:** в большинстве случаев инкрементируй только `Z` (`0.7.3 → 0.7.4`).

### Когда НЕ менять версию

- Мелкие правки стилей, исправление опечаток в тексте
- Рефакторинг без изменения поведения
- Обновление только документации/Obsidian

---

## Краткая сводка в админ-панели

После каждого изменения версии — добавлять новый блок в `RELEASE_NOTES_BLOCKS` в файле `web/src/data/productRoadmap.ts`.

### Формат блока

```ts
{
  dateLabel: { ru: 'YYYY-MM-DD', en: 'YYYY-MM-DD' },  // сегодняшняя дата
  items: [
    {
      releasedInVersion: { ru: '0.7.X', en: '0.7.X' },  // новая версия
      changes: [
        {
          ru: '**Раздел:** что изменилось — технически точно.',
          en: '**Section:** what changed — technically precise.',
        },
      ],
      plainBullets: [  // опционально, если изменение заметно пользователю
        {
          ru: 'То же самое простым языком для пользователя.',
          en: 'Same thing in plain language for the user.',
        },
      ],
    },
  ],
},
```

Новый блок вставлять **в начало** массива `RELEASE_NOTES_BLOCKS` (новые записи — сверху).

---

## Процесс разработки с QA

Требования к тестам вынесены в **правила проекта** (см. блок «Правила проекта (проекция под Claude)» ниже и канон в `.cursor/skills/`): `tests-for-new-code` (новый код несёт тесты) и `tests-by-independent-agent` (тесты пишет независимый агент). Здесь их **не дублировать**.

Перед PR локально:
- `npm test` в `web/`
- typecheck + build по тому же пути, что в CI (`npm run build -w web`)

GitHub CI (`.github/workflows/pr-checks.yml`) блокирует мёрдж при провале typecheck+build или тестов; гейты правил (`tests-for-new-code`, `pre-commit-docs`) идут отдельным шагом (раскатка warn).

---

<!-- RULES:BEGIN (авто-генерация scripts/project-rules-to-claude.mjs — не редактировать вручную) -->
## Правила проекта (проекция под Claude)

_Сгенерировано из `.cursor/skills/*` (scope включает `claude`). Источник истины — там; блок переписывается автоматически, руками не править._

**Гейты (обязательные проверки):**
- `pre-commit-docs-roadmap` — перед git commit/push, когда дифф трогает web/src, packages/*/src, services/*/src, UX, локали или версию — синхронизировать README, productRoadmap.ts и локали в том же коммите. Проверка: `scripts/check-gates/pre-commit-docs.mjs (TODO); чеклист в теле скилла` (block). Канон: `.cursor/skills/pre-commit-docs-roadmap/SKILL.md`.
- `tests-for-new-code` — коммит трогает логику в web/src, packages/*/src или services/*/src — на изменённый исходник должен меняться его тест. Проверка: `scripts/check-gates/tests-for-new-code.mjs` (block). Канон: `.cursor/skills/tests-for-new-code/SKILL.md`.

**Инварианты процесса (держатся воркфлоу, не диффом):**
- `tests-by-independent-agent` — когда новый код покрывается тестами автоматически (агентом) — тесты должен писать НЕ тот агент, что писал код. Обеспечивает: test-contour-orchestrator; субагенты unit-test-writer + autotest-writer (оба отдельные от автора кода). Канон: `.cursor/skills/tests-by-independent-agent/SKILL.md`.

**Субагенты:**
- `autotest-writer` — нужны сквозные e2e-автотесты на критичные пользовательские сценарии (верх пирамиды, Playwright). Канон: `.cursor/skills/autotest-writer/SKILL.md`.
- `code-reviewer` — независимое ревью PR или diff перед merge — read-only, чеклист pr-and-code-review, verdict approve/request-changes. Канон: `.cursor/skills/code-reviewer/SKILL.md`.
- `unit-test-writer` — нужно написать unit и компонентные/интеграционные тесты на новую/изменённую логику (нижние и средние уровни пирамиды). Канон: `.cursor/skills/unit-test-writer/SKILL.md`.

**Подсказки:**
- `adr-and-architecture-decisions` — меняется граница системы, контракт, инфраструктура, security model, продуктовый trade-off — зафиксировать DR/ADR до или в том же PR. Канон: `.cursor/skills/adr-and-architecture-decisions/SKILL.md`.
- `amvera-migration-orchestrator` — работа по переезду Vercel+Supabase → Amvera — кластеры плана, ветки, DoD, связанные skills. Канон: `.cursor/skills/amvera-migration-orchestrator/SKILL.md`.
- `amvera-secrets-and-env` — настройка Amvera, сборка web, env API, cron, документирование секретов — без значений в git. Канон: `.cursor/skills/amvera-secrets-and-env/SKILL.md`.
- `api-http-contracts` — проектирование или реализация services/planner-api — модули, роуты, ошибки, middleware, cron. Канон: `.cursor/skills/api-http-contracts/SKILL.md`.
- `api-implementation-and-logging` — написание handlers, services, middleware и логов в services/planner-api — как писать код, что логировать, чего избегать. Канон: `.cursor/skills/api-implementation-and-logging/SKILL.md`.
- `documentation-orientation` — при любой задаче в репозитории — ориентироваться на документацию как контекст/договорённости и держать её актуальной; ручные шаги вне репо фиксировать в README. Канон: `.cursor/skills/documentation-orientation/SKILL.md`.
- `engineering-craft` — при любой реализации, рефакторинге или исправлении в коде — держать планку staff/principal-уровня: архитектура, читаемость, тесты, безопасность, минимальный diff. Канон: `.cursor/skills/engineering-craft/SKILL.md`.
- `frontend-api-client-cutover` — замена прямого supabase.* на HTTP API, VITE_API_URL, auth/vault/notify/defects/admin/ai клиенты. Канон: `.cursor/skills/frontend-api-client-cutover/SKILL.md`.
- `layer-boundaries-and-ports` — при добавлении или изменении логики в web, @motivator/core, services/planner-api — куда класть код и как не ломать архитектуру. Канон: `.cursor/skills/layer-boundaries-and-ports/SKILL.md`.
- `plan-before-implement` — перед любой реализацией, рефакторингом или нетривиальным исправлением — декомпозиция, глубокий план, проверка противоречий; только потом код. Канон: `.cursor/skills/plan-before-implement/SKILL.md`.
- `pr-and-code-review` — перед открытием PR, при ревью чужого/своего diff, перед merge — чеклист проекта и отдельный субагент code-reviewer. Канон: `.cursor/skills/pr-and-code-review/SKILL.md`.
- `react-ui-conventions` — при создании или изменении компонентов, страниц, hooks с UI в web/src. Канон: `.cursor/skills/react-ui-conventions/SKILL.md`.
- `russian-requirements-writing-skill` — создание/правка документов в obsidian-motivator/ или запрос ТЗ/требований/спецификации/журнала решений на русском — структура по ГОСТ 19.201-78 и Р 59795-2021, строгие языковые правила, обязательные glossary-wikilinks. Канон: `.cursor/skills/russian-requirements-writing-skill/SKILL.md`.
- `security-hygiene` — любой код, конфиг, diff, логи — секреты, authz, PII, vault ciphertext. Канон: `.cursor/skills/security-hygiene/SKILL.md`.
- `sql-amvera-migration-adaptation` — перенос или создание SQL-миграций для planner-db / services/planner-api/migrations. Канон: `.cursor/skills/sql-amvera-migration-adaptation/SKILL.md`.
- `supabase-edge-to-api-porting` — перенос логики из web/supabase/functions в services/planner-api — модуль, контракт, cron. Канон: `.cursor/skills/supabase-edge-to-api-porting/SKILL.md`.
- `test-contour-orchestrator` — после реализации или правки логики в web/src или packages/*/src — закрыть tests-by-independent-agent и tests-for-new-code через двух субагентов, не автором кода. Канон: `.cursor/skills/test-contour-orchestrator/SKILL.md`.
- `vault-and-crypto-invariants` — при любой правке шифрования, vault JSON, sync, seed/KDF, remote save, schemaVersion или тарифов free/paid. Канон: `.cursor/skills/vault-and-crypto-invariants/SKILL.md`.
<!-- RULES:END -->
