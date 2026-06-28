# Система правил проекта (RULES) — спецификация v0.1 (DRAFT)

> Статус: черновик на согласование. Описывает, **как** в этом репозитории живут правила,
> чтобы они одинаково работали в двух движках — **Cursor** (используют все разработчики)
> и **Claude Code** (использует пока один человек) — из **одного источника истины**.

> 🗺 Человекочитаемая карта системы (реестр, триггеры, схема) — `docs/rules-system-overview.md`.

## 1. Зачем

Правило пишется **один раз** (канонический контент), а каждый движок потребляет его через
**тонкий адаптер**. Это убирает рассинхрон «двух копий правила, которые разъезжаются».
Гарантии («это обязано выполниться») держатся не текстом, а **проверкой/формой воркфлоу**.

## 2. Три класса правил

Каждое правило относится ровно к одному классу — от этого зависит, **чем** оно держится.

| Класс | Что это | Проверяемо из артефакта? | Чем держится |
|---|---|---|---|
| `guidance` | подсказка: как писать код/доки, тон, стиль | — (не нужно) | контент в контексте движка |
| `gate` | факт-инвариант об артефакте: «есть тесты на новый код», «README обновлён» | **да**, булева проверка над диффом/файлами | git-хук и/или CI, падение = `exit ≠ 0` |
| `process-invariant` | свойство **процесса**, которого нет в диффе: «тесты пишет НЕ тот агент, что писал код» | **нет**, принципиально | форма воркфлоу в точке производства (свой воркфлоу у каждого движка) |

**Главный принцип формулировки гейтов: гейтуй РЕЗУЛЬТАТ, а не МЕХАНИЗМ.**
- ❌ «запусти субагента X, который напишет юниты» (механизм, привязан к движку)
- ✅ «коммит, трогающий `web/src/**/*.ts(x)`, обязан содержать изменения в соответствующих тест-файлах» (результат, движко-независим)

Так каждый движок (и человек) удовлетворяет правило своим способом, а планку держит репозиторий.

> Замечание про `process-invariant`: его **нельзя** свести к гейту (в диффе нет «кто автор тестов»).
> Поэтому он обеспечивается воркфлоу (напр. у Claude — отдельная фаза/агент на тесты, не автор кода),
> а гейт `«тесты существуют»` стоит рядом как backstop на случай «воркфлоу вообще не гоняли».

## 3. Контракт frontmatter (единый формат правила)

Каждое правило — markdown-файл с YAML-frontmatter по схеме ниже. Из этих полей **детерминированно**
проецируются адаптеры под оба движка. Чем строже заполнено — тем меньше нужно «интерпретации».

```yaml
---
id: <stable-kebab-slug>          # неизменная идентичность; на неё ссылаются адаптеры и links
title: <человеческий заголовок>
class: guidance | gate | process-invariant
scope: [cursor, claude]          # какие движки потребляют правило (один или оба)
applies-when: <одна строка>      # NL-триггер: и для авто-применения, и для человека
globs: [<path-globs>]            # опц.: для cursor auto-attach и matcher'а гейта/CI
enforcement: none | git-hook+ci | ci | git-hook | workflow
enforcement-level: warn | block  # для gate: warn = логирует, не блокирует; block = валит коммит/CI
enforced-by: <указатель|"">      # напр. "scripts/check-gates/<id>.mjs", "pr-checks.yml#gates", ".claude/agents/unit-test-writer.md"
owner: <ник>                     # обязателен для gate / process-invariant (кто ревьюит изменения)
status: active | draft | deprecated
lifecycle: permanent | migration # опц. (по умолч. permanent); migration → временное правило
sunset-when: <событие>           # опц., только для lifecycle: migration — когда удалять
links: [<other-ids>]             # связанные правила
---

<тело: само правило, чеклист, краевые случаи>
```

> **Артефакты-не-правила.** Субагенты (`kind: subagent-spec`) и тулинг (`kind: tooling`) используют
> поле `kind` ВМЕСТО `class` (у них `class` не ставится). Допустимы поля `implements`, `enforced-by`.
> Это «способ удовлетворить правило», а не правило (§2/§9) — в проекции идут отдельной группой.

## 4. Слои и где что лежит

```
RULES.md                          # этот файл — спецификация системы
.cursor/skills/<id>/SKILL.md      # КАНОНИЧЕСКИЙ контент правила (источник истины) — конвенция уже есть
.cursor/rules/<id>.mdc            # адаптер Cursor: alwaysApply/globs → ссылка на канон
CLAUDE.md (раздел-индекс)         # адаптер Claude: указатели на правила (генерируется проекцией)
.claude/hooks/ + .husky/ + CI     # СЛОЙ ГЕЙТОВ: детерминированные проверки фактов
scripts/workflows/*               # СЛОЙ ВОРКФЛОУ: держит process-invariant'ы (контур Claude)
```

