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
gate (проверка факта)    ─►  scripts/check-gates/<id>.mjs                 pre-commit + CI (warn→block)
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
| `tests-for-new-code` | gate | коммит/PR трогает `web/src` или `packages/*/src` (`.ts/.tsx`, не тест) | требует изменения парного теста; pre-commit + CI (warn) |
| `tests-by-independent-agent` | process-invariant | тесты пишутся агентом автоматически | тесты пишет отдельный агент, не автор кода; держится воркфлоу |
| `unit-test-writer` | subagent-spec | нужны unit/компонентные тесты (низ/середина пирамиды) | vitest+RTL, независимость, дисциплина пирамиды |
| `autotest-writer` | subagent-spec | нужны сквозные e2e (верх пирамиды) | Playwright, только критичные пути, независимость |
| `pre-commit-docs-roadmap` | gate | перед коммитом, если тронут продуктовый код | требует синхрон README / `productRoadmap.ts` / локалей; pre-commit + CI (warn) |
| `documentation-orientation` | guidance | любая задача в репо (`alwaysApply`) | ориентир на доки + актуализация в том же PR; ручные шаги — в README |
| `russian-requirements-writing-skill` | guidance | правка `obsidian-motivator/**` или запрос ТЗ на русском | структура по ГОСТ, строгий язык, glossary-wikilinks |

Адаптеры Cursor (`.cursor/rules/*.mdc`): для `tests-for-new-code`, `tests-by-independent-agent`,
`pre-commit-docs-roadmap`, `documentation-orientation`. *(Для субагентов и `russian-requirements` —
Cursor-адаптеры пока TODO.)*
Адаптеры Claude (`.claude/agents/*`): `unit-test-writer`, `autotest-writer`. Остальное Claude видит через
проекцию в `CLAUDE.md`.

## Триггеры (когда что исполняется)

| Механизм | Где | Когда срабатывает | Что делает |
|---|---|---|---|
| **pre-commit** | `.githooks/pre-commit` | перед каждым `git commit` | гоняет гейты по staged (`tests-for-new-code`, `pre-commit-docs`); warn — не блокирует |
| **CI gates** | `.github/workflows/pr-checks.yml` | на PR в `main` | те же гейты против базы PR (warn, `continue-on-error`) + typecheck/build/tests |
| **post-merge** | `.githooks/post-merge` | на `git pull`/`merge` (любой движок) | пересобирает проекцию правил под Claude |
| **SessionStart** | `.claude/settings.json` | старт сессии Claude | пересобирает проекцию (страховка свежести) |
| **UserPromptSubmit** | `.claude/settings.json` | каждый запрос в Claude | подсказывает уместный плагин (см. ниже) |

Подключение git-хуков: `git config core.hooksPath .githooks` (для команды — TODO: `prepare`-скрипт или README).
Промоушен гейта `warn → block`: убрать `continue-on-error` в CI и выставить `GATE_BLOCK=1`.

## Субагенты и пирамида тестирования

Тесты пишут **два независимых субагента**, оба — не авторы кода (инвариант `tests-by-independent-agent`):
- **unit-test-writer** — низ/середина: unit (`packages/*/src`, `web/src/lib`) и компонентные/интеграционные (vitest + React Testing Library).
- **autotest-writer** — верх: сквозные e2e (Playwright — вводится), только критичные пользовательские пути.

Оркестрирующий воркфлоу «код → unit-test-writer → autotest-writer» — в разработке.

## Подсказки по плагинам (только Claude)

`UserPromptSubmit`-хук → `scripts/claude-plugin-hints.mjs`, конфиг `.claude/plugin-hints.json`. На запрос
подсказывает уместный глобальный плагин: ревью → `/code-review`, коммит/PR → `/commit`, UI → `/frontend-design`,
безопасность → `/security-review`, арх-решение → `/adr-create`. Без совпадений — молчит. Cursor эти хуки не исполняет.

## Как расширять

- **Подсказку** добавляет любой: новый `.cursor/skills/<id>/SKILL.md` по контракту (`RULES.md §3`) + при нужде `.mdc`.
- **Гейт / инвариант** — через PR с ревью (блокирует всех): обязателен `owner`, новый гейт стартует в `warn`.
- Проекция под Claude и Cursor-адаптеры собираются из канона — не вести руками два источника.

Подробности контракта, governance и принятых решений — в [`../RULES.md`](../RULES.md).
