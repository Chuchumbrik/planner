# Система правил проекта — обзор (карта)

> Человекочитаемая карта: какие правила, скиллы, субагенты и хуки есть сейчас, **когда срабатывают**,
> **на что влияют** и **как всё связано**. Спецификация и контракт — в [`../RULES.md`](../RULES.md);
> остаток работ — в [`../plans/rules-system-roadmap.md`](../plans/rules-system-roadmap.md).

## Зачем это всё

Код в проекте пишут из **двух движков**: **Cursor** (вся команда) и **Claude Code** (пока один человек).
Чтобы правила и подсказки работали одинаково в обоих, каждое правило пишется **один раз** (канон), а
движки потребляют его через **тонкие адаптеры**. Гарантии («это обязано выполниться») держатся не текстом,
а проверкой (гейт) или формой воркфлоу — а не доброй волей модели.

## Общая схема

```
ИСТОЧНИК ИСТИНЫ                          АДАПТЕРЫ ПОД ДВИЖКИ                ГДЕ ВИДНО
.cursor/skills/<id>/SKILL.md  ──┬──►  .cursor/rules/<id>.mdc        ──►  Cursor (alwaysApply / globs)
  frontmatter: class, scope,    │
  applies-when, enforcement…    └──►  блок в CLAUDE.md (проекция)    ──►  Claude (авто-контекст)
                                        ▲ генерится из канона детерминированно
                                        │ триггеры: git post-merge, Claude SessionStart

КЛАСС ПРАВИЛА                 ЧЕМ ДЕРЖИТСЯ                                  ТРИГГЕР
guidance (подсказка)     ─►  только контекст                              —
gate (проверка факта)    ─►  scripts/check-gates/<id>.mjs                 pre-commit + CI (block)
process-invariant        ─►  форма воркфлоу (оркестратор тестов)          в момент производства
subagent-spec            ─►  .claude/agents/* (Claude) / Cursor-агент     при написании тестов
```

## Три класса правил

| Класс | Что это | Чем держится | Пример |
|---|---|---|---|
| **guidance** | подсказка как писать (стиль, доки) | контекст движка | `documentation-orientation`, `russian-requirements-writing-skill` |
| **gate** | проверяемый факт об артефакте | детерминированный скрипт + `exit≠0` | `tests-for-new-code`, `pre-commit-docs-roadmap` |
| **process-invariant** | свойство процесса, которого нет в диффе | форма воркфлоу | `tests-by-independent-agent` |
| *subagent-spec* | канон инструкций субагента (реализует инвариант) | определение агента в движке | `unit-test-writer`, `autotest-writer` |

Принцип: **гейтуй результат, а не механизм** — «есть тест на новый код», а не «запусти агента X».

## Что есть сейчас: реестр

| Правило / артефакт | Класс | Когда срабатывает | На что влияет |
|---|---|---|---|
| `tests-for-new-code` | gate | коммит/PR: `web/src`, `packages/*/src`, `services/*/src` | колокированный тест; **block** |
| `tests-by-independent-agent` | process-invariant | тесты пишутся агентом автоматически | тесты пишет отдельный агент, не автор кода; держится воркфлоу |
| `test-contour-orchestrator` | guidance (workflow) | после правки логики в web/packages | фазы: стоп автору → unit-test-writer → autotest-writer (условно) |
| `unit-test-writer` | subagent-spec | нужны unit/компонентные тесты (низ/середина пирамиды) | vitest+RTL, независимость, дисциплина пирамиды |
| `autotest-writer` | subagent-spec | нужны сквозные e2e (верх пирамиды) | Playwright, только критичные пути, независимость |
| `pre-commit-docs-roadmap` | gate | перед коммитом, если тронут продуктовый код | требует синхрон README / `productRoadmap.ts` / локалей; pre-commit + CI (**block**) |
| `documentation-orientation` | guidance | любая задача в репо (`alwaysApply`) | ориентир на доки + актуализация в том же PR; ручные шаги — в README |
| `russian-requirements-writing-skill` | guidance | правка `obsidian-motivator/**` или запрос ТЗ на русском | структура по ГОСТ, строгий язык, glossary-wikilinks |
| `engineering-craft` | guidance (meta) | любая реализация/рефакторинг в коде | мантра, промпты до/во время/после, self-review Staff-уровня; `alwaysApply` |
| `plan-before-implement` | guidance (process) | перед любой реализацией | декомпозиция, глубокий план, проверка противоречий; затем код; `alwaysApply` |
| `layer-boundaries-and-ports` | guidance | логика в web/packages/services | слои, порты, куда класть код, anti-patterns |
| `vault-and-crypto-invariants` | guidance | vault, crypto, sync, schemaVersion | DR-005/019, контракт, не логировать ciphertext |
| `react-ui-conventions` | guidance | компоненты и UI в `web/src` | i18n, a11y, designClasses, TanStack Query, RTL |
| `amvera-migration-orchestrator` | guidance | переезд Amvera | кластеры 0–12, dev/main, cutover |
| `amvera-secrets-and-env` | guidance | секреты Amvera | VITE build, runtime API, docs/amvera-secrets.md |
| `supabase-edge-to-api-porting` | guidance | Edge → API | карта функций, JWT, cron |
| `sql-amvera-migration-adaptation` | gate | SQL migrations Amvera | без RLS/auth.uid; gate **warn** |
| `frontend-api-client-cutover` | guidance | web → apiClient | VITE_API_URL, порядок модулей |
| `security-hygiene` | gate | секреты, authz, логи | no-secrets-in-diff **warn**; `alwaysApply` |
| `api-http-contracts` | guidance | planner-api | /api, /internal, errors, middleware |
| `pr-and-code-review` | guidance | перед PR / merge | чеклист, self-review, code-reviewer |
| `adr-and-architecture-decisions` | guidance | архитектурные изменения | DR-xxx, 08/10/11 Obsidian |
| `code-reviewer` | subagent-spec | ревью diff/PR | read-only, verdict approve/request-changes |
| `api-implementation-and-logging` | guidance | код planner-api | routes/service/repo, validation, JSON logs |