- **Канон** — один файл на правило (`.cursor/skills/<id>/SKILL.md`), с frontmatter по §3.
- **Адаптер Cursor** (`.cursor/rules/<id>.mdc`) — тонкий, `alwaysApply`/`globs`, ссылается на канон.
- **Адаптер Claude** — указатель в `CLAUDE.md` + (для `gate`) хук. **Генерируется**, не ведётся руками (см. §6).
- **Гейт** — реальная проверка: локальный git-хук (быстро, до коммита) и/или CI (авторитетно, не обойти).

## 5. Governance (расширяют разные люди)

Барьер на добавление зависит от класса — потому что гейт блокирует коммиты **всем**:

| Класс | Кто добавляет | Барьер |
|---|---|---|
| `guidance` | любой разработчик | кинуть файл; ревью лёгкий/опциональный |
| `gate` / `process-invariant` | через PR с ревью | обязателен `owner` + ревью: ломает чужие коммиты |

## 6. Кросс-движковость и проекция под Claude (асимметрия)

Cursor — у всех, Claude — пока у одного. Поэтому канон ведём в Cursor-потребляемой форме,
а **проекцию под Claude генерируем** (а не дублируем руками):

- **git `post-merge`** (срабатывает на любом `git pull`, кем бы ни запущен) — помечает/пересобирает Claude-проекцию;
- **Claude `SessionStart`** — страховка: при старте сессии проверить свежесть проекции;
- проекция **детерминирована**, пока frontmatter строгий (§3) — это транспайлер из полей, а не LLM-догадка;
  LLM-интерпретацию приберечь только для размытых правил.

> «Хук» здесь — команда, которую среда запускает САМА на событии жизненного цикла; это гарантия,
> а не пожелание (не зависит от того, «вспомнила» ли модель). Различать: **git-хуки** (на git-операции,
> движко-независимы) и **Claude Code хуки** (на события сессии/инструментов Claude).

## 7. Принятые решения

- ✅ **Канон — в `.cursor/skills/<id>/SKILL.md`** (достраиваем существующую конвенцию команды).
- ✅ **Гейты — git-хук + CI**: одна логика проверки (`scripts/check-gates/<id>.mjs`), запуск из двух мест
  (`.githooks/pre-commit` — быстрый локальный фидбек; `pr-checks.yml#gates` — авторитет, не обойти).
- ✅ **Раскатка гейта `warn → block`**: новый гейт стартует в `warn`; `tests-for-new-code` и
  `pre-commit-docs-roadmap` переведены в **`block`** (2026-06-27). Локальный warn: `GATE_WARN=1`.

## 8. Открытые вопросы

- [ ] Коммит `193c3ee` урезал `CLAUDE.md` (~66 строк) — вернуть ли вырезанное содержимое.
- [ ] Гейт «фронт без supabase»: нужен список легитимных путей-адаптеров (где supabase допустим до cutover).

### Решено (2026-06-28)
- ✅ `owner` гейтов — `@Chuchumbrik` (один владелец на старте).
- ✅ Семантика `tests-for-new-code` — строгая колокация по имени (`X.test.tsx`), как в `_lib.mjs`.
- ✅ `.githooks` — авто-включение через npm `prepare` (`git config core.hooksPath .githooks`).
- ✅ Cursor-субагенты — `.cursor/agents/*` (через `_cursor-adapter-sync`).
- ✅ Прямой push в `main` запрещён — только PR (branch protection, `enforce_admins`).
- ✅ `security-hygiene` split: guidance + отдельный gate `no-secrets-in-diff`; `sql-amvera` → class `gate`.
- ✅ Контракт §3: введены `lifecycle` и `kind: subagent-spec`.

## 9. Реестр правил

