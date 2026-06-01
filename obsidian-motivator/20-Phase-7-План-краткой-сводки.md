# Phase 7 — План редизайна страницы «Краткая сводка» (`/admin/roadmap`)

> **Скоуп**: внутренний admin tool — `/admin/roadmap` + новая `/admin/discussions`.
> **Аудитория**: 1 admin (owner проекта).
> **Бюджет**: ~15.5 рабочих дней через 13 sub-phases.
> **Часть MVP Phase 7** «Настройки, аккаунт, юридика» — это под-направление.
> **Базис решений**: [[19-Business-требования#BR-D-004]] + [[19-Business-требования#BR-D-005]] (owner override).

**Статус**: 🚧 В процессе (7.0–7.7 завершены и в `main`; следующее — блок Discussions 7.8–7.11).

---

## 1. Контекст и зачем

`/admin/roadmap` («Краткая сводка») сейчас — стена из 5 вложенных `<details>`-аккордеонов с 110 релиз-айтемами и ~80 идеями. UX-проблемы (см. [[19-Business-требования#BR-D-004]]):
- Чтобы дойти до конкретного изменения — 3-4 клика.
- Никакого поиска / anchor-ссылок / временной перспективы.
- Все секции одного визуального тона, иерархии нет.
- Open Questions — захардкожены в i18n, не живые.

Фаза 7 превращает страницу в **живой admin hub**: видишь свежий релиз сразу, ищешь любую версию за секунду, обсуждаешь открытые вопросы как треды с уведомлениями, видишь куда идём дальше.

---

## 2. Definition of Done

1. MCP setup завершён, Claude через `mcp__supabase__*` может читать таблицы проекта.
2. **Hero + Timeline + Search + Data model + Migration** — задеплоено в main.
3. **2-col Plan+Ideas + Footer stats + Reminder 24h** — задеплоено.
4. **Discussions backend + UI + notifications + sync workflow** — задеплоено и протестировано push-уведомлениями.
5. ≥1 реальный discussion-thread пройден полным циклом `open → К журналу → synced` с записью в [[12-Журнал-решений]].

---

## 3. Метрики успеха

| Метрика | Сейчас | Цель |
|---|---|---|
| Время «открыл → понял где в MVP» | 3-4 мин (аккордеоны) | <30 сек |
| Частота обновления changelog | <1/нед (friction) | ≥3 добавлений/нед |
| Search используется | 0 | ≥1 запрос/нед |
| Discussions threads resolved/month | 0 | ≥3 |

---

## 4. Архитектурные решения

| Решение | Выбор | Обоснование |
|---|---|---|
| **Аудитория** | только admin | 1 пользователь; не показывается даже beta_tester'у |
| **Discussions vs Obsidian-journal** | Hybrid (вариант B2) | In-app — workspace; Obsidian-journal остаётся источником истины. Ручная sync через статус «К журналу». Claude по-прежнему читает Obsidian через Read+Grep + Supabase через MCP. |
| **Discussions location** | Отдельная страница `/admin/discussions` | Запросил owner; не перегружает roadmap-страницу |
| **Reminder 24h** | Keep — fixed 24h + snooze + weekend skip | Owner override BR-D-004 reject. «Это мой инструмент для меня». |
| **Notifications scope** | Full — push (VAPID) + in-app badge | Owner override BR-D-004 anti-feature |
| **MCP access** | Read-write, один токен без ротации | Solo dev на личной машине; trust acceptable |
| **Tag migration** | Скрипт автотеггинга + ручная доработка (~6h) | Lower friction чем чисто ручная |
| **Release notes / ideas storage** | Остаются в `productRoadmap.ts` (code) на эту фазу | Переезд в Supabase — Phase 8+ (Variant Z/W) |

---

## 5. Data model

### 5.1 Расширение типов в `web/src/data/productRoadmap.ts`

```ts
export type RoadmapReleaseTag =
  | 'feat' | 'fix' | 'refactor' | 'docs'
  | 'chore' | 'test' | 'build' | 'ci' | 'perf' | 'style'

export interface RoadmapReleaseNoteItem {
  releasedInVersion: LocalizedString
  tag?: RoadmapReleaseTag       // NEW
  anchor?: string               // NEW — например "v0.7.10"
  changes: LocalizedString[]
  plainBullets?: LocalizedString[]
}

export interface RoadmapMvpPhase {
  id: number
  title: LocalizedString
  // ...
  current?: boolean             // NEW — ровно одна фаза с current: true
}

export type RoadmapIdeaStatus =
  | 'proposed' | 'accepted' | 'rejected' | 'in-discussion' | 'shipped'

export interface RoadmapIdeaEntry {
  // ...
  status?: RoadmapIdeaStatus     // NEW
  linkedVersion?: string         // NEW — если shipped
  linkedDiscussion?: string      // NEW — если in-discussion
}
```

### 5.2 Discussions — Supabase schema

```sql
-- 007_admin_discussions.sql
create table admin_discussions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,                                       -- markdown
  status text not null default 'open'
    check (status in ('open', 'pending-journal', 'synced', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  resolution_summary text,                                  -- заполняется при open→pending-journal
  linked_journal_entry text,                                -- "DR-016", при pending-journal→synced
  linked_version text,                                      -- "0.7.15", опционально
  reply_count int not null default 0,
  last_reply_at timestamptz
);

-- 008_admin_discussion_replies.sql
create table admin_discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references admin_discussions(id) on delete cascade,
  body text not null,                                       -- markdown
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

-- 009_admin_discussion_read.sql
create table admin_discussion_read (
  user_id uuid not null references auth.users(id),
  discussion_id uuid not null references admin_discussions(id) on delete cascade,
  last_read_at timestamptz not null,
  primary key (user_id, discussion_id)
);

-- 010_admin_discussion_subscribers.sql  (для notification opt-in)
create table admin_discussion_subscribers (
  user_id uuid not null references auth.users(id),
  discussion_id uuid not null references admin_discussions(id) on delete cascade,
  subscribed_at timestamptz not null default now(),
  primary key (user_id, discussion_id)
);

-- RLS:
-- admin — все операции
-- beta_tester — select + insert reply
-- user — нет доступа
```

### 5.3 Discussion lifecycle

```
            ┌──────────┐
            │   open   │  ← admin создал, идёт обсуждение
            └────┬─────┘
                 │  resolve + write resolution_summary
                 ▼
       ┌────────────────────┐
       │   К журналу        │  ← решено, ждёт переноса в Obsidian-journal
       │  (pending-journal) │      pulse-анимация чипа в UI
       └────┬───────────────┘
            │  admin скопировал summary в 12-Журнал-решений.md как DR-XXX
            │  + указал номер в UI
            ▼
       ┌─────────────┐
       │  Синхрон.   │  ← linked_journal_entry заполнено, переходит в архив
       │  (synced)   │
       └─────────────┘

  open → archived  (без резолюции — admin закрыл как «не актуально»)
```

---

## 6. Routing

| URL | Что |
|---|---|
| `/admin/roadmap` | Главная — Hero + Timeline + 2-col bottom + Footer stats |
| `/admin/roadmap?v=0.7.10` | Preset version filter |
| `/admin/roadmap?q=push&tag=feat` | Preset search + tag filter |
| `/admin/roadmap?from=0.7.0&to=0.7.15` | Version range filter |
| `/admin/roadmap#v0.7.10` | Anchor scroll to specific release card |
| `/admin/discussions` | Список тредов |
| `/admin/discussions/:id` или `/admin/discussions#:id` | Конкретный тред |

---

## 7. Sub-phases — детальная спецификация

### 7.0 — MCP setup (`0.5 дня`) ✅ **completed**

**Что делаем**:
- Установить `@supabase/mcp-server-supabase@latest` через npx.
- Добавить запись `supabase` в `~/.claude.json` → `mcpServers`.
- Token + project ref в `env` блоке.
- Permissions `0600` на `~/.claude.json`.
- Smoke test через JSON-RPC initialize.

**Acceptance**:
- `mcp__supabase__list_tables`, `mcp__supabase__execute_sql` доступны в новой сессии.
- HTTP 200 от Supabase API с этим токеном.
- Backup `~/.claude.json.bak-pre-supabase-mcp` создан.

**Файлы**: `~/.claude.json` (config), `~/.claude.json.bak-pre-supabase-mcp` (backup).

### 7.1 — Data model + Migration (`1 день`)

**Что делаем**:
- Расширить типы `RoadmapReleaseNoteItem`, `RoadmapMvpPhase`, `RoadmapIdeaEntry` (см. §5.1).
- Скрипт `scripts/migrate-release-tags.mjs` — пройти по `RELEASE_NOTES_BLOCKS`, попытаться auto-tag по keyword в первом change (regex `^**(\w+):\*\*?`). Недосопоставленные — вывести списком.
- Ручная разметка ~10-20 ambiguous items (4-6 часов).
- Phase 7 в `MVP_PHASES_PLANNED` пометить `current: true`.
- Backfill `status: 'proposed'` на все existing идеи (массовая правка).
- Anchor: `anchor = v${semver}` — auto-derived если не указан.

**Acceptance**:
- `tsc -p tsconfig.app.json --noEmit` — clean.
- Все 110 items имеют `tag`.
- Существующие компоненты не сломаны (props optional).

**Файлы**: `web/src/data/productRoadmap.ts`, `scripts/migrate-release-tags.mjs`.

### 7.2 — Hero block (`1 день`)

**Что делаем**:
- 3 модуля в горизонтальной строке:
  - `Status card`: MVP %, фаза N/13 с current-флагом, иконка emoji_events
  - `What's new card`: последний релиз (auto из `RELEASE_NOTES_BLOCKS[0]`), tag-чип, relative time, кнопка «Полный changelog ↓»
  - `Current focus card`: «Сейчас работаем над Фазой N: ...» (из `MVP_PHASES_PLANNED.find(p => p.current)`)
- Если последний релиз < 24h назад — значок «✨ Свежее» на What's new
- `Quick links bar` под Hero: chips «История / План / Идеи / Обсуждения» с counter'ами

**Файлы**: `web/src/components/admin/AdminRoadmapHero.tsx` (новый), `web/src/pages/AdminRoadmapPage.tsx` (использовать).

### 7.3 — Timeline (`2 дня`)

**Что делаем**:
- Вертикальная лента релизов, сгруппированных по датам.
- Каждый день — большая дата + relative time (`сегодня` / `вчера` / `3 дня назад` / `2 недели назад` / `2 месяца назад`; после 90д — абсолютная).
- Внутри дня — карточки релизов:
  - Версия — крупная (text-2xl tabular)
  - Tag chip — с per-tag цветом (см. §8.2)
  - Relative time
  - Anchor icon `link` — copy `#v0.7.15` в clipboard
  - Changes (раскрытый список) + Plain bullets (под `<details>`)
- Последние **5** релизов раскрыты по дефолту, дальше «Показать ещё»
- Anchor scroll: на mount если `location.hash` есть — scroll + highlight 800ms

**Файлы**: `web/src/components/admin/RoadmapTimeline.tsx` (новый), `web/src/lib/relativeTime.ts` (новый).

### 7.4 — Search/filter sticky bar (`2 дня`)

**Что делаем**:
- Sticky под Hero, fade на scroll.
- 🔎 Search input — `?q=` query param, debounce 250ms, поиск по `changes` + `plainBullets`.
- Tag multi-select chips — `?tag=feat,fix`.
- Version range slider `?from=0.7.0&to=0.7.15`.
- Reset кнопка.
- Counter: «Найдено: 12 из 110».
- При active filter — matching items раскрыты автоматически.
- Empty state: «Ничего не найдено».

**Файлы**: `web/src/components/admin/RoadmapSearchBar.tsx` (новый), `web/src/lib/roadmapFilter.ts` (новый — pure logic + tests).

### 7.5 — 2-col Plan+Ideas (`1 день`)

**Что делаем**:
- На `xl+` — двухколоночная вёрстка снизу.
- **Левая колонка — План MVP** (`MVP_PHASES_PLANNED`):
  - Фазы 7-13 как карточки
  - Current-фаза — emerald glow + pulse + «СЕЙЧАС» badge
  - Click → expand details bullets
- **Правая колонка — Идеи на потом** (`IDEAS_LATER_ENTRIES`):
  - Группы как folder-карточки с counter
  - Каждая идея — status chip (см. §8.2)
  - Если `status: 'shipped'` + `linkedVersion` — clickable, ведёт на anchor `#v...` в Timeline
  - Если `linkedDiscussion` — clickable, ведёт на тред

**Файлы**: `web/src/components/admin/RoadmapPlanIdeas.tsx` (новый).

### 7.6 — Footer stats + sparkline (`1 день`)

**Что делаем**:
- Маленькие цифры:
  - Релизов всего / за 7 дней / за 30 дней
  - Идей: proposed / accepted / shipped / rejected
  - Discussions: open / pending-journal / synced
- Sparkline скорости (релизов в неделю за 12 недель) — клик ведёт на timeline
- Использовать Recharts `LineChart` (уже подключён)

**Файлы**: `web/src/components/admin/RoadmapFooterStats.tsx` (новый), `web/src/lib/roadmapStats.ts` (новый — агрегации).

### 7.7 — Reminder 24h amber-баннер (`0.5 дня`)

**Что делаем**:
- Компонент `ReleaseCadenceReminder` под Hero
- Логика: при открытии `/admin/roadmap` проверить дату последнего релиза vs `now`
- Порог — `localStorage.adminRoadmapReminderHours` (default 24, варианты 24/48/72)
- Если просрочено и не snoozed:
  - 24-48h: amber-баннер «Последний релиз — N часов назад»
  - >72h: red-warning «3+ дня без релиза»
- Snooze: «Скрыть на сегодня» → `localStorage.adminRoadmapReminderSnoozedUntil`
- Weekend skip: `respectWeekends` default `true`, проверка `isWeekend(now)`
- Bypass для `paused: true` на current phase: «работа приостановлена»

**Файлы**: `web/src/components/admin/ReleaseCadenceReminder.tsx` (новый), `web/src/lib/releaseCadence.ts` (новый — pure logic + tests).

### 7.8 — Discussions backend (`2 дня`)

**Что делаем**:
- Миграции `007_admin_discussions`, `008_admin_discussion_replies`, `009_admin_discussion_read`, `010_admin_discussion_subscribers` (см. §5.2).
- Edge function `admin-discussions` с actions: `list`, `get`, `create`, `reply`, `resolve`, `mark-synced`, `archive`, `mark-read`, `subscribe`, `unsubscribe`.
- RLS policies: admin all, beta select+insert reply, user denied.
- Triggers: bump `reply_count` + `last_reply_at` на новый reply.
- Indices: `(status, last_reply_at desc)` для list-views.

**Acceptance**:
- Миграции применяются на Supabase через MCP `apply_migration`.
- Edge function отвечает на все actions.
- Из консоли можно curl'нуть `list` и получить пустой массив.

**Файлы**: `web/supabase/migrations/007-010_*.sql`, `web/supabase/functions/admin-discussions/index.ts`.

### 7.9 — Discussions UI (`2 дня`)

**Что делаем**:
- Новая страница `/admin/discussions` через `AdminDiscussionsPage`.
- Список тредов:
  - Title + 1 line preview + reply_count + last_reply_at + unread badge
  - Сортировка: open → pending-journal → synced → archived
  - Status chips per row
- Thread view:
  - Title + body (markdown, react-markdown)
  - Reply list threaded by created_at
  - Reply form (markdown editor)
  - Actions: «Решить» (open→pending-journal), «Перенёс в журнал» (pending-journal→synced), «Архивировать»
- Create modal: title + body + опц. `linked_version`
- Markdown sanitization (re-use существующий setup)

**Файлы**: `web/src/pages/AdminDiscussionsPage.tsx`, `web/src/components/admin/discussions/` (несколько компонентов: List, Thread, Reply, CreateModal, ResolveModal, SyncModal).

### 7.10 — Discussions notifications (`1 день`)

**Что делаем**:
- При insert reply → DB trigger вызывает Edge function для push'а subscriber'ам.
- Re-use существующего VAPID-сервиса (`web/supabase/functions/send-due/` как pattern).
- In-app badge: `<UnreadDiscussionsBadge />` в шапке + рядом с пунктом меню «Discussions».
- Bell-shake анимация при новом unread.
- Auto-subscribe для автора треда и тех, кто ответил.
- Unsubscribe в UI треда.

**Файлы**: `web/supabase/functions/admin-discussions-notify/index.ts`, `web/src/components/layout/UnreadDiscussionsBadge.tsx`.

### 7.11 — Sync workflow «К журналу» (`0.5 дня`)

**Что делаем**:
- В Thread view при статусе `pending-journal` показать prompt: «Скопируй summary в `obsidian-motivator/12-Журнал-решений.md` как DR-XXX, затем нажми "Synced"».
- Кнопка copy-to-clipboard для `resolution_summary`.
- Input `linked_journal_entry` (например `DR-016`) при переходе → `synced`.
- На статусе `pending-journal` — pulse-анимация amber chip.
- В list view threads со статусом `pending-journal` поднимаются вверх.

**Файлы**: добавки в `web/src/components/admin/discussions/Thread.tsx`.

### 7.12 — A11y + mobile + perf (`1 день`)

**Что делаем**:
- A11y audit: aria-labels на всех interactive elements, focus order, keyboard nav для Timeline.
- Mobile: collapsed Hero по умолчанию, sticky search, swipe-to-resolve в thread list.
- Perf: virtualization timeline если >50 items в view (через `react-window` или manual chunking).
- Тестирование `prefers-reduced-motion`.

---

## 8. Visual design

### 8.1 Цветовое кодирование зон

| Зона | Accent |
|---|---|
| Hero status / current-phase | emerald |
| Hero «What's new» (< 24h) | gold + light glow |
| Timeline | neutral surface + tag-цвета |
| План | current emerald glow + pulse |
| Идеи | per-status (см. §8.3) |
| Discussions | orange |
| Footer stats | muted neutral |

### 8.2 Tag colors

| Tag | Color | Иконка |
|---|---|---|
| feat | emerald | star |
| fix | amber | build_circle |
| refactor | violet | construction |
| docs | sky | description |
| chore | zinc | inventory |
| perf | gold | speed |
| test | cyan | bug_report |
| build/ci | slate | settings |
| style | rose | brush |

### 8.3 Idea status chips

| Status | Color |
|---|---|
| proposed | neutral |
| accepted | blue |
| in-discussion | orange |
| shipped | emerald |
| rejected | zinc/50 |

### 8.4 Discussion status chips

| Status | Color | Иконка |
|---|---|---|
| open | emerald | chat_bubble |
| pending-journal (К журналу) | amber + pulse | sync_problem |
| synced | muted neutral | check_circle |
| archived | zinc/40 | archive |

### 8.5 Section icons

- Hero status → `emoji_events`
- What's new → `rocket_launch`
- Current focus → `radio_button_checked`
- Timeline → `update`
- План → `route`
- Идеи → `lightbulb`
- Discussions → `forum`
- Stats → `bar_chart`

### 8.6 Animations

- `.admin-summary-stagger` на root каждой страницы (`/admin/roadmap`, `/admin/discussions`)
- `animate-admin-fade-in` на новые items при изменении filter
- Pulse у current-phase + pending-journal chips
- Bell-shake у unread-badge
- Anchor highlight 800ms на scroll к `#v0.7.15`

---

## 9. Progress tracker

- [x] **7.0** MCP setup — config + smoke test
- [x] **7.0b** Restart Claude Code → verify `mcp__supabase__*` доступны (2026-06-01: `list_tables` вернул 6 таблиц)
- [x] **7.1** Data model + Migration tags (типы + 110 tag + 46 idea status + Phase 7 current; tsc clean)
- [x] **7.2** Hero block (Status/What's new/Current focus + Quick-links + ✨Свежее; `relativeTime.ts` + `RoadmapTagChip`; 15 тестов)
- [x] **7.3** Timeline (лента по дням, tag-чипы §8.2, anchor `#v0.7.15` + copy + подсветка 800ms, «Показать ещё»; глобальный мерж версий; `roadmapTimeline.ts`; 10 тестов)
- [x] **7.4** Search/filter (sticky-бар, `?q=` debounce 250ms по changes+plainBullets, tag-чипы `?tag=`, range `?from=&to=` через from/to-селекты, reset, счётчик, авто-раскрытие, empty-state; `roadmapFilter.ts`; 12 тестов)
- [x] **7.5** 2-col Plan+Ideas (xl 2 колонки; План MVP с current-glow/«Сейчас», Идеи со status-чипами §8.3, кликабельные shipped→anchor/discussion; `roadmapIdeaStatusMeta.ts`; 7 тестов)
- [x] **7.6** Footer stats + sparkline (релизы 7д/30д/всего, идеи по статусам, discussions-заглушка, Recharts sparkline скорости 12нед → Timeline; `roadmapStats.ts`; 6 тестов)
- [x] **7.7** Reminder 24h (amber/red баннер по ритму релизов под Hero; порог 24/48/72ч в localStorage, snooze «на сегодня», weekend-skip, paused-bypass; `releaseCadence.ts`; 13 тестов)
- [x] **7.8** Discussions backend (миграции 008–011 применены на Supabase: `admin_discussions`/`_replies`/`_read`/`_subscribers` + RLS admin/beta + триггер reply_count; Edge `admin-discussions` (10 actions) задеплоена ACTIVE; security-advisors чисто. ⚠️ MCP `execute_sql` недоступен (`crypto is not defined`) — live insert/trigger проверим из UI в 7.9)
- [ ] **7.9** Discussions UI
- [ ] **7.10** Notifications (push + badge)
- [ ] **7.11** Sync workflow
- [ ] **7.12** A11y + mobile + perf

---

## 10. Open questions для resolution в процессе

- [ ] Notification rate-limiting: сколько push'ей в час максимум для admin'а?
- [ ] Mobile Discussions UX: длинные replies — full-screen modal или scroll внутри?
- [ ] Search index: full-text search через Supabase functions (`ts_query`) или client-side fuzzy?
- [ ] Markdown sanitization: какой allowlist? Code blocks? Tables? Images?
- [ ] Sparkline data: brute force на каждом render или materialized aggregate?

---

## 11. Не входит в Phase 7 (явно отложено)

- VAPID push для **end-users** (Phase 8+, см. [[03-Scope-MVP-и-бэклог]])
- Перенос `RELEASE_NOTES_BLOCKS` из code в Supabase (Variant Z, Phase 8 кандидат)
- Перенос `IDEAS_LATER_ENTRIES` в Supabase (Variant W, Phase 8 кандидат)
- Auto-mirror Discussions → markdown (Variant B1-strict, если нужно потом)
- Public changelog для не-логин пользователей

---

## 12. Связанные документы

- [[19-Business-требования#BR-D-004]] — Iteration 1 verdict (с anti-фичами, потом override'нутыми)
- [[19-Business-требования#BR-D-005]] — Owner override + финальный scope (источник истины)
- [[12-Журнал-решений]] — куда переносить resolved discussions (sync workflow)
- [[17-План-реализации-MVP]] — MVP Phase 7 общий план (это под-направление)
- [[18-CI-workflow-и-инструменты]] — workflow-скрипты (`feature-with-qa`, `qa-coverage-review`) для каждой sub-фазы
- [[../CLAUDE.md]] — правила версионирования, тегов, обновления roadmap

---

## 13. Как продолжить в новой сессии Claude Code

1. Прочитай этот файл целиком (`Read` обязательно).
2. Прочитай [[19-Business-требования#BR-D-005]] для контекста решений.
3. Проверь что MCP supabase работает: `mcp__supabase__list_tables`. Если нет — `cp /root/.claude.json.bak-pre-supabase-mcp /root/.claude.json` и restart.
4. Найди следующую `[ ]` строку в §9 Progress tracker.
5. Открой эту sub-фазу в §7 — там детальная спецификация и acceptance criteria.
6. Запусти `Workflow` с `scripts/workflows/feature-with-qa.js` для этой sub-фазы (см. [[../CLAUDE.md]]).
