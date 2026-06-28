# План улучшения системы правил (по итогам глубокого аудита)

> Источник: аудит 24 правил 4 параллельными агентами (2026-06-27) против контракта `RULES.md` §2/§3/§5.
> Приоритеты: **P0** (нарушение контракта/дыра в гарантиях) → **P3** (гигиена).

## Системные находки (повторяются в нескольких группах)

1. **Неверный класс у гейтов-в-маске-guidance.** `security-hygiene` и `sql-amvera-migration-adaptation`
   помечены `class: guidance`, но имеют `enforcement: git-hook+ci` и **реальные чек-скрипты**
   (`no-secrets-in-diff.mjs`, `no-supabase-patterns-in-amvera-sql.mjs`), подключённые в pre-commit и CI.
   Эффект: проекция кладёт их в «Подсказки» Claude, а не в «Гейты». Нарушение §2.
2. **`owner: TBD` у всех гейтов/инвариантов** (`tests-for-new-code`, `tests-by-independent-agent`,
   `pre-commit-docs-roadmap`, `security-hygiene`, `sql-amvera-…`). Нарушение §3/§5; висит как §8.1.
3. **Контракт §3 не знает `subagent-spec`.** `unit-test-writer`, `autotest-writer`, `code-reviewer` несут
   `kind: subagent-spec` + противоречивый `class: guidance`; поля `kind/implements/enforced-by` вне схемы.
4. **Нет жизненного цикла.** Миграционные правила Amvera (4 шт.) неотличимы от постоянных. Нужен
   `lifecycle: permanent|migration` (+ `sunset-when`). При этом 3 «миграционных» правила на деле постоянные.
5. **Раздувание always-on контекста.** `engineering-craft` + `plan-before-implement` оба `alwaysApply:true`
   c `globs:["**/*"]` в обоих движках (~310 строк в каждый запрос); плюс `documentation-orientation`,
   `security-hygiene`. Дублируют ядро тест-контура/планирования в постоянном контексте.
6. **Дрейф «спека ↔ реализация».** §8.2 (семантика теста) уже решена в коде (строгая колокация), но висит
   открытой; `pre-commit-docs` `enforced-by: "(TODO)"` — скрипт давно есть; скрипт уже своего канона
   (проверяет 2 файла из ~5 заявленных).
7. **Дрейф globs канон↔`.mdc`** (`adr` без `web/src`, `react-ui` слишком широк по `.ts`, оркестратор Amvera) —
   симптом, что Cursor-проекция не перегенерировалась.
8. **Дыры покрытия гейтов.** CI-job `gates` стоит `if: pull_request` → на прямой push в `main` гейты НЕ
   гоняются (а разработчик пушит напрямую). `core.hooksPath` не автоматизирован (нет `prepare`) → локальный
   слой опционален для новых клонов. Путь промоушена `GATE_BLOCK` не протестирован.

## План по приоритетам

### P0 — нарушения контракта / дыры гарантий
- [ ] **`sql-amvera-migration-adaptation`: `class: guidance` → `gate`**, `enforcement-level: warn`, `owner`.
- [ ] **`security-hygiene`: split** — карточку оставить `guidance/none` (authz, PII, abuse — не гейтуемо),
  гейт-грань вынести отдельной записью `no-secrets-in-diff` (`class: gate`, `warn`, `owner`).
- [ ] **Назначить `owner`** всем гейтам/инвариантам (решение за владельцем — см. ниже).
- [ ] **Гонять гейты на push в `main`** (снять `if: pull_request` или продублировать job) — иначе прямой
  push мимо гейтов.

### P1 — целостность контракта и контекста
- [ ] **Внести в `RULES.md` §3 `subagent-spec`** как отдельный вид артефакта (схема: `kind`, `implements`,
  без `class: guidance`). Убрать противоречивый `class` у трёх субагентов.
- [ ] **Внести в §3 жизненный цикл** (`lifecycle: permanent|migration`, опц. `sunset-when: <событие>`).
  Пометить 4 миграционных правила `migration / sunset: cutover §12`.
- [ ] **Переклассифицировать постоянные из Amvera-группы**: `api-http-contracts`,
  `api-implementation-and-logging`, `amvera-secrets-and-env` → постоянная группа «planner-api».
- [ ] **Снять `alwaysApply` с `engineering-craft`** (перевести в контекстное по правкам кода);
  `plan-before-implement` оставить always-on. Сократить always-on набор.
- [ ] **Свести спеку и код**: зафиксировать в каноне `tests-for-new-code` критерий = строгая колокация,
  снять §8.2 из открытых; убрать `(TODO)` из `pre-commit-docs` `enforced-by`; описать границу гейта честно.
- [ ] **`tests-by-independent-agent`: убрать вводящий в заблуждение `enforcement-level: block`** (воркфлоу
  не падает; блокировку даёт backstop-гейт).

### P2 — дедупликация и согласованность
- [ ] **Заменить пересказы ссылками `[[…]]`**: инвариант независимости тестов (в `test-contour-orchestrator`,
  `engineering-craft`, `pr-and-code-review`); планирование (craft ↔ plan-before-implement); self-review;
  команды проверки (`vitest`, `check-gates`) — в один источник.
- [ ] **Синхронизировать globs канон↔`.mdc`** (перегенерировать Cursor-стороной `_cursor-adapter-sync`, не руками):
  `adr` (+`web/src`), `react-ui-conventions` (сузить до `.tsx` + явные UI-`.ts`), оркестратор Amvera, `services/*` в оркестраторе тестов.
- [ ] **Добавить гейт «фронт без supabase»** (зеркало `no-supabase-patterns` по `web/src/**`) — DoD cutover
  держится только текстом.
- [ ] **Автоматизировать `core.hooksPath`** (npm `prepare`-скрипт) — локальный слой не зависит от ручной настройки.
- [ ] **Внести `no-secrets-in-diff` в реестр §9** отдельной gate-записью.

### P3 — гигиена
- [ ] Убрать самоссылки в `links` (`api-http-contracts`, `api-implementation-and-logging`).
- [ ] Починить опечатки в каноне (`артеfact`, оборванный bold в оркестраторе Amvera).
- [ ] Вычистить историческую археологию в `test-contour-orchestrator` (про удалённые workflow-скрипты).

## Решения за владельцем (нужны до P0/P1)
- **`owner`** гейтов: один человек на старте или по зонам? (без него P0 не закрыть формально).
- **alwaysApply-политика**: согласен перевести `engineering-craft` в контекстное?
- **Гейты на прямой push в main**: включаем?
- **`core.hooksPath`** командно: через `prepare`-скрипт?

## Сильные стороны (не трогать)
- Слой гейтов **реально детерминирован** (не «на бумаге»): 4 рабочих чек-скрипта, режимы warn/block
  консистентны, ссылки `enforced-by` указывают на существующие файлы.
- Hub-and-spoke в Amvera-группе и в тест-контуре (оркестратор ссылается, не дублирует) — здоровый паттерн.
- Узкие globs + `alwaysApply:false` у большинства правил — контекст не засорён (кроме п.5).