| id | class | enforcement | level | состояние |
|---|---|---|---|---|
| `tests-for-new-code` | gate | git-hook+ci | block | + `services/*/src` (2026-06); pre-commit + CI (block) |
| `tests-by-independent-agent` | process-invariant | workflow | block | канон+адаптер ✅; оркестратор `test-contour-orchestrator` ✅ |
| `test-contour-orchestrator` | guidance | workflow | — | канон+`.mdc` ✅; процедура код→unit→e2e |
| `unit-test-writer` | subagent-spec | — | — | канон ✅; Claude + Cursor агенты ✅ |
| `autotest-writer` | subagent-spec | — | — | канон ✅; Claude + Cursor агенты ✅; Playwright + CI e2e ✅ |
| `pre-commit-docs-roadmap` | gate | git-hook+ci | block | реформат ✅; check-скрипт ✅; pre-commit + CI (block) |
| `documentation-orientation` | guidance | none | — | реформат ✅ (канон-скилл + тонкий `.mdc`, `alwaysApply`) |
| `russian-requirements-writing-skill` | guidance | none | — | реформат ✅; ГОСТ-ревизия доков — план `plans/gost-doc-revision.md` |
| `engineering-craft` | guidance | none | — | мета: как писать код; **контекстное** (globs на код, не alwaysApply) |
| `plan-before-implement` | guidance | none | — | обязательно: декомпозиция → план → противоречия → код; `alwaysApply` |
| `layer-boundaries-and-ports` | guidance | none | — | волна 1 ✅; слои core/web/API, порты |
| `vault-and-crypto-invariants` | guidance | none | — | волна 1 ✅; VAULT_CRYPTO_CONTRACT, инварианты |
| `react-ui-conventions` | guidance | none | — | волна 1 ✅; React, i18n, a11y, designClasses |
| `amvera-migration-orchestrator` | guidance | none | — | волна 2 ✅; кластеры Amvera, ветки, DoD |
| `amvera-secrets-and-env` | guidance | none | — | волна 2 ✅; docs/amvera-secrets.md |
| `supabase-edge-to-api-porting` | guidance | none | — | волна 2 ✅; Edge → planner-api |
| `sql-amvera-migration-adaptation` | gate | git-hook+ci | warn | gate no-supabase-patterns; `lifecycle: migration`; owner @Chuchumbrik |
| `frontend-api-client-cutover` | guidance | none | — | волна 2 ✅; apiClient, VITE_API_URL |
| `security-hygiene` | guidance | none | — | split: guidance (authz/PII/abuse); гейт вынесен → `no-secrets-in-diff`; `alwaysApply` |
| `no-secrets-in-diff` | gate | git-hook+ci | warn | вынесен из `security-hygiene`; owner @Chuchumbrik |
| `api-http-contracts` | guidance | none | — | волна 2 ✅; planner-api модули, HTTP errors |
| `pr-and-code-review` | guidance | none | — | волна 3 ✅; PR checklist, self-review |
| `adr-and-architecture-decisions` | guidance | none | — | волна 3 ✅; DR в Obsidian |
| `code-reviewer` | subagent-spec | — | — | волна 3 ✅; read-only review; Cursor+Claude agents |
| `api-implementation-and-logging` | guidance | none | — | API handler/service/repo, structured logging |

> Удалён `github-defect-workflow` (не нужен). ГОСТ-анализ obsidian-доков выполнен (11 ✅ / 9 🟡 / 0 🔴);
> список к правке — в `plans/gost-doc-revision.md`.

> `subagent-spec` — вид артефакта (§3): канонические инструкции субагента, которые *реализуют*
> инвариант процесса. Живут в `.cursor/skills/`, оборачиваются `.claude/agents/*` (Claude) и
> `.cursor/agents/*` (Cursor). Это «способ удовлетворить правило», а не само правило (§2). `class` не ставится.

> **Жизненный цикл (§3 `lifecycle`).** `migration` (гасятся после cutover, sunset §12):
> `amvera-migration-orchestrator`, `supabase-edge-to-api-porting`, `frontend-api-client-cutover`,
> `sql-amvera-migration-adaptation`. Постоянные (после cutover вынести из миграционной группы в «planner-api»):
> `api-http-contracts`, `api-implementation-and-logging`, `amvera-secrets-and-env`.

## 10. Реализованные механизмы

- ✅ **Проекция под Claude** (§6): `scripts/project-rules-to-claude.mjs` — детерминированно собирает
  блок `RULES:BEGIN…END` в `CLAUDE.md` из `.cursor/skills/*` (scope `claude`). Триггеры:
  `.githooks/post-merge` (на `git pull`; включён `git config core.hooksPath .githooks`) и
  Claude `SessionStart`-хук (`.claude/settings.json`). Идемпотентно.
- ✅ **Подсказки по плагинам — Claude-only** (п.4): `.claude/settings.json` `UserPromptSubmit`-хук →
  `scripts/claude-plugin-hints.mjs`, конфиг `.claude/plugin-hints.json` (редактируемый список
  `{match, hint}`). На запрос подсказывает уместный плагин (`/code-review`, `/commit`, `/frontend-design`…),
  молчит без совпадений. Работает только в Claude Code (Cursor эти хуки не исполняет).