Субагенты Cursor (`.cursor/agents/*.md`): `unit-test-writer`, `autotest-writer`, **`code-reviewer`**.
Остальное Claude видит через проекцию в `CLAUDE.md`; Cursor — через `.mdc` и agents в репозитории.

## Триггеры (когда что исполняется)

| Механизм | Где | Когда срабатывает | Что делает |
|---|---|---|---|
| **pre-commit** | `.githooks/pre-commit` | перед каждым `git commit` | block-гейты + warn-гейты (secrets, SQL patterns) |
| **CI gates** | `.github/workflows/pr-checks.yml` | на PR в `main` | те же гейты против базы PR (**block**) + typecheck/build/tests |
| **post-merge** | `.githooks/post-merge` | на `git pull`/`merge` (любой движок) | пересобирает проекцию правил под Claude |
| **SessionStart** | `.claude/settings.json` | старт сессии Claude | пересобирает проекцию (страховка свежести) |
| **UserPromptSubmit** | `.claude/settings.json` | каждый запрос в Claude | подсказывает уместный плагин (см. ниже) |
| **Cursor stop / subagentStop** | `.cursor/hooks.json` | конец хода Agent / subagent | если логические исходники без теста — `followup_message` → unit-test-writer (`.cursor/hooks/nudge-unit-test-writer.mjs`, `loop_limit: 2`) |

Подключение git-хуков: `git config core.hooksPath .githooks` (для команды — TODO: `prepare`-скрипт или README).
Локальный warn: `GATE_WARN=1` перед commit или в CI (не рекомендуется для main).

## Субагенты и пирамида тестирования

Тесты пишут **два независимых субагента**, оба — не авторы кода (инвариант `tests-by-independent-agent`):
- **unit-test-writer** — низ/середина: unit (`packages/*/src`, `web/src/lib`) и компонентные/интеграционные (vitest + React Testing Library).
- **autotest-writer** — верх: сквозные e2e (Playwright — вводится), только критичные пользовательские пути.

Оркестрирующий воркфлоу «код → unit-test-writer → autotest-writer» — **`.cursor/skills/test-contour-orchestrator/SKILL.md`**. E2e: Playwright в `web/e2e/**`, `npm run test:e2e`, CI job `e2e` (warn).

## Подсказки по плагинам (только Claude)

`UserPromptSubmit`-хук → `scripts/claude-plugin-hints.mjs`, конфиг `.claude/plugin-hints.json`. На запрос
подсказывает уместный глобальный плагин: ревью → `/code-review`, коммит/PR → `/commit`, UI → `/frontend-design`,
безопасность → `/security-review`, арх-решение → `/adr-create`. Без совпадений — молчит. Cursor эти хуки не исполняет.

## Как расширять

- **Подсказку** добавляет любой: новый `.cursor/skills/<id>/SKILL.md` по контракту (`RULES.md §3`) + при нужде `.mdc`.
- **Гейт / инвариант** — через PR с ревью (блокирует всех): обязателен `owner`, новый гейт стартует в `warn`.
- Проекция под Claude и Cursor-адаптеры собираются из канона — не вести руками два источника.

Подробности контракта, governance и принятых решений — в [`../RULES.md`](../RULES.md).
