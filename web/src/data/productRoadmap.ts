/**
 * Контент модалки «Краткая сводка»: дорожная карта, changelog по датам, идеи, открытые вопросы.
 *
 * Жёсткое правило репозитория: перед **любым** коммитом обновлять этот файл и `web/README.md`
 * (см. `.cursor/rules/pre-commit-docs-roadmap.mdc` и скилл `.cursor/skills/pre-commit-docs-roadmap/SKILL.md`). Релиз-ноты — **`RELEASE_NOTES_BLOCKS`**:
 * `dateLabel` = **фактический календарный день коммита(ов)** с этой правкой в репозиторий (сверка с `git log`), не «завтра» в смысле IDE и не желаемая дата выката; новый день — новый блок с `dateLabel`; за день несколько выпусков —
 * несколько элементов **`items`** (или несколько блоков с одной датой — UI склеит); в одном выпуске несколько правок — массив **`changes`**;
 * суть простым языком — **`plainBullets`** (в UI под раскрывашкой). По календарю строки не скрываются.
 */

export type LocalizedString = { ru: string; en: string }

/** Одна фаза MVP (реализованные и плановые используют одну форму). */
export type RoadmapMvpPhase = {
  id: number
  title: LocalizedString
  summary: LocalizedString
  /** Опционально: то же простым языком (как в релиз-нотах). */
  plain?: LocalizedString
  detailBullets: LocalizedString[]
}

/** Порядок тематических групп в блоке «Идеи на потом» (см. локали `settings.roadmapIdeaGroup*`). */
export const ROADMAP_IDEAS_LATER_GROUP_ORDER = [
  'postmvp_intro',
  'everyday_core',
  'collaboration_integrations',
  'reliability_accounts',
  'surface_ai_fun',
] as const

export type RoadmapIdeaLaterGroupId = (typeof ROADMAP_IDEAS_LATER_GROUP_ORDER)[number]

/** Идея после MVP: заголовок + кратко + список под раскрывашкой */
export type RoadmapIdeaEntry = {
  title: LocalizedString
  summary: LocalizedString
  detailBullets?: LocalizedString[]
  /** Тематическая группа; по умолчанию при сборке UI — `everyday_core`. */
  ideaLaterGroup?: RoadmapIdeaLaterGroupId
  /** Порядок внутри группы (меньше — выше). По умолчанию `500`. */
  ideaLaterOrder?: number
}

/**
 * Один выпуск за календарный день (отдельный блок в UI под датой): список правок +
 * опционально пояснения простым языком под раскрывашкой «Подробности простым языком».
 */
export type RoadmapReleaseNoteItem = {
  /** Версия приложения (`package.json` на момент выпуска), в которой вышли перечисленные изменения; без суффикса +git. */
  releasedInVersion: LocalizedString
  /** Пункты изменений (технические допустимы); несколько правок — несколько элементов массива. */
  changes: LocalizedString[]
  /** Суть для пользователя без погружения в код; в модалке — отдельная раскрывашка. */
  plainBullets?: LocalizedString[]
}

/** Одна календарная дата: один заголовок-раскрывашка в UI; несколько объектов с одной датой склеиваются в один день. */
export type RoadmapReleaseNoteBlock = {
  dateLabel: LocalizedString
  items: RoadmapReleaseNoteItem[]
}

/**
 * Фазы 0–6 по плану MVP — **уже в сборке** (фаза 6: ритуал EOD, отчётный стрик, **DR-004**
 * и анимации мини-карточки). Номера совпадают с `obsidian-motivator/17-План-реализации-MVP.md`.
 */
export const IMPLEMENTED_MVP_PHASES: RoadmapMvpPhase[] = [
  {
    id: 0,
    title: { ru: 'Фундамент', en: 'Foundation' },
    summary: {
      ru: 'Схема vault, миграции, клиентское шифрование, Web+PWA, базовая локализация — в прод-сборке.',
      en: 'Vault schema, migrations, client encryption, Web+PWA, baseline i18n — shipped.',
    },
    detailBullets: [
      {
        ru: 'Целевая схема vault: план/backlog, слоты, оценка, повторы, приоритеты 1–5, чек-лист, группы, черновики создания.',
        en: 'Target vault schema: plan/backlog, slots, estimate, repeats, priorities 1–5, checklist, groups, create drafts.',
      },
      {
        ru: 'Цепочка миграций на клиенте; при необходимости таблица соответствия полей для старых данных.',
        en: 'Client-side migration chain; field mapping for legacy data when needed.',
      },
      {
        ru: 'Клиентское шифрование (DR-005/006), паритет с VAULT_CRYPTO_CONTRACT; debounced синхронизация ciphertext с Supabase.',
        en: 'Client-side crypto (DR-005/006), VAULT_CRYPTO_CONTRACT parity; debounced ciphertext sync with Supabase.',
      },
      {
        ru: 'Сборка Web + PWA (manifest, service worker, push в **`src/sw.ts`**); i18next ru/en, переключатель в настройках, ключ в localStorage; Web Push — режимы в vault и таблицы в Supabase (см. README).',
        en: 'Web + PWA (manifest, SW, push in **`src/sw.ts`**); i18next ru/en, settings toggle, localStorage key; Web Push modes in vault + Supabase tables (see README).',
      },
      {
        ru: 'Главная до входа (**`/`**): вход без отдельной плашки со ссылкой на документацию (`HomePage`).',
        en: 'Pre-auth home (**`/`**): sign-in without an extra documentation strip (`HomePage`).',
      },
    ],
  },
  {
    id: 1,
    title: { ru: 'Ядро задачи и «День»', en: 'Core task & Day' },
    summary: {
      ru: 'День и бэклог, сущность задачи, приоритеты, оценка, время, черновики, модалки создания и редактирования.',
      en: 'Day & backlog, task entity, priorities, estimate, time, drafts, create/edit modals.',
    },
    detailBullets: [
      {
        ru: 'Разделение просмотра (мини-карточка) и редактирования (модалка); палитра цвета, HEX и пипетка.',
        en: 'Browse (mini card) vs edit (modal); color palette, HEX and eyedropper.',
      },
      {
        ru: 'Чек-лист «план работы»: новые пункты в конец; отметки на мини-карточке дня и бэклога.',
        en: 'Work checklist: new items append; toggles on day/backlog mini cards.',
      },
      {
        ru: 'Чек-лист: **отметки «выполнено» по пунктам** — только в календарный **сегодня** (как главная галочка на `/app`); проверка в **`applyToggleChecklistItem`** (`@motivator/core`) и в UI (**`TaskMiniCard`**, **`TaskEditModal`**). Добавление/удаление строк чек-листа в модалке — при праве редактирования и **не** привязано к «сегодня».',
        en: 'Checklist: **per-item done toggles** only on calendar **today** (same rule as the main task checkbox on `/app`); enforced in **`applyToggleChecklistItem`** (`@motivator/core`) and UI (**`TaskMiniCard`**, **`TaskEditModal`**). Adding/removing checklist rows in the modal stays allowed whenever the vault is editable — **not** tied to “today.”',
      },
      {
        ru: 'Чек-лист и кольцо/строка плана: **«все пункты чек-листа, но без главной галочки дня»** не считается полностью закрытой — вклад в доли **ограничен** (до **0,99** слота задачи), пока не выполнено **`isPlannedTaskFullyCompleteForDay`** (`@motivator/core`).',
        en: 'Checklist vs ring/plan row: **all checklist items checked without the main day-done flag** is **not** fully closed — the fractional share is **capped** (up to **0.99** of one task slot) until **`isPlannedTaskFullyCompleteForDay`** (`@motivator/core`).',
      },
      {
        ru: 'Приоритеты 1–5 с названиями в vault; оценка часы+минуты; время начала XOR окончания (или без времени); пересечение слотов с подтверждением.',
        en: 'Priorities 1–5 with vault labels; estimate h+m; start XOR end time (or none); slot overlap confirmation.',
      },
      {
        ru: 'Модалка создания: янтарная подсказка «чтобы сохранить» после **первой** попытки «Сохранить» — **единственный** вывод списка ошибок на этом шаге (без дублирующей красной строки под списком); **группа** — в «Дополнительные настройки»; правило оценки: для задачи **в плане на день** оценка обязательна и должна быть **корректной**; для **бэклога** оценка не обязательна, но некорректный ввод всё равно блокирует сохранение; форма не сбрасывается при смене дня/фильтра группы, пока окно открыто.',
        en: 'Create modal: amber “to save” checklist after the **first** Save attempt — **only** error surface for that step (no duplicate red line below); **group** under Additional settings; estimate: **required and valid** for a **planned-day** task; **backlog** — estimate optional, invalid input still blocks save; form persists when changing day/group filter while open.',
      },
      {
        ru: 'Модалки создания и редактирования: между блоками формы **`gap-4`**; секция «Дата и бэклог» — **`flex`** / **`gap-3`**; **липкий подвал** с динамическим списком недостающего и прокруткой к полям; середина **`CreateTaskModal`** — **`overflow-y-auto`** / **`min-h-0`** в flex-цепочке; выбор цвета — единая типографика (**`TaskColorAccordion`**).',
        en: 'Create/edit modals: **`gap-4`** between blocks; «Date & backlog» — **`flex`** / **`gap-3`**; **sticky footer** with a dynamic missing-field list and scroll-to-field; **`CreateTaskModal`** mid section scrolls (**`overflow-y-auto`** / **`min-h-0`** in the flex chain); color labels use consistent typography (**`TaskColorAccordion`**).',
      },
      {
        ru: 'Черновики в vault; на `/app` **бейдж** со счётчиком на кнопке **«Фильтры»** только при **наличии** черновиков; по тапу на бейдж — модалка списка.',
        en: 'Vault drafts; on `/app` a **badge** on **Filters** only when drafts **exist**; tap the badge to open the list modal.',
      },
      {
        ru: 'Вкладка «День» и периоды: кольцо прогресса — знаменатель = число задач в плане; **`tasksScheduledForPlannerDay`** / **`plannedPeriodProgress`**; чек-лист даёт долю внутри задачи; **процент выполнения** отображается **внутри** SVG-кольца (без отдельной строки под диаграммой); EOD — те же доли; списки EOD — **`tasksPlannedForLocalDay`**.',
        en: 'Day & periods: ring denominator = planned tasks; **`tasksScheduledForPlannerDay`** / **`plannedPeriodProgress`**; checklist shares inside a task; **completion percent** is **inside** the SVG ring (no separate line below); EOD uses same fractions; EOD lists — **`tasksPlannedForLocalDay`**.',
      },
      {
        ru: 'Подпись под кольцом «План на день»: только **процент** (без второй строки про доли задач).',
        en: 'Caption under the day plan ring: **percent only** (no extra fractional task line).',
      },
      {
        ru: 'Список **плана на день** (не бэклог): мягкий фон строки — **зелёный** при полном выполнении по долям дня; **янтарный**, если дата уже в **`eodCompletedLocalDates`** (ручной ритуал или **`autoCloseAtDayEnd`**), а план не закрыт полностью; для **прошлых** дней тона темнее.',
        en: '**Planned-for-day** list (not backlog): soft row tint — **green** when fully complete; **amber** when the date is in **`eodCompletedLocalDates`** (ritual or **`autoCloseAtDayEnd`**) but work remains; **darker** on past days.',
      },
      {
        ru: 'Шапка **`/app`:** иконка синхронизации визуально слабее рядом с меню аккаунта; меню — отчёты, переход к ритуалу EOD на вкладке «День», настройки, выход; при ошибке загрузки vault с сервера — понятный текст и кнопка **«Повторить»**.',
        en: '`/app` header: quieter sync icon next to account; menu — reports, EOD entry on Day tab, settings, sign out; remote vault load errors — friendly copy and **Retry**.',
      },
      {
        ru: 'Вкладка «День»: при просмотре **календарного сегодня** — кнопка **«Завершить день»** или **«Отчёт за сегодня»** на одной строке с созданием задачи; при выборе **прошлой** даты — **«Отчёт за день»** (модалка **`EndOfDayModal`**, только просмотр, без завершения ритуала). Для **будущей** даты кнопка не показывается.',
        en: 'Day tab: on **calendar today**, **End day** / **Today’s report** next to create task; for a **past** day, **Day report** opens **`EndOfDayModal`** read-only (no ritual completion). **Future** days hide the button.',
      },
      {
        ru: '**`TaskEditModal`** на мобильном WebKit: оверлей через **`createPortal` → `document.body`**, блокировка прокрутки **`body`** — касания не проходят сквозь модалку.',
        en: '**`TaskEditModal`** on mobile WebKit: overlay via **`createPortal` → `document.body`**, **`body`** scroll lock — touches do not pass through.',
      },
      {
        ru: 'Настройки: названия приоритетов, CRUD групп, смена пароля Supabase. TaskEditModal — те же правила, что при создании (`taskScheduleValidation`).',
        en: 'Settings: priority labels, group CRUD, Supabase password change. TaskEditModal — same rules as create.',
      },
    ],
  },
  {
    id: 2,
    title: { ru: 'Неделя (таймблокинг)', en: 'Week (timeblocking)' },
    summary: {
      ru: 'Сетка дни × часы, задачи в слотах, предупреждение о пересечениях; полоска цвета и время на сетке.',
      en: 'Day×hour grid, tasks in slots, overlap warning; color stripe and time on grid.',
    },
    detailBullets: [
      {
        ru: 'Задачи в реальных слотах по правилам ТЗ (старт + оценка → конец или режим «к времени завершения»).',
        en: 'Tasks in real slots per spec (start + estimate → end or “due time” mode).',
      },
      {
        ru: 'Мягкое предупреждение при пересечении с другой задачей на тот же день.',
        en: 'Soft warning when overlapping another task the same day.',
      },
      {
        ru: 'Блок «Время»: часы и минуты двумя списками вместо нативного time-picker; мини-карточка — время как часы:минуты.',
        en: 'Time block: hour/minute dropdowns; mini card shows clock as hours:minutes.',
      },
      {
        ru: 'Цвет задачи: полоска на мини-карточке и в недельной сетке через опорный HEX палитры (Tailwind не теряет классы из core).',
        en: 'Task color stripe on mini card and week grid via palette hex (Tailwind keeps core-driven colors).',
      },
      {
        ru: 'Кольцо «План недели»: сумма метрик по дням недели до сегодня (`plannedPeriodProgress`); сетка слева, кольцо справа на широком экране; на узком — кольцо выше (`flex-col-reverse`).',
        en: 'Week plan ring: sums per-day metrics through today (`plannedPeriodProgress`); grid left, ring right on wide screens; ring first on narrow (`flex-col-reverse`).',
      },
      {
        ru: 'Рядом с кольцом «Неделя»/«Месяц» — **`PeriodPlanBreakdownChart`** (**Recharts**): столбцы по **группам** или **цветам** (`plannedPeriodSlotsByGroupId` / `plannedPeriodSlotsByColorKey`).',
        en: 'Next to the Week/Month ring — **`PeriodPlanBreakdownChart`** (**Recharts**): bars by **group** or **color** (`plannedPeriodSlotsByGroupId` / `plannedPeriodSlotsByColorKey`).',
      },
      {
        ru: 'Шапка недели — компактная навигация (**иконки**, короткий диапазон дат); корень **`/app`** — **`min-h-dvh`**, колонка контента **`flex-1 min-h-0`**, чтобы сетка и нижняя панель **скроллились** на коротком экране.',
        en: 'Week header — compact nav (**icons**, short date range); **`/app`** root uses **`min-h-dvh`** and the main column **`flex-1 min-h-0`** so the grid + bottom bar **scroll** on short viewports.',
      },
      {
        ru: 'Сетка недели без горизонтальной прокрутки; заголовки и слоты на общих колонках (**subgrid**); вертикальный скролл тёмный (`week-grid-v-scroll`).',
        en: 'Week grid avoids horizontal scrolling; headers and slots share column tracks (**subgrid**); dark vertical scroll (`week-grid-v-scroll`).',
      },
      {
        ru: 'Высота слота часа **`HOUR_HEIGHT_PX` = 42**, контрастнее подписи часов на оси.',
        en: 'Hour slot height **`HOUR_HEIGHT_PX` = 42**, stronger hour labels on the axis.',
      },
    ],
  },
  {
    id: 3,
    title: { ru: 'Месяц, фильтры', en: 'Month & filters' },
    summary: {
      ru: 'Календарь месяца с отметками; фильтры вида и информер при свёрнутой панели.',
      en: 'Month calendar with markers; view filters and informer when panel collapsed.',
    },
    detailBullets: [
      {
        ru: 'Вкладка «Месяц»; фильтры: группа, приоритеты, цвет, повторы (по ТЗ).',
        en: 'Month tab; filters: group, priorities, color, repeats (per spec).',
      },
      {
        ru: 'Информер активных условий фильтрации, когда панель фильтров свернута.',
        en: 'Informer for active filter conditions when the filter panel is collapsed.',
      },
      {
        ru: 'Информер **скрыт**, пока все фильтры в состоянии по умолчанию (все группы, все приоритеты, любой цвет, любые повторы).',
        en: 'Informer stays **hidden** while every filter is at its default (all groups, priorities, color, repeats).',
      },
      {
        ru: 'На узком экране: фильтры — полноэкранная панель; чипы активных условий; кнопка **«Сбросить всё»**. Черновики: **бейдж** на **«Фильтры»** (см. фазу 1).',
        en: 'On narrow screens: filters use a fullscreen sheet; active-condition chips; **Reset all**. Drafts: **badge** on **Filters** (see phase 1).',
      },
      {
        ru: 'Кольцо «План месяца»: те же правила по дням месяца до сегодня; календарь и кольцо в контейнере `max-w-5xl` по центру; скрывается без задач в плане в охвате.',
        en: 'Month plan ring: same rules for month days through today; calendar + ring in a centered `max-w-5xl` container; hidden when no planned tasks in scope.',
      },
    ],
  },
  {
    id: 4,
    title: { ru: 'Повторы', en: 'Recurrence' },
    summary: {
      ru: 'Типы повторов из ТЗ, якорь серии, отметки по вхождениям, DR-008 для отчётов.',
      en: 'Spec recurrence types, series anchor, per-occurrence marks, DR-008 for reports.',
    },
    detailBullets: [
      {
        ru: 'Каждый день / каждые N дней / дни недели; отметки выполнения по вхождениям; идентификатор серии для отчётов.',
        en: 'Daily / every N days / weekdays; per-occurrence completions; series id for reporting.',
      },
    ],
  },
  {
    id: 5,
    title: { ru: 'Отчёты на клиенте', en: 'Client-side reports' },
    summary: {
      ru: 'Страница `/app/reports`: аналитика после расшифровки (DR-007), KPI и диаграммы; «часто проваленные» (DR-008). Стрик DR-013 в полном виде — с учётом дат End-of-Day (`eodCompletedLocalDates`, фаза 6).',
      en: '`/app/reports`: analytics after decrypt (DR-007), KPI and charts; often-missed (DR-008). DR-013 streak uses End-of-Day completion dates (`eodCompletedLocalDates`, phase 6).',
    },
    detailBullets: [
      {
        ru: 'Окно 7 / 30 календарных дней; столбчатая диаграмма по дням; расчёты в `@motivator/core` (`vaultAnalytics`).',
        en: '7 / 30-day windows; bar chart by day; logic in `@motivator/core` (`vaultAnalytics`).',
      },
      {
        ru: 'Таблицы часто проваленных: повторы по серии и разовые задачи в окне; KPI стрика DR-013 — полный расчёт после отметки ритуала EOD за день.',
        en: 'Often-missed tables: repeats by series and one-off tasks in window; DR-013 streak KPI — full calculation after marking the EOD ritual for the day.',
      },
      {
        ru: 'Дальнейшие улучшения тяжёлых расчётов (worker/батчи) — в плане вместе с стабилизацией отчётов.',
        en: 'Heavy-math improvements (worker/batches) — tracked with reports hardening in the plan.',
      },
      {
        ru: 'Иконки подсказок у KPI, гистограммы и таблиц: при наведении краткое описание метрик (нативный `title`).',
        en: 'Hint icons on KPIs, histogram, and tables: hover shows short metric explanations (native `title`).',
      },
    ],
  },
  {
    id: 6,
    title: { ru: 'EOD, DR-004 и анимации', en: 'EOD, DR-004 & motion' },
    summary: {
      ru: 'Ритуал End-of-Day (vault **v6+**, `eodCompletedLocalDates`, `eodPreferences`), стрик DR-013 с датами завершения дня; **DR-004** — двойное подтверждение «сделано» (vault **v7**), таймеры по умолчанию (+10 / +30 мин), периодический сброс просрочки на клиенте; на мини-карточке — ожидание второго шага, отмена, короткие анимации успеха и мягкого «не засчитано».',
      en: 'End-of-Day ritual (vault **v6+**, `eodCompletedLocalDates`, `eodPreferences`), DR-013 streak with finished-day marks; **DR-004** — double confirmation for “done” (vault **v7**), default timers (+10 / +30 min), client-side expiry sweep; mini card shows second-step wait, cancel, brief success vs gentle-miss motion.',
    },
    detailBullets: [
      {
        ru: 'Глобальный вкл/выкл кнопки EOD в настройках; запись локальной даты завершения ритуала; опция **`autoCloseAtDayEnd`** — прошлые дни с планом без ритуала.',
        en: 'Global EOD button toggle in settings; local ritual completion dates; **`autoCloseAtDayEnd`** — past planner days without the ritual.',
      },
      {
        ru: 'Связка с отчётами (фаза 5): стрик DR-013 использует даты EOD.',
        en: 'Tied to reports (phase 5): DR-013 streak uses EOD dates.',
      },
      {
        ru: 'DR-004: создание и редактирование задачи, второй клик по чекбоксу в пределах окна; истечение без ответа снимает ожидание без записи выполнения.',
        en: 'DR-004: create/edit task; second checkbox tap within the window; expiry without response clears pending without recording completion.',
      },
      {
        ru: 'Роли **`user` / `beta_tester` / `admin`**: для **admin** — раздел **«Доступы»** в админ-панели (`/admin/access`, Edge **`admin-motivator-roles`**); **`SessionSyncInformer`**, если роль в JWT изменилась на сервере. Режим **custom** (права помимо ролей) — в идеях после MVP.',
        en: '**`user` / `beta_tester` / `admin`**: **Access** in the admin panel (`/admin/access`, Edge **`admin-motivator-roles`**); **`SessionSyncInformer`** when the JWT role changed server-side. **Custom** per-feature access — post-MVP ideas.',
      },
      {
        ru: 'Модалка **«Завершение дня»**: блоки только по **плану на календарный день**; бэклог — отдельное мягкое напоминание; заголовок для локали **ru** на русском; круговая диаграмма доли закрытых задач по плану; продуктовые **«Открытые вопросы»** ведутся в модалке **«Краткая сводка»** (открытие с **`/app`**, меню аккаунта), строки — в i18n.',
        en: '**End-of-day** modal: **planned-for-day** tasks only; backlog FYI strip; **ru** title localized; donut chart for share of planned tasks closed; **Open questions** product notes live in **Brief summary** (opened from **`/app`** account menu; i18n strings).',
      },
    ],
  },
]

/**
 * Релиз-ноты для тестеров без GitHub.
 * Правило: **`dateLabel` = календарный день, когда правки вошли в коммит(ы)** в этот репозиторий (`YYYY-MM-DD`), в **той таймзоне, в которой команда считает «день работы»** (практически — локальная дата автора на момент коммита; при сомнении сверять с **`git log`**, не с «ожидаемым завтра» и не только с «Today» в IDE). **Не** ставить дату **позже** фактического дня коммита и **не** подменять её желаемой датой выката.
 * В модалке секции сортируются по дате **по убыванию** (более поздний календарный день **выше**); свежие записи должны иметь **`dateLabel` не меньше**, чем у более старых выпусков. Новый день без блока — добавить
 * объект с `dateLabel` (обычно **в начало массива**, чтобы новее было выше в файле). За один день несколько
 * деплоев — несколько элементов **`items`** подряд в одном блоке **или** несколько блоков с **одинаковой** `dateLabel` подряд (в UI день склеивается). Один выпуск: несколько правок — **`changes`**[];
 * пояснение «для людей» — **`plainBullets`**. У каждого элемента **`releasedInVersion`** — semver выпуска,
 * в котором изменения попали в сборку (как в `package.json` до `vite build`, без `+git`). В модалке внутри одного дня подблоки сортируются по **убыванию** этого semver. Интерфейс не скрывает даты по календарю «сегодня».
 */
export const RELEASE_NOTES_BLOCKS: RoadmapReleaseNoteBlock[] = [
  {
    dateLabel: { ru: '2026-05-26', en: '2026-05-26' },
    items: [
      {
        releasedInVersion: { ru: '0.7.3', en: '0.7.3' },
        changes: [
          {
            ru: '**Админ-панель → Тестирование** (`/admin/testing`): для **admin** и **beta_tester** — подмена «сейчас» (дата и время в **localStorage**); влияет на планировщик, EOD, просрочку и отчёты. У **beta_tester** в sidebar админки только **Тестирование**; у **admin** — полный набор + тестирование.',
            en: '**Admin panel → Testing** (`/admin/testing`): **admin** and **beta_tester** can override “now” (date/time in **localStorage**); affects planner, EOD, overdue rules, and reports. **Beta_tester** admin sidebar shows **Testing** only; **admin** keeps full admin nav plus testing.',
          },
          {
            ru: '**Shell / FAB:** footer аккаунта — **меню** с выходом (не мгновенный sign-out по клику); mobile **FAB «+»** — правый нижний угол, бейдж черновиков **в углу** кнопки; FAB дефекта на `/app` сдвинут левее, чтобы не перекрывать «+».',
            en: '**Shell / FAB:** account footer — **menu** with sign out (no instant logout on block click); mobile **“+” FAB** — bottom-right corner, draft badge **on the button corner**; defect FAB on `/app` offset left of “+”.',
          },
        ],
        plainBullets: [
          {
            ru: 'В «Тестирование» можно выставить вчерашний день и проверить отчёты и «Сегодня» в планировщике — без смены часов на телефоне.',
            en: 'In **Testing**, set yesterday’s date and check reports and planner “Today” without changing the device clock.',
          },
          {
            ru: 'Пока подмена включена, сверху страниц — жёлтый баннер с выбранным «сейчас».',
            en: 'While override is on, a banner at the top shows the simulated “now”.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-24', en: '2026-05-24' },
    items: [
      {
        releasedInVersion: { ru: '0.7.3', en: '0.7.3' },
        changes: [
          {
            ru: '**Планировщик — полировка UX:** виджет **End of Day** открывает ритуал/отчёт (кнопки EOD убраны из toolbar); **FAB «+»** на всех вкладках — на desktop компактный у правого края, черновики на бейдже; чекбоксы задач — **`motivator-checkbox`**; фильтры — отступы и сетка; неделя/месяц — «Закрыто по плану» вместо дубля %; отчёты — тонкий горизонтальный скролл графика.',
            en: '**Planner UX polish:** **End of Day** stat tile opens ritual/report (EOD toolbar buttons removed); **“+” FAB** on all tabs — compact on desktop at the right edge, drafts on badge; task checkboxes — **`motivator-checkbox`**; filters — padding and grid; week/month — “Plan completed” instead of duplicate %; reports — slim horizontal chart scrollbar.',
          },
          {
            ru: '**Shell Design 2.0:** vault/plan в шапке (**`ShellVaultPlanButton`**), аккаунт в footer sidebar (**`ShellAccountFooter`**); admin sub-menu на dashboard/settings; AI-панель docked на desktop (resizable), overlay на mobile.',
            en: '**Shell Design 2.0:** vault/plan in header (**`ShellVaultPlanButton`**), account in sidebar footer (**`ShellAccountFooter`**); admin sub-menu on dashboard/settings; AI panel docked on desktop (resizable), overlay on mobile.',
          },
          {
            ru: '**QA прогон 20 — low fixes:** обратная связь по умолчанию (GitHub Issues); clamp title в «Завести дефект»; EOD без rank-шума; закрытие create task без лишнего диалога; «Краткая сводка» в Настройках → Общие.',
            en: '**QA run 20 — low fixes:** default feedback (GitHub Issues); defect title clamp; cleaner EOD lists; create-task close without spurious confirm; Brief summary in Settings → General.',
          },
          {
            ru: '**Design 2.0 — этап 8 (a11y):** focus trap и возврат фокуса в модалках; `aria-label` на close create/edit; `aria-live` sync и фильтры; spot-check контраста токенов.',
            en: '**Design 2.0 — stage 8 (a11y):** focus trap and focus restore in modals; `aria-label` on create/edit close; `aria-live` for sync and filters; token contrast spot-check.',
          },
          {
            ru: '**Настройки — «Безопасность»:** журнал безопасности перенесён из sidebar-прототипа во вкладку **`/settings#privacy`** (seed + журнал); **`/prototype/security-log`** → **`/settings#security-log`**.',
            en: '**Settings — Security tab:** security log moved from sidebar prototype to **`/settings#privacy`** (seed + log); **`/prototype/security-log`** → **`/settings#security-log`**.',
          },
          {
            ru: '**Design 2.0 — этап 7 (адаптив/PWA):** tap targets ≥44px в shell и toolbar планировщика; safe-area в шапках и filter sheet; manifest **`theme_color` #131315**; `:focus-visible` на кнопках; `prefers-reduced-motion` для pulse/spin.',
            en: '**Design 2.0 — stage 7 (adaptive/PWA):** ≥44px tap targets in shell and planner toolbar; safe-area on headers and filter sheet; manifest **`theme_color` #131315**; `:focus-visible` on buttons; `prefers-reduced-motion` for pulse/spin.',
          },
          {
            ru: '**UX QA (прогон 5):** единая шапка на всех страницах shell — sync с popover и «Повторить», меню аккаунта без дублей навигации; в sidebar — **shield** вместо второго «профиля», Premium с подписью **«Скоро»**; на мобилке кнопка скрытия диаграмм — в ряду с фильтрами и «Завершить день».',
            en: '**UX QA (run 5):** shared shell header on all pages — sync popover with **Retry**, account menu without duplicate nav; sidebar **shield** instead of a second profile icon, Premium labeled **Coming soon**; on mobile, hide-charts control sits in the filters / End day row.',
          },
        ],
        plainBullets: [
          {
            ru: 'Завершить день или открыть отчёт — нажмите на карточку **End of Day** в сводке дня; создать задачу — круглая **«+»** справа (на компьютере меньше, у края экрана).',
            en: 'End the day or open the report from the **End of Day** stat card; create a task with the round **“+”** on the right (smaller on desktop, at the screen edge).',
          },
          {
            ru: 'Галочки у задач выглядят как остальной интерфейс — тёмная рамка, зелёная отметка при выполнении.',
            en: 'Task checkboxes match the dark theme — bordered box, green fill when done.',
          },
          {
            ru: 'Обратная связь в настройках работает без отдельной переменной окружения — по умолчанию открывается форма issue на GitHub.',
            en: 'Feedback in Settings works without a custom env var — by default it opens the GitHub issue form.',
          },
          {
            ru: '«Краткая сводка» (дорожная карта и релиз-ноты) доступна в Настройках → Общие, не только из меню аккаунта на планировщике.',
            en: 'Brief summary (roadmap and release notes) is in Settings → General, not only from the planner account menu.',
          },
          {
            ru: 'Модалки (создание/редактирование задачи, EOD, сводка и др.) удерживают клавиатурный фокус внутри и возвращают его после закрытия.',
            en: 'Modals (create/edit task, EOD, roadmap, etc.) keep keyboard focus inside and restore it when closed.',
          },
          {
            ru: 'На телефоне кнопки в шапке и панели фильтров стали удобнее для нажатия; notch и «челка» учитываются в отступах.',
            en: 'Phone header and filter bar controls are easier to tap; notch safe areas respected in padding.',
          },
          {
            ru: 'Sync и профиль теперь в шапке на Отчётах и Настройках; из меню убраны лишние пункты «Отчёты / Настройки / Завершить день». На телефоне иконка диаграмм больше не растягивается на всю ширину.',
            en: 'Sync and account menu appear in the header on Reports and Settings; duplicate Reports/Settings/End day entries removed. On phone, the charts toggle is a compact icon next to filters.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-23', en: '2026-05-23' },
    items: [
      {
        releasedInVersion: { ru: '0.7.3', en: '0.7.3' },
        changes: [
          {
            ru: '**QA MVP 1.0.0 — критичные фиксы:** восстановлена ширина **`max-w-sm/md/lg`** (login, модалки, onboarding); **«Продолжить черновик → Сохранить»** снова создаёт задачу; **неделя** — ось времени скроллится вместе с колонками; **«Повторить»** при ошибке sync повторяет **upload**, а не перезагрузку vault; push **`?highlightTask=`** — scroll и подсветка карточки; EOD ждёт отправку на сервер; битый seed в localStorage — экран восстановления вместо вечной «Инициализации…».',
            en: '**MVP 1.0.0 QA — critical fixes:** restored **`max-w-sm/md/lg`** widths (login, modals, onboarding); **resume draft → Save** creates the task again; **week** time axis scrolls with day columns; **Retry** after sync failure re-**uploads** local vault instead of re-fetch; push **`?highlightTask=`** scrolls and highlights the card; EOD waits for server sync; malformed localStorage seed shows recovery instead of endless “Initializing encryption…”.',
          },
        ],
        plainBullets: [
          {
            ru: 'Формы и модалки снова нормальной ширины на компьютере; черновик после «Продолжить» не пропадает впустую; клик по push открывает нужную задачу в списке.',
            en: 'Forms and modals are readable width on desktop again; resuming a draft no longer deletes your work; tapping a push notification jumps to the task in the list.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.7.3', en: '0.7.3' },
        changes: [
          {
            ru: '**Design 2.0 — навигация и настройки:** вкладки Stitch на **`/settings`** (`SettingsTabLayout`); прототипы **`/prototype/*`** и **AI-ассистент** (stub) — в sidebar / bottom nav для **admin** / **beta_tester**; глобальная кнопка AI → правая панель; **Настройки** внизу sidebar; hash **`#privacy`** для seed; **`RequireTesterPreview`**.',
            en: '**Design 2.0 — navigation & settings:** Stitch tabs on **`/settings`** (`SettingsTabLayout`); **`/prototype/*`** and **AI assistant** (stub) in sidebar / bottom nav for **admin** / **beta_tester**; global AI button → right panel; **Settings** pinned at sidebar bottom; **`#privacy`** hash for seed; **`RequireTesterPreview`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'Прототипы больше не спрятаны в настройках — они в боковом меню (если у вас роль тестера или админа). AI пока заглушка в выдвижной панели справа.',
            en: 'Prototypes moved out of Settings into the sidebar (tester/admin roles). AI is still a stub in the slide-in panel on the right.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.7.3', en: '0.7.3' },
        changes: [
          {
            ru: '**Design 2.0 — дизайн-система и планировщик:** подключён **Geist**, шкала типографики и **`designClasses`**; **MotivatorShell** — safe-area, крупные зоны нажатия, версия внизу sidebar; **День** — stat-карточки, mobile **FAB «+»**, chips групп на карточках, подсветка **просрочки**; **Неделя** и **Месяц** — stat-ряд, колонка «сегодня», просрочка в сетке/ячейках, подсказка **«скрыто фильтром»**, ширина контента до **1200px**.',
            en: '**Design 2.0 — design system & planner:** **Geist** font, typography scale and **`designClasses`**; **MotivatorShell** — safe-area, larger tap targets, version in sidebar footer; **Day** — stat cards, mobile **FAB “+”**, group chips on cards, **overdue** styling; **Week** and **Month** — stat row, “today” column, overdue in grid/cells, **“hidden by filter”** hint, content width up to **1200px**.',
          },
        ],
        plainBullets: [
          {
            ru: 'На телефоне создать задачу можно круглой кнопкой «+» внизу; на неделе и в месяце видно, что день уже прошёл или задача «висит» после времени слота.',
            en: 'On your phone, use the round “+” button to add a task; on Week and Month you can see past days and tasks that slipped past their time slot.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.7.3', en: '0.7.3' },
        changes: [
          {
            ru: '**Design 2.0 — модалки и вторичные экраны:** единые **`MODAL_*`** и **`ALERT_WARNING_*`** вместо янтарных плашек; обновлены создание/редактирование задачи, EOD, «Краткая сводка», дефект, cookie; вход, онбординг, настройки (seed/vault), баннеры синхронизации; прототипы **`/prototype/*`** на **`rounded-card`**.',
            en: '**Design 2.0 — modals & secondary screens:** shared **`MODAL_*`** and **`ALERT_WARNING_*`** instead of amber callouts; refreshed create/edit task, EOD, Brief summary, defect report, cookie banner; login, onboarding, settings (seed/vault), sync banners; **`/prototype/*`** on **`rounded-card`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'Предупреждения (сеть, seed, подсказки в формах) выглядят одинаково и читаются на тёмном фоне; длинные модалки не упираются в край экрана на телефоне.',
            en: 'Warnings (network, seed backup, form hints) look consistent on the dark theme; tall modals respect the phone safe area.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-22', en: '2026-05-22' },
    items: [
      {
        releasedInVersion: { ru: '0.7.3', en: '0.7.3' },
        changes: [
          {
            ru: '**Админ-панель и shell:** роли — **«Доступы»** (`/admin/access`); **«Краткая сводка»** для admin — `/admin/roadmap`; `/settings#admin` → redirect; вкладка «Администрирование» убрана из **Настроек**. Footer: выход по клику на блок аккаунта. Desktop: **FAB «+»** в строке фильтров; бейдж черновиков **над** «+».',
            en: '**Admin panel & shell:** roles in **Access** (`/admin/access`); admin **Brief summary** at `/admin/roadmap`; `/settings#admin` redirects; **Administration** tab removed from **Settings**. Footer: sign out via account block. Desktop: **“+” FAB** in filters row; draft badge **above** “+”.',
          },
        ],
        plainBullets: [
          {
            ru: 'Роли — в админке «Доступы»; сводка для admin — отдельная страница, для остальных — модалка из «Общих».',
            en: 'Roles under admin **Access**; admins get Brief summary as a page, others — modal from **General**.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.7.3', en: '0.7.3' },
        changes: [
          {
            ru: '**Design 2.0 (ветка `design-2.0`):** единая тёмная тема по Stitch — primary `#4edea3`, шрифты Inter/Geist, карточки и поля **`motivator-*`**; оболочка **`MotivatorShell`** (навигация, план **Free**); обновлены лендинг, вход, онбординг, планировщик (день/неделя/месяц), модалки задач и EOD, настройки, отчёты, «Краткая сводка», дефекты, cookie-баннер; статические прототипы **`/prototype/*`**.',
            en: '**Design 2.0 (`design-2.0` branch):** unified dark Stitch theme — primary `#4edea3`, Inter/Geist, **`motivator-*`** cards and inputs; **`MotivatorShell`** (nav, **Free** tier); refreshed landing, login, onboarding, planner (day/week/month), task & EOD modals, settings, reports, Brief summary, defect flow, cookie banner; static **`/prototype/*`** screens.',
          },
        ],
        plainBullets: [
          {
            ru: 'Интерфейс выглядит как один продукт: меньше «серого zinc», больше фирменного зелёного и читаемых подписей; на телефоне — нижняя навигация, на широком экране — боковая панель.',
            en: 'The UI reads as one product: less generic gray zinc, more brand green and clearer labels; bottom nav on phones, sidebar on wide screens.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-16', en: '2026-05-16' },
    items: [
      {
        releasedInVersion: { ru: '0.7.3', en: '0.7.3' },
        changes: [
          {
            ru: '**Неделя / #60:** вертикальный скролл только у **семи колонок дней** — заголовки и «без времени» остаются на одной сетке с телом, колонки не «уезжают» из‑за полосы прокрутки.',
            en: '**Week / #60:** vertical scroll only on the **seven day columns** — headers and unslotted row stay aligned with the time grid; scrollbar no longer shifts columns.',
          },
          {
            ru: '**Навигация даты / #61:** на **День**, **Неделе** и **Месяце** стрелки **слева и справа** от подписи периода (кнопка «сегодня» / «эта неделя» / «этот месяц» — справа).',
            en: '**Date nav / #61:** on **Day**, **Week**, and **Month**, prev/next arrows sit **on both sides** of the period label (“today” / current week / current month on the right).',
          },
          {
            ru: '**Идеи на потом (сводка):** GitHub **#51–#59** — будильник ОС, конструктор виджетов, день в альбомной ориентации, админ-трекер, слайдеры-факты, «тайм-щит», инфоблоки недели/месяца, режимы команда/наставник, темы оформления.',
            en: '**Ideas for later:** GitHub **#51–#59** — OS alarms, per-view widgets, landscape day timeline, admin tracker, fact carousels, time shield, week/month info blocks, team/mentor modes, themes.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.7.2', en: '0.7.2' },
        changes: [
          {
            ru: '**Vault / #46, #48:** при ошибке **первой** загрузки с сервера **`remoteHydrated`** остаётся **false** (раньше ставился **true** — можно было править без сохранённой строки на сервере); при первом **создании** пустого vault без успешного **upsert** — тоже **false**. Пока гидрация не завершена — **полноэкранный** оверлей с текстом и кнопкой **«Повторить»** при ошибке.',
            en: '**Vault / #46, #48:** on **initial** fetch failure **`remoteHydrated`** stays **false** (it was **true** before — edits could run without a server row); first **empty** vault without successful **upsert** — also **false**. Until hydrate completes — **full-screen** overlay with copy and **Retry** on error.',
          },
          {
            ru: '**Планировщик / #43, #47:** вкладки **День·Неделя·Месяц** — `min-w-0`, компактнее на узком экране; переключатель **диаграмм** — **иконка** + `aria-label` / `title`. **Месяц:** кнопки **группа/цвет** под **столбчатой** диаграммой (как на неделе).',
            en: '**Planner / #43, #47:** **Day·Week·Month** tabs — `min-w-0`, tighter on narrow screens; **charts** toggle — **icon** + `aria-label` / `title`. **Month:** **group/color** toggles **below** the **bar** chart (like week).',
          },
          {
            ru: '**Карточка задачи / #45:** пункты чек-листа сдвинуты **правее** (`pl-4` / `md:pl-5`) для читаемости.',
            en: '**Task card / #45:** checklist rows indented **further right** (`pl-4` / `md:pl-5`).',
          },
          {
            ru: '**Идеи на потом:** GitHub **#44** (сетка недели по слотам + метка EOD), **#49** (админ-мониторинг посещений).',
            en: '**Ideas for later:** GitHub **#44** (week grid span + EOD marker), **#49** (admin visit monitoring).',
          },
        ],
        plainBullets: [
          {
            ru: 'Пока «крутится» загрузка vault, весь экран занят пояснением — не нужно искать маленькую иконку синхронизации.',
            en: 'While the vault loads, a full-screen message explains the wait — no need to hunt for the tiny sync icon.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-15', en: '2026-05-15' },
    items: [
      {
        releasedInVersion: { ru: '0.7.1', en: '0.7.1' },
        changes: [
          {
            ru: '**Фаза 7 (7a.1), `0.7.1` (DR-014):** онбординг по наличию vault на сервере (новый — только генерация + подтверждение сохранения seed; возврат — только импорт); восстановление ключа на `/app` без выхода; предупреждение при выходе; сброс пароля аккаунта; согласие на ПД при регистрации; после входа — `/app`.',
            en: '**Phase 7 (7a.1), `0.7.1` (DR-014):** onboarding by remote vault (new users — generate + saved-seed ack; returning — import only); in-app key recovery without sign-out; sign-out seed warning; account password reset; PD consent on register; post-login → `/app`.',
          },
        ],
        plainBullets: [
          {
            ru: 'Новым пользователям больше не предлагают «случайно» сгенерировать новый ключ, если данные уже на сервере; при неверном ключе можно ввести seed прямо в планировщике.',
            en: 'Returning users are not offered a fresh seed when data already exists on the server; if decryption fails you can re-enter the seed in the planner.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.7.0', en: '0.7.0' },
        changes: [
          {
            ru: '**Фаза 7 (7a), `0.7.0`:** `/settings` — резервная копия **seed** (копия, файл, QR, предупреждения DR-006), группы разделов; юридика (заглушки `/legal/*`, cookie-баннер); обратная связь — **`VITE_FEEDBACK_URL`**; подсказка при ошибке расшифровки vault.',
            en: '**Phase 7 (7a), `0.7.0`:** `/settings` — **seed** backup (copy, file, QR, DR-006 warnings), grouped sections; legal placeholders (`/legal/*`, cookie banner); feedback via **`VITE_FEEDBACK_URL`**; decrypt-failure help on planner and settings.',
          },
        ],
        plainBullets: [
          {
            ru: 'В настройках можно сохранить seed вне браузера; политики и cookie — в приложении; удаление аккаунта с восстановлением — в следующей части фазы 7.',
            en: 'Settings let you back up the seed outside the browser; policies and cookies are in-app; account deletion with recovery comes in the next phase 7 slice.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.64', en: '0.6.64' },
        changes: [
          {
            ru: '**План до 1.0.0** (`MVP_PHASES_PLANNED`, `17-План-реализации-MVP.md`): **«Дизайн и адаптивность»** — **фаза 13** (после offline-first, чеклиста, домена и веток); **фаза 12** — **`dev` → `main`** непосредственно перед дизайном; **7–9** — настройки, монетизация, offline-first.',
            en: '**Roadmap to 1.0.0** (`MVP_PHASES_PLANNED`, `17-План-реализации-MVP.md`): **Design & responsiveness** is **phase 13** (after offline-first, checklist, domain, branches); **phase 12** — **`dev` → `main`** right before design; **7–9** — settings, monetization, offline-first.',
          },
        ],
        plainBullets: [
          {
            ru: 'Следующая крупная продуктовая веха по плану — **настройки и аккаунт (фаза 7)**; визуальная полировка и правила недели/месяца — в **конце**, перед `1.0.0`.',
            en: 'The next major product milestone in the plan is **settings & account (phase 7)**; visual polish and week/month rules land **at the end**, before `1.0.0`.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.64', en: '0.6.64' },
        changes: [
          {
            ru: '**Настройки / #39:** смена роли на **обычный пользователь** снова сохраняется — Edge **`admin-motivator-roles`** пишет **`motivator_role: null`** (мерж Supabase не удалял ключ при `delete`); карточки секций и блок ролей на телефоне — в стиле `/app`.',
            en: '**Settings / #39:** demoting to **regular user** persists again — Edge **`admin-motivator-roles`** sets **`motivator_role: null`** (Supabase merge kept the key after `delete`); settings section cards and admin roles on phone match `/app` styling.',
          },
        ],
        plainBullets: [
          {
            ru: 'Если в списке пользователей выбрали «обычный пользователь», роль больше не откатывается к бета-тестеру после обновления.',
            en: 'Choosing “regular user” in the admin list no longer snaps back to beta tester after refresh.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.63', en: '0.6.63' },
        changes: [
          {
            ru: '**Доступ из РФ / #37:** в **`web/README.md`** — раздел **«Доступ из РФ (без VPN)»** (таблица контуров Vercel/Supabase, варианты 1–5); при сетевых ошибках на **`/app`** и входе — подсказка про VPN/хостинг (`connectivityHints.ts`, **`app.syncErrorRegionalHint`**, **`login.networkRegionalHint`**).',
            en: '**Access from Russia / #37:** **`web/README.md`** — **“Access from Russia (without VPN)”** (Vercel/Supabase matrix, options 1–5); on network failures on **`/app`** and sign-in — hint about VPN/hosting (`connectivityHints.ts`, **`app.syncErrorRegionalHint`**, **`login.networkRegionalHint`**).',
          },
        ],
        plainBullets: [
          {
            ru: 'Если приложение «не коннектится» из РФ, в интерфейсе видно, что дело может быть в хостинге, а не только в Wi‑Fi; полный обход — отдельный деплой (см. README).',
            en: 'If the app “won’t connect” from Russia, the UI explains hosting may be the cause—not only Wi‑Fi; a full fix needs a separate deploy (see README).',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.62', en: '0.6.62' },
        changes: [
          {
            ru: '**Планировщик / #19–#20:** на мобилке **кольцо и столбчатая диаграмма** делят ширину поровну; **скрытие диаграмм** на всех вкладках (localStorage, кнопка у переключателя вида).',
            en: '**Planner / #19–#20:** on mobile, **ring and bar chart** share width equally; **hide charts** on all tabs (localStorage, toggle near view switcher).',
          },
          {
            ru: '**Редактирование задачи / #29:** у повторов — **убрать из плана на этот день** (`skippedOccurrenceLocalDates`) или **удалить задачу целиком**.',
            en: '**Task edit / #29:** for repeats — **remove from this day’s plan** (`skippedOccurrenceLocalDates`) or **delete entire task**.',
          },
          {
            ru: '**Настройки / #28:** снятие **admin** с себя — **двойное** подтверждение; смена роли **другому** пользователю — одно предупреждение.',
            en: '**Settings / #28:** demoting **your own** admin role — **double** confirm; changing **another** user’s role — single prompt.',
          },
        ],
        plainBullets: [
          {
            ru: 'Диаграммы можно спрятать, если мешают; повторяющуюся задачу можно убрать только с выбранного дня.',
            en: 'You can hide charts if they clutter the view; a recurring task can be removed from one day only.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.61', en: '0.6.61' },
        changes: [
          {
            ru: '**Планировщик `/app` / #21:** переключатель **День · Неделя · Месяц** — **сегментированные вкладки**, не отдельные кнопки.',
            en: '**Planner `/app` / #21:** **Day · Week · Month** switcher uses a **segmented tab** control instead of separate buttons.',
          },
          {
            ru: '**Настройки `/settings` / #22–#26:** явная кнопка **сброса времени EOD push** на 20:30; **флаги** в выборе языка; режим уведомлений — **черновик + «Сохранить»** (кнопка неактивна без изменений); информер **«Сохранение…» / «Сохранено»**; блок QA «завести дефект» убран (есть глобальная кнопка); **пользователи и роли** — карточки на телефоне без горизонтального скролла (#23).',
            en: '**Settings `/settings` / #22–#26:** explicit **EOD push time reset** to 20:30; **flags** in language picker; notification mode **draft + Save** (disabled when unchanged); **Saving… / Saved** status; settings QA defect block removed (global button remains); **users & roles** — **card layout on phone** (#23).',
          },
        ],
        plainBullets: [
          {
            ru: 'Вид дня/недели/месяца читается как вкладки; в настройках понятнее, когда изменения уже на сервере.',
            en: 'Day/week/month reads as tabs; settings make it clearer when changes have synced.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.60', en: '0.6.60' },
        changes: [
          {
            ru: '**«Краткая сводка» / #16, #17:** блок **«Идеи на потом»** — **раскрываемые группы**; в заголовке секции и группы — **число идей**.',
            en: '**Brief summary / #16, #17:** **Ideas for later** — **collapsible thematic groups**; section and group headers show **idea counts**.',
          },
          {
            ru: '**Планировщик `/app` / #18:** панель **фильтров**, **EOD/отчёт** и **создание задачи** — в **одну строку** на узком экране (`flex-nowrap`, компактные кнопки).',
            en: '**Planner `/app` / #18:** **filters**, **EOD/report**, and **create task** toolbar stays on **one row** on narrow screens (`flex-nowrap`, compact buttons).',
          },
        ],
        plainBullets: [
          {
            ru: 'В сводке можно раскрыть одну тему идей и сразу видеть, сколько карточек в группе.',
            en: 'In the brief summary you can expand one idea theme and see how many cards are in that group.',
          },
          {
            ru: 'На телефоне кнопки планировщика не переносятся на вторую строку — при необходимости прокрутка по горизонтали.',
            en: 'On phone, planner action buttons stay on one line — horizontal scroll if needed.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.59', en: '0.6.59' },
        changes: [
          {
            ru: '**Web Push / #31:** расписание срабатываний для **повторяющихся** задач — те же правила, что на вкладке «День» (`taskOccursOnDate` в **`computeScheduledFireRequests`**), а не только `scheduledLocalDate`.',
            en: '**Web Push / #31:** notification schedule for **recurring** tasks now follows the Day tab rules (`taskOccursOnDate` in **`computeScheduledFireRequests`**), not only `scheduledLocalDate`.',
          },
        ],
        plainBullets: [
          {
            ru: 'Если задача с повтором и временем начала стоит в плане на сегодня, push в это время снова попадает в расписание.',
            en: 'Recurring tasks with a start time on today’s plan are included in push scheduling again.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.58', en: '0.6.58' },
        changes: [
          {
            ru: '**Планировщик `/app`, вкладка «День» / #30, #21:** список плана на день сортируется по **времени начала/окончания** слота (`getTaskSlotMinutes`), а не только по приоритету; задачи без времени — после задач со временем.',
            en: '**Planner `/app`, Day tab / #30, #21:** the day plan list sorts by **scheduled start/end** slot time (`getTaskSlotMinutes`), not only priority; tasks without time follow timed tasks.',
          },
        ],
        plainBullets: [
          {
            ru: 'Задачи с временем в плане идут по часам — удобнее ориентироваться в течение дня.',
            en: 'Timed tasks in the day plan appear in clock order — easier to scan your schedule.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-14', en: '2026-05-14' },
    items: [
      {
        releasedInVersion: { ru: '0.6.56', en: '0.6.56' },
        changes: [
          {
            ru: '**«Краткая сводка» / #14:** блок **«Идеи на потом»** — **тематические группы** и порядок внутри (`ideaLaterGroup`, `ideaLaterOrder`, `groupIdeasLaterForDisplay`); подписи групп в **i18n** (`settings.roadmapIdeaGroup_*`); тексты карточек **не** удалялись.',
            en: '**Brief summary / #14:** **Ideas for later** — **thematic groups** and in-group ordering (`ideaLaterGroup`, `ideaLaterOrder`, `groupIdeasLaterForDisplay`); group titles in **i18n** (`settings.roadmapIdeaGroup_*`); idea card copy **unchanged**.',
          },
        ],
        plainBullets: [
          {
            ru: 'Длинный список идей теперь разбит на смысловые секции с заголовками; внутри секции порядок задаётся числом (удобнее планировать после MVP).',
            en: 'The long idea list is split into labeled sections; inside each section, numeric order controls ranking for post-MVP planning.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.55', en: '0.6.55' },
        changes: [
          {
            ru: '**Web Push / #12:** в **hybrid** — **разные** обезличенные тексты для **`task_start`** и **`task_end`**; в **full** — слегка уточнён англ. текст конца окна; новый вид **`eod_reminder`** — **одно** напоминание в локальный день по **`eodPreferences.pushReminderMinutesFromMidnight`** (если ритуал EOD включён, день ещё не в **`eodCompletedLocalDates`**, режим не **`off`**); настройки на **`/settings`** (чекбокс + время); миграция Supabase **`004_notification_fire_kind_eod.sql`**; ядро — **`applySetEodPushReminderMinutes`**, **`computeScheduledFires`**, **`buildPushPayload`**.',
            en: '**Web Push / #12:** **hybrid** — distinct de-identified copy for **`task_start`** vs **`task_end`**; **full** — slightly refined English end-window wording; new **`eod_reminder`** — **one** local-day reminder from **`eodPreferences.pushReminderMinutesFromMidnight`** when EOD is on, today not yet in **`eodCompletedLocalDates`**, mode not **`off`**; **`/settings`** toggle + time; Supabase migration **`004_notification_fire_kind_eod.sql`**; core **`applySetEodPushReminderMinutes`**, **`computeScheduledFires`**, **`buildPushPayload`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'В гибридном режиме уведомление о начале времени задачи и о конце звучит по-разному, при этом название задачи на сервер не уходит.',
            en: 'In hybrid mode, start vs end notifications read differently while the task title never goes to the server.',
          },
          {
            ru: 'Можно включить вечернее напоминание пройти ритуал «завершить день» по push в выбранное локальное время (если уведомления не выключены и в Supabase применена миграция 004).',
            en: 'You can schedule one evening push to nudge the End-of-Day ritual at a local time (notifications not off; apply migration 004 in Supabase).',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.54', en: '0.6.54' },
        changes: [
          {
            ru: '**Планировщик `/app`:** счётчик **черновиков** перенесён с кнопки **«Фильтры»** на кнопку **«Создать задачу»** — открытие списка черновиков по бейджу (**`AppPage`**).',
            en: '**Planner `/app`:** the **drafts** count badge moved from **Filters** to **Create task** — draft list still opens from the badge (**`AppPage`**).',
          },
        ],
        plainBullets: [
          {
            ru: 'Черновики относятся к созданию задачи, а не к фильтрам: бейдж стоит рядом с зелёной кнопкой создания.',
            en: 'Drafts belong to task creation, not filters: the badge sits on the green create button.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.53', en: '0.6.53' },
        changes: [
          {
            ru: '**«Завести дефект»** (`FileDefectModal`): в **зоне скриншотов** при фокусе (**клик** или **Tab**) — **вставка изображения из буфера** (**Ctrl+V** / **⌘V**); те же лимиты (**до 2**, **PNG / JPEG / WebP**, **до 3 МБ**), что у кнопки и drag-and-drop; хелпер **`collectImageFilesFromClipboard`** (`defectClipboardFiles.ts`).',
            en: '**File a defect** (`FileDefectModal`): when the **screenshot drop zone** is focused (**click** or **Tab**), **paste an image from the clipboard** (**Ctrl+V** / **⌘V**); same limits (**2 max**, **PNG / JPEG / WebP**, **3 MB** each) as the file button and drag-and-drop; helper **`collectImageFilesFromClipboard`** (`defectClipboardFiles.ts`).',
          },
        ],
        plainBullets: [
          {
            ru: 'Можно вставить скрин из буфера без сохранения файла на диск: сначала кликните по области скриншотов (или дойдите до неё Tab-ом), затем вставьте.',
            en: 'Paste a screenshot without saving a file first: click the screenshot area (or Tab to it), then paste.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-13', en: '2026-05-13' },
    items: [
      {
        releasedInVersion: { ru: '0.6.52', en: '0.6.52' },
        changes: [
          {
            ru: '**«Завести дефект»** (`FileDefectModal`): после успешной отправки **скрывается** верхняя панель формы (шаблоны, вкладки «форма / предпросмотр»); у **`role="dialog"`** **`aria-labelledby`** ведёт на заголовок успеха (**`…-success-title`**).',
            en: '**File a defect** (`FileDefectModal`): after success, the **form header** (templates, form/preview tabs) is **hidden**; dialog **`aria-labelledby`** targets the **success title** (`…-success-title`).',
          },
          {
            ru: '**Внутреннее:** скилл **`github-defect-workflow`** — в очередь разбора попадают **только открытые** GitHub issue.',
            en: '**Internal:** **`github-defect-workflow`** skill — triage queue is **open** GitHub issues only.',
          },
        ],
        plainBullets: [
          {
            ru: 'На экране «готово» не остаётся старой шапки формы; скринридер слышит заголовок успеха.',
            en: 'The success view drops the old form chrome; assistive tech gets the success line as the dialog label.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.51', en: '0.6.51' },
        changes: [
          {
            ru: '**Планировщик `/app`:** навигация **День** и **Месяц** — та же строка, что **Неделя**: **шевроны** (`PlannerChevronLeft` / `PlannerChevronRight`), **`aria-label`** + **`sr-only`**, ключи **`app.dayPrev`** / **`app.dayNext`**.',
            en: '**Planner `/app`:** **Day** and **Month** period nav matches **Week**: **chevron icon buttons** (`PlannerChevronLeft` / `PlannerChevronRight`), **`aria-label`** + **`sr-only`**, keys **`app.dayPrev`** / **`app.dayNext`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'Стрелки переключения даты или месяца выглядят и ведут себя так же, как на неделе.',
            en: 'Day and month step controls match the week tab for layout and accessibility.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.48', en: '0.6.48' },
        changes: [
          {
            ru: '**Документация Supabase:** в **`web/README.md`** зафиксирован **project ref** **`ntpkveicqetjjvlnfrwc`**, URL API и примеры деплоя Edge через **`npx supabase functions deploy`** (глобальный **`npm install -g supabase`** не поддерживается; PowerShell / Docker — пояснения в README); в **`web/.env.example`** — ссылка на тот же проект; скилл **`github-defect-workflow`** — краткая отсылка.',
            en: '**Supabase docs:** **`web/README.md`** records **project ref** **`ntpkveicqetjjvlnfrwc`**, API URL, and Edge deploy via **`npx supabase functions deploy`** (global **`npm install -g supabase`** is unsupported; PowerShell / Docker notes in README); **`web/.env.example`** points to that project; **`github-defect-workflow`** skill cross-link.',
          },
        ],
        plainBullets: [
          {
            ru: 'Упрощает деплой Edge и настройку окружения без поиска ref в Dashboard.',
            en: 'Makes Edge deploy and env setup easier without hunting the ref in the Dashboard.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.47', en: '0.6.47' },
        changes: [
          {
            ru: '**«Завести дефект»:** поля **Ожидалось** / **Фактически**, подсказки, плейсхолдеры, счётчики символов, превью версии и маршрута; опционально **User-Agent** в issue; Edge **`file-defect`** — в **Environment** добавлены **`motivator_role`** и разбор **`expected`** / **`actual`** / **`userAgent`**.',
            en: '**File a defect:** **Expected** / **Actual** fields, hints, placeholders, character counts, version/route preview; optional **User-Agent** in the issue; Edge **`file-defect`** adds **`motivator_role`** to **Environment** and accepts **`expected`**, **`actual`**, **`userAgent`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'Issue на GitHub получается структурированнее без ручного копирования шаблона; после деплоя Edge — с новыми полями в теле.',
            en: 'GitHub issues are more structured without hand-pasting a template; redeploy the Edge function to apply the new body fields.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.46', en: '0.6.46' },
        changes: [
          {
            ru: '**`/app` — меню аккаунта:** в выпадающем списке сверху показывается **текущая роль** (`motivator_role`, подписи как в **`shell.roleLabel*`**).',
            en: '**`/app` account menu:** the dropdown shows the **current role** at the top (`motivator_role`, same labels as **`shell.roleLabel*`**).',
          },
        ],
        plainBullets: [
          {
            ru: 'Можно сразу увидеть, под какой ролью вы вошли (пользователь, бета-тестер или администратор), не заходя в настройки.',
            en: 'You can see at a glance whether you are signed in as user, beta tester, or admin without opening settings.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-12', en: '2026-05-12' },
    items: [
      {
        releasedInVersion: { ru: '0.6.50', en: '0.6.50' },
        changes: [
          {
            ru: '**README:** чеклист **«Статус внедрения „Завести дефект“»**; явный разбор **`PSSecurityException` / `npx.ps1`** и пример **`cmd /c "npx supabase functions deploy …"`**; команды деплоя Edge в примере с **`cmd /c`** для Windows.',
            en: '**README:** **“File a defect” rollout checklist**; explicit **`PSSecurityException` / `npx.ps1`** note and **`cmd /c "npx supabase functions deploy …"`** example; Edge deploy examples wrapped with **`cmd /c`** for Windows.',
          },
          {
            ru: '**Правила Cursor:** **`documentation-orientation.mdc`** — раздел «Ручная установка и чеклисты настройки»; **`pre-commit-docs-roadmap`** + скилл — чекбокс про фиксацию ручных шагов в README.',
            en: '**Cursor rules:** **`documentation-orientation.mdc`** — “Manual setup and rollout checklists”; **`pre-commit-docs-roadmap`** + skill — checkbox to record manual steps in README.',
          },
        ],
        plainBullets: [
          {
            ru: 'Можно один раз зафиксировать прогресс внедрения и не гонять одни и те же шаги; деплой из PowerShell без смены ExecutionPolicy — через cmd.',
            en: 'Track rollout once and avoid repeating the same steps; deploy from PowerShell without changing ExecutionPolicy via cmd.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.49', en: '0.6.49' },
        changes: [
          {
            ru: '**Vercel:** serverless **`api/defect-attachments-cleanup-cron.js`** (корень репозитория) — прокси на Edge **`defect-attachments-cleanup`** (**`SUPABASE_DEFECT_ATTACHMENTS_CLEANUP_URL`**, **`apikey`** из **`SUPABASE_CRON_ANON_KEY`**, **`Authorization: Bearer <CRON_SECRET>`** на входе и к Edge — секрет на Vercel и в секретах Edge должен **совпадать**); **`web/README.md`** — раздел «Прокси defect-attachments-cleanup», прод-URL, таблица «Возможности».',
            en: '**Vercel:** serverless **`api/defect-attachments-cleanup-cron.js`** at repo root proxies to Edge **`defect-attachments-cleanup`** (**`SUPABASE_DEFECT_ATTACHMENTS_CLEANUP_URL`**, **`apikey`** from **`SUPABASE_CRON_ANON_KEY`**, **`Authorization: Bearer <CRON_SECRET>`** inbound and to Edge — Vercel and Edge secrets must **match**); **`web/README.md`** — «Прокси defect-attachments-cleanup», production URL, capabilities table.',
          },
        ],
        plainBullets: [
          {
            ru: 'Очистку черновиков дефектов можно повесить на тот же домен Vercel, что и минутный push, с одним секретом в планировщике.',
            en: 'Defect draft cleanup can use the same Vercel host as the push tick, with one shared secret in your scheduler.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.48', en: '0.6.48' },
        changes: [
          {
            ru: '**README (cron):** в **`web/README.md`** зафиксирован прод-URL Vercel **`https://planner-tawny-omega.vercel.app/api/send-due-cron`** для минутного тика **`send-due`**; отдельно описан вызов Edge **`defect-attachments-cleanup`** (прямой URL Supabase).',
            en: '**README (cron):** **`web/README.md`** documents production Vercel **`https://planner-tawny-omega.vercel.app/api/send-due-cron`** for **`send-due`**; separate instructions for Edge **`defect-attachments-cleanup`** (direct Supabase URL).',
          },
        ],
        plainBullets: [
          {
            ru: 'Два разных URL для двух задач в документации до появления Vercel-прокси для очистки.',
            en: 'Two URLs for two jobs documented before the optional Vercel cleanup proxy shipped.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.48', en: '0.6.48' },
        changes: [
          {
            ru: '**«Завести дефект»:** плавающая кнопка (**FAB**) на **`/app*`** и **`/settings`** для **admin** / **beta_tester**; единая модалка (**шаблоны**, тип дефекта → метки GitHub, **Markdown-предпросмотр**, аккордеон «Дополнительная информация», до **2** скриншотов в **Supabase Storage** `defect-attachments` с **signed URL** в issue; Edge **`file-defect`** — валидация вложений и меток, **`defect-attachments-cleanup`** — очистка черновиков; миграция **`003_defect_reports`**.',
            en: '**File a defect:** **FAB** on **`/app*`** and **`/settings`** for **admin** / **beta_tester**; one modal (**templates**, defect type → GitHub labels, **Markdown preview**, “Additional info” accordion, up to **2** screenshots in **Supabase Storage** `defect-attachments` with **signed URLs** in the issue; Edge **`file-defect`** — attachment/label validation, **`defect-attachments-cleanup`** for draft cleanup; migration **`003_defect_reports`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'Сообщить о проблеме можно из любого экрана планировщика или настроек; скриншоты не утекют публично — в GitHub попадают только временные ссылки.',
            en: 'Report from planner or settings; screenshots stay private—GitHub only gets time-limited links.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.45', en: '0.6.45' },
        changes: [
          {
            ru: '**Настройки / admin:** блок **«Пользователи и роли»** — список пользователей Supabase Auth, **поиск** по email или UUID, смена **`motivator_role`** (Edge **`admin-motivator-roles`**, JWT + Service Role); после смены **своей** роли — **`refreshSession()`**.',
            en: '**Settings / admin:** **Users & roles** — Supabase Auth user list, **search** by email or UUID, **`motivator_role`** updates (Edge **`admin-motivator-roles`**, JWT + Service Role); after changing **your own** role — **`refreshSession()`**.',
          },
          {
            ru: '**Сессия / роли:** при возврате на вкладку или фокусе окна — **`refreshSession()`**; если **`motivator_role`** в JWT изменился (например админом, пока вкладка была в фоне) — **верхний баннер** с пояснением и кнопкой **«Скрыть»** (`SessionSyncInformer`, i18n **`shell.*`**).',
            en: '**Session / roles:** on tab focus or window focus — **`refreshSession()`**; if **`motivator_role`** in the JWT changed (e.g. by an admin while the tab was backgrounded) — a **top banner** explains the change with **Dismiss** (`SessionSyncInformer`, i18n **`shell.*`**).',
          },
        ],
        plainBullets: [
          {
            ru: 'Первого администратора по-прежнему задают в Supabase вручную; дальше админ может выдавать роли из приложения без SQL.',
            en: 'The first admin is still set in Supabase manually; afterwards admins can assign roles from the app without SQL.',
          },
          {
            ru: 'Не нужно выходить и входить заново: вернитесь на вкладку — приложение само подтянет новую роль и покажет, что поменялось.',
            en: 'You don’t have to sign out and back in: return to the tab and the app refreshes the role and tells you what changed.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.43', en: '0.6.43' },
        changes: [
          {
            ru: '**Vercel (монорепо):** в корневом **`vercel.json`** — **`installCommand`**, **`buildCommand`**, **`outputDirectory`**: **`web/dist`** (и **`$schema`**), чтобы деплой не требовал папки **`dist`** в корне и не падал с *No Output Directory named "dist"* при настройке панели по умолчанию; **`README`** — уточнение в шагах Vercel.',
            en: '**Vercel (monorepo):** root **`vercel.json`** — **`installCommand`**, **`buildCommand`**, **`outputDirectory`**: **`web/dist`** (plus **`$schema`**) so deploys don’t expect a root **`dist`** folder or fail with *No Output Directory named "dist"* when dashboard defaults differ; **`README`** — Vercel steps clarified.',
          },
        ],
        plainBullets: [
          {
            ru: 'Если сборка на Vercel внезапно «не находит» папку вывода — у веб-клиента она лежит в **`web/dist`**, а не в корневом **`dist`**; в репозитории это теперь зафиксировано в конфиге.',
            en: 'If Vercel says it can’t find the output folder — the web app builds to **`web/dist`**, not root **`dist`**; the repo config now pins that path.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.42', en: '0.6.42' },
        changes: [
          {
            ru: '**Уведомления / Vercel Hobby:** из **`vercel.json`** убран блок **`crons`** (минутное расписание на Hobby недоступно или ломает деплой); **`README`** — раздел **«Минутный вызов send-due»**: по умолчанию внешний HTTP-cron (**cron-job.org** и аналоги) на **`/api/send-due-cron`** с **`Authorization: Bearer <CRON_SECRET>`**; на **Pro** можно снова добавить **`crons`** в `vercel.json` самостоятельно.',
            en: '**Notifications / Vercel Hobby:** removed **`crons`** from **`vercel.json`** (minute cron unavailable on Hobby or breaks deploy); **`README`** — “Minute send-due tick” section: default path is external HTTP cron (**cron-job.org** and similar) to **`/api/send-due-cron`** with **`Authorization: Bearer <CRON_SECRET>`**; **Pro** users may re-add **`crons`** to `vercel.json` manually.',
          },
        ],
        plainBullets: [
          {
            ru: 'На бесплатном Vercel нельзя положиться на встроенный «звонок каждую минуту»; в документации описано, как бесплатно подключить внешний cron к тому же адресу — напоминания по расписанию снова доходят без платного тарифа Vercel.',
            en: 'Vercel’s free tier can’t rely on a built-in every-minute ping; the README explains wiring a free external cron to the same URL so scheduled reminders keep working without paying for Vercel Cron.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.41', en: '0.6.41' },
        changes: [
          {
            ru: '**Уведомления / Vercel:** в корне репозитория — serverless **`api/send-due-cron.js`** и **`vercel.json`** с **`crons`** на **`GET /api/send-due-cron`** раз в минуту; переменные **`CRON_SECRET`**, **`SUPABASE_SEND_DUE_URL`**, **`SUPABASE_CRON_ANON_KEY`**; README — раздел **«Минутный вызов send-due на Vercel»** и оговорка про **Hobby vs Pro**.',
            en: '**Notifications / Vercel:** repo root serverless **`api/send-due-cron.js`** + **`vercel.json`** **`crons`** for **`GET /api/send-due-cron`** every minute; env **`CRON_SECRET`**, **`SUPABASE_SEND_DUE_URL`**, **`SUPABASE_CRON_ANON_KEY`**; README — “Vercel minute tick” section and **Hobby vs Pro** note.',
          },
        ],
        plainBullets: [
          {
            ru: 'На **Pro** и выше Vercel может сам дергать URL раз в минуту; на **Hobby** для минутного тика нужен внешний cron (см. выпуск **0.6.42**).',
            en: 'On **Pro** and above, Vercel can hit your URL every minute; on **Hobby**, use an external cron for a minute tick (see release **0.6.42**).',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.39', en: '0.6.39' },
        changes: [
          {
            ru: '**«Идеи на потом»:** раздел **«Тестирование»** и карточка **«Дефекты из приложения»** — **форма «Завести дефект»** с **GitHub Issue** как основным каналом (Edge Function + REST API, токен только на сервере, ссылка на issue в UI); **план этапов** в **`15-Идеи-для-развития.md`**, §14.',
            en: '**Ideas for later:** **Testing** settings + **in-app defects** — **“File a defect”** tied to **GitHub Issues** as the primary sink (Edge Function + REST API, server-only token, issue link in UI); **phase plan** in **`15-Идеи-для-развития.md`**, §14.',
          },
        ],
        plainBullets: [
          {
            ru: 'В дорожной карте расписано: дефект из приложения уходит **в GitHub** через сервер, а не с ключом в браузере; в Obsidian добавлен **пошаговый черновик работ** (продукт → GitHub → Edge → UI → роли → доки).',
            en: 'Roadmap now spells out defects → **GitHub** via the server (no browser token); Obsidian §14 adds a **draft implementation phase list**.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.39', en: '0.6.39' },
        changes: [
          {
            ru: '**Уведомления (Web Push):** vault **`schemaVersion: 8`** — **`notificationPreferences.deliveryMode`**: `off` | `hybrid` | `full`; настройки в **`/settings`**; синхронизация **`notification_fire_requests`** в Supabase (debounce); подписка **`push_subscriptions`**; **`injectManifest`** + **`src/sw.ts`** (push + click); Edge Functions **`send-due`**, **`notifications-test`** (`web/supabase/functions/`); миграция **`002_notifications.sql`**; env **`VITE_VAPID_PUBLIC_KEY`**.',
            en: '**Notifications (Web Push):** vault **`schemaVersion: 8`** — **`notificationPreferences.deliveryMode`**: `off` | `hybrid` | `full`; settings on **`/settings`**; debounced sync of **`notification_fire_requests`** to Supabase; **`push_subscriptions`**; **`injectManifest`** + **`src/sw.ts`** (push + click); Edge Functions **`send-due`**, **`notifications-test`** (`web/supabase/functions/`); migration **`002_notifications.sql`**; env **`VITE_VAPID_PUBLIC_KEY`**.',
          },
          {
            ru: '**Документация:** в **`web/README.md`** — шаг миграции **`002`** в разделе Supabase и чеклист ручной настройки (секреты Edge, деплой функций, cron, переменные Vercel).',
            en: '**Docs:** in **`web/README.md`** — `002` migration step in the Supabase section plus a manual setup checklist (Edge secrets, function deploy, cron, Vercel env vars).',
          },
        ],
        plainBullets: [
          {
            ru: 'Можно выбрать: не слать push; **гибрид** (на сервере только время и тип события, текст в шторке общий); **полный** (на сервер могут попасть названия задач). Расписание считается на устройстве после расшифровки vault.',
            en: 'You can choose: no push; **hybrid** (server gets time and event kind only, generic notification text); **full** (task titles may be stored on the server). The schedule is computed client-side after decrypting the vault.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.38', en: '0.6.38' },
        changes: [
          {
            ru: '**Вкладка «День» / EOD:** при выборе **прошлой** даты в календаре вместо **«Завершить день»** показывается **«Отчёт за день»** — та же модалка **`EndOfDayModal`**, но только просмотр сводки по плану на эту дату (без кнопки завершения ритуала); для **сегодня** поведение без изменений; для **будущей** даты кнопка скрыта. Новые строки i18n: **`app.dayReportNav`**, **`eod.reportTitle`**, **`eod.reportIntro`**, **`eod.reportAlreadyDone`**.',
            en: '**Day tab / EOD:** when a **past** calendar day is selected, **Day report** replaces **End day** — same **`EndOfDayModal`** in read-only mode for that date’s plan summary (no finish-ritual button); **today** unchanged; **future** days hide the button. New i18n: **`app.dayReportNav`**, **`eod.reportTitle`**, **`eod.reportIntro`**, **`eod.reportAlreadyDone`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'Можно открыть «отчёт по дню» для вчера и раньше так же, как сводку за сегодня — без риска случайно «закрыть» прошлый день кнопкой ритуала.',
            en: 'Open the same day-summary modal for yesterday and earlier as you would for today — without accidentally completing a past day via the ritual button.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-11', en: '2026-05-11' },
    items: [
      {
        releasedInVersion: { ru: '0.6.37', en: '0.6.37' },
        changes: [
          {
            ru: '**Сборка (fix):** **`PeriodPlanBreakdownChart`** — в тип **`Props`** добавлен опциональный **`compact`** (в **0.6.36** **`AppPage`** уже передавал проп; без него **`tsc -b`** падал на Vercel).',
            en: '**Build (fix):** **`PeriodPlanBreakdownChart`** — optional **`compact`** on **`Props`** (**`AppPage`** already passed it in **0.6.36**; without it **`tsc -b`** failed on Vercel).',
          },
        ],
        plainBullets: [
          {
            ru: 'Восстановлена согласованность репозитория: недельный график рядом с кольцом снова типизируется вместе с **`compact`**.',
            en: 'Repo consistency restored: the week breakdown chart type-checks again with **`compact`**.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.36', en: '0.6.36' },
        changes: [
          {
            ru: '**«Краткая сводка»:** пункт в **меню аккаунта** на **`/app`** (рядом с переходом в настройки и выходом); отдельная кнопка в шапке **`/settings`** убрана; модалка монтируется в **`AppPage`**.',
            en: '**Brief summary:** item in the **`/app`** **account menu** (next to Settings and Sign out); removed the standalone button from **`/settings`**; modal is mounted from **`AppPage`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'Дорожная карта и релиз-ноты открываются из **планировщика** — иконка пользователя → **«Краткая сводка»**; на странице настроек этой кнопки больше нет.',
            en: 'Open the roadmap and release notes from the **planner**: user icon → **Brief summary**; the settings screen no longer has its own button.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.35', en: '0.6.35' },
        changes: [
          {
            ru: '**PWA / обновления:** явная регистрация SW (`virtual:pwa-register`, **`initPwaServiceWorker`**, **`injectRegister: null`** в `vite.config`); периодический **`registration.update()`** при фокусе окна, **`visibilitychange` → visible** и раз в час; в **`vercel.json`** — **`Cache-Control`** без долгого кэша для **`/sw.js`**, **`/manifest.webmanifest`**, **`/workbox-*.js`**.',
            en: '**PWA / updates:** explicit SW registration (`virtual:pwa-register`, **`initPwaServiceWorker`**, **`injectRegister: null`** in `vite.config`); periodic **`registration.update()`** on window focus, **`visibilitychange` → visible**, and hourly; **`vercel.json`** adds short **`Cache-Control`** for **`/sw.js`**, **`/manifest.webmanifest`**, **`/workbox-*.js`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'После выката новой версии телефон с ярлыком на рабочем столе **чаще сам подтянет обновление**, без ручной очистки данных сайта: приложение само спрашивает сервер о новом service worker, когда вы снова открываете вкладку или окно.',
            en: 'After a deploy, a home-screen install should **pick up updates more reliably** without manually clearing site data: the app asks the server for a new service worker when you return to the tab or window.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.33', en: '0.6.33' },
        changes: [
          {
            ru: '**Релиз-ноты (данные):** блок с **`dateLabel` 2026-05-12** объединён с **2026-05-11** — коммиты с перечисленными ранее под «12 мая» изменениями относились к **11 мая**; отдельный заголовок «12» вводил в заблуждение.',
            en: '**Release notes (data):** the **`dateLabel` 2026-05-12** block is merged into **2026-05-11**—commits for those changes were on **May 11**; a standalone “12” header was misleading.',
          },
        ],
        plainBullets: [
          {
            ru: 'Дата в релиз-нотах — **фактический день работы в git**, не «завтра» и не желаемая дата выката; правило уточнено в комментарии выше и в `.cursor/rules/pre-commit-docs-roadmap.mdc`.',
            en: 'Release-note dates are the **actual repo workday in git**, not “tomorrow” or a hoped ship date; clarified in the comment above and `.cursor/rules/pre-commit-docs-roadmap.mdc`.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.32', en: '0.6.32' },
        changes: [
          {
            ru: '**«Идеи на потом»:** режим **«Напоминание»** — запись без учёта как полноценной задачи (без «долга» по плану, отчётам, стрику); простое **напоминание о чём-либо**; черновик в **`15-Идеи-для-развития.md`**, §17.',
            en: '**Ideas for later:** **“Reminder”** mode — entries that aren’t tracked like full tasks (no plan-debt framing in reports/streak); a simple **nudge about something**; draft in **`15-Идеи-для-развития.md`**, §17.',
          },
        ],
        plainBullets: [
          {
            ru: 'В идеях после релиза — отдельный тип «**напоминание**», чтобы мелочи не превращались в задачи с оценкой и «не закрыто».',
            en: 'Post-release ideas add a **reminder** type so small notes don’t become full tasks with estimates and “not done.”',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.32', en: '0.6.32' },
        changes: [
          {
            ru: '**«Идеи на потом»:** **документация / руководство пользователя** — отдельная страница или раздел справки в приложении или по ссылке (структура, ru/en, без дублирования лендинга); черновик в **`15-Идеи-для-развития.md`**, §16.',
            en: '**Ideas for later:** **in-app docs / user guide** — dedicated help area or public branded page (structure, ru/en, distinct from landing); draft in **`15-Идеи-для-развития.md`**, §16.',
          },
        ],
        plainBullets: [
          {
            ru: 'После релиза планируется **одно место** с понятным текстом: как пользоваться планировщиком, а не только маркетинговая главная.',
            en: 'Post-release backlog now includes a **single place** for plain-language “how to use the planner,” separate from marketing copy.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.32', en: '0.6.32' },
        changes: [
          {
            ru: '**Планировщик / модалки задачи:** **`LocalDatePickerField`** — опция **`minLocalDateKey`**: в календаре **нельзя выбрать** дату **раньше сегодня** (план и якорь повтора); кнопка **«назад по месяцам»** отключена, если предыдущий месяц целиком в прошлом; **«Запланировать на выбранный день»** в **`TaskEditModal`** неактивна для **прошлого** выбранного дня на `/app`; **`CreateTaskModal`** — **`clampPlanDateKey`** при старте формы, снятии бэклога и в **`onChange`**. **Время на сегодня:** **`TaskTimeAccordion`** — **`earliestClockMinutesFromMidnight`** (селекты часов/минут и кламп; тик раз в минуту).',
            en: '**Planner / task modals:** **`LocalDatePickerField`** — **`minLocalDateKey`**: the grid **cannot pick** a date **before today** (planned date & recurrence anchor); **previous month** is disabled when that month is entirely in the past; **“Plan for selected day”** in **`TaskEditModal`** is off when the planner **selected day** is in the past; **`CreateTaskModal`** uses **`clampPlanDateKey`** on form init, leaving backlog, and in **`onChange`**. **Time for today:** **`TaskTimeAccordion`** — **`earliestClockMinutesFromMidnight`** (hour/minute options + clamp; 1-minute tick while open).',
          },
        ],
        plainBullets: [
          {
            ru: 'Нельзя «накликать» прошлую дату в плане и время начала/конца на сегодня раньше «сейчас» — только сегодня и дальше по календарю, время не уходит в прошедшие минуты этого дня.',
            en: 'You can’t pick a past plan date or a start/end time on today before “now”—only today onward on the calendar, and the clock won’t slip into earlier minutes today.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.31', en: '0.6.31' },
        changes: [
          {
            ru: '**`CreateTaskModal`:** после первой попытки **«Сохранить»** блокирующие сообщения только в янтарном списке **«Чтобы сохранить»**; убрана вторая красная строка с тем же смыслом; для плана на день без оценки в списке — **`estimateRequiredWhenPlanned`**.',
            en: '**`CreateTaskModal`:** after the first **Save** attempt, blocking messages appear only in the amber **“To save”** list; removed the duplicate red line; planned day without estimate uses **`estimateRequiredWhenPlanned`** in that list.',
          },
        ],
        plainBullets: [
          {
            ru: 'Ошибки при сохранении новой задачи не повторяются двумя разными абзацами подряд.',
            en: 'Save validation for new tasks is no longer shown twice in two different styles.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.30', en: '0.6.30' },
        changes: [
          {
            ru: '**EOD:** в настройках — **`eodPreferences.autoCloseAtDayEnd`** (автоматически добавлять в `eodCompletedLocalDates` прошлые локальные дни, в которых был план на день); применение в **`VaultProvider`** (`applyAutoCompleteEodForElapsedPlannerDays` в **`@motivator/core`**). **`applySetEodEnabled`** сохраняет второй флаг.',
            en: '**EOD:** settings — **`eodPreferences.autoCloseAtDayEnd`** (auto-append past local planner days to `eodCompletedLocalDates`); applied in **`VaultProvider`** (`applyAutoCompleteEodForElapsedPlannerDays` in **`@motivator/core`**). **`applySetEodEnabled`** preserves the second flag.',
          },
          {
            ru: '**Вкладка «День»**, секция плана: мягкий **фон строки** (`TaskMiniCard.planRowSurfaceClass`) — зелёный при полном выполнении, янтарный при дате в `eodCompletedLocalDates` и неполном плане; для прошлых дней — темнее; бэклог без подсветки.',
            en: '**Day** tab plan section: soft **row background** (`TaskMiniCard.planRowSurfaceClass`) — green when fully complete, amber when the day is in `eodCompletedLocalDates` but work remains; darker on past days; backlog unchanged.',
          },
        ],
        plainBullets: [
          {
            ru: 'Можно включить **автозакрытие дня по календарю**: вчерашний и более ранние дни с задачами в плане сами попадут в «завершённые по EOD», если вы не открывали ритуал. На «Дне» невыполненное после закрытия дня подсвечивается мягким янтарным, выполненное — зелёным.',
            en: 'Optional **auto day close**: past planner days that had tasks get an EOD completion stamp even without opening the ritual. On Day, incomplete work after closure shows soft amber; fully complete rows tint green.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.29', en: '0.6.29' },
        changes: [
          {
            ru: '**«Идеи на потом»:** **страница первичной настройки** при первом входе (мастер после разблокировки vault — язык, приоритеты, EOD, тур); черновик в **`15-Идеи-для-развития.md`**, §15.',
            en: '**Ideas for later:** **first-launch setup** screen (post–vault-unlock wizard — language, priorities, EOD, tab tour); draft in **`15-Идеи-для-развития.md`**, §15.',
          },
        ],
        plainBullets: [
          {
            ru: 'В списке идей после релиза появилась карточка: при первом входе не сразу «пустой план», а короткая настройка приложения под человека.',
            en: 'Post-release ideas now include a first-run setup card so the first session isn’t only an empty planner shell.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.31', en: '0.6.31' },
        changes: [
          {
            ru: '**Процесс / документация (техн.):** добавлен проектный Cursor-скилл **`.cursor/skills/pre-commit-docs-roadmap/`** (`SKILL.md`, `reference.md`) — пошаговый чеклист перед коммитом (README, `productRoadmap.ts`, i18n); правило **`.cursor/rules/pre-commit-docs-roadmap.mdc`** дополнено: скилл **обязателен**, краткий текст правила его **не заменяет**; **`web/README.md`** — ссылки на скилл в разделах «Краткая сводка» и «Перед коммитом».',
            en: '**Process / docs (internal):** added repo Cursor skill **`.cursor/skills/pre-commit-docs-roadmap/`** (`SKILL.md`, `reference.md`) — step-by-step pre-commit checklist (README, `productRoadmap.ts`, i18n); **`.cursor/rules/pre-commit-docs-roadmap.mdc`** now states the skill is **mandatory** and the short rule text **does not replace** it; **`web/README.md`** links to the skill from “Brief summary” and “Before commit”.',
          },
        ],
        plainBullets: [
          {
            ru: 'Для команды и агентов зафиксирован единый порядок: перед коммитом не ограничиваться коротким правилом — пройти полный скилл, чтобы README и «Краткая сводка» не отставали от кода.',
            en: 'A single workflow for humans and agents: before commit, follow the full skill—not only the short always-on rule—so README and the Brief summary stay aligned with the code.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.28', en: '0.6.28' },
        changes: [
          {
            ru: '**«Открытые вопросы»:** добавлен пункт про **EOD** — нужно ли **автоматически** завершать ритуал «Завершение дня», если пользователь не отметил его вручную (`settings.roadmapOpenQuestionEodAuto`, `ProductRoadmapModal`).',
            en: '**Open questions:** new item on **EOD** — whether **End of day** should **auto-complete** when the user never finishes the ritual manually (`settings.roadmapOpenQuestionEodAuto`, `ProductRoadmapModal`).',
          },
        ],
        plainBullets: [
          {
            ru: 'В «Краткой сводке» в блоке открытых вопросов теперь явно зафиксирован продуктовый выбор: автоматика vs только ручное завершение и влияние на стрик/отчёты.',
            en: 'The Brief summary “Open questions” section now explicitly captures the product tradeoff: automation vs manual-only completion and impact on streaks/reports.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.27', en: '0.6.27' },
        changes: [
          {
            ru: '**Документация:** в **`web/README.md`** — отдельный раздел **«Краткая сводка»** (состав модалки, константы `productRoadmap.ts`, i18n, ссылки на Obsidian и правило перед коммитом); строка таблицы «Настройки» ссылается на раздел вместо длинного дубля.',
            en: '**Docs:** **`web/README.md`** — dedicated **“Brief summary”** section (modal layout, `productRoadmap.ts` keys, i18n, Obsidian links, pre-commit rule); Settings table row links there instead of duplicating.',
          },
        ],
        plainBullets: [
          {
            ru: 'В README одна «карта» модалки: куда смотреть в коде и как сопровождать релиз-ноты и дорожную карту.',
            en: 'README is a single “map” of the modal: where to edit and how to maintain release notes and roadmap data.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.26', en: '0.6.26' },
        changes: [
          {
            ru: '**Чек-лист:** отметки «выполнено» по пунктам — только в **календарный сегодня** (как главная галочка); **`applyToggleChecklistItem`** принимает контекстный день и отклоняет переключение, если это не «сегодня»; UI — **`TaskMiniCard`**, **`TaskEditModal`**.',
            en: '**Checklist:** per-item **done** toggles only on **calendar today** (same as the main checkbox); **`applyToggleChecklistItem`** takes a context day and no-ops unless it is “today”; UI — **`TaskMiniCard`**, **`TaskEditModal`**.',
          },
        ],
        plainBullets: [
          {
            ru: 'Если в календаре выбран **не сегодняшний** день, **нельзя** щёлкать галочки у пунктов чек-листа на карточке и в окне задачи — как с главной галочкой «сделано». **Добавить или убрать** строку чек-листа в окне по-прежнему можно.',
            en: 'When the picked calendar day is **not today**, you **cannot** toggle checklist item checkboxes on the card or in the task window — same as the main “done” control. You can still **add or remove** checklist rows in the editor.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-10', en: '2026-05-10' },
    items: [
      {
        releasedInVersion: { ru: '0.6.40', en: '0.6.40' },
        changes: [
          {
            ru: '**Настройки → Тестирование:** для **`admin`** и **`beta_tester`** — форма **«Завести дефект»** → GitHub Issue через Edge **`file-defect`** (JWT, проверка роли через **Service Role**, токен GitHub только в секретах Edge); после отправки в UI — ссылка на issue.',
            en: '**Settings → Testing:** for **`admin`** and **`beta_tester`** — **“File a defect”** → GitHub Issue via Edge **`file-defect`** (JWT, role check via **service role**, GitHub token only in Edge secrets); the UI shows a link to the new issue.',
          },
        ],
        plainBullets: [
          {
            ru: 'Тестеры и админы могут описать баг **из `/settings`**: текст уходит в GitHub, содержимое vault и email в issue не попадают.',
            en: 'Testers and admins can describe a bug **from `/settings`** — text goes to GitHub; vault contents and email are not included in the issue.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.25', en: '0.6.25' },
        changes: [
          {
            ru: '**«Идеи на потом»:** **форма дефекта в приложении** для **бета-тестеров** и **админов** (описание, шаги, контекст версии/экрана — без утечки vault); черновик в **`15-Идеи-для-развития.md`**, §14.',
            en: '**Ideas for later:** **in-app defect form** for **beta testers** and **admins** (description, steps, version/route context — no vault leakage); draft in **`15-Идеи-для-развития.md`**, §14.',
          },
        ],
        plainBullets: [
          {
            ru: 'В идеях после релиза — завести баг **из интерфейса**, если вы тестер или админ, без обязательного ухода во внешний трекер.',
            en: 'Post-release ideas: **file a bug from the UI** when you’re a tester or admin—no mandatory hop to an external tracker.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.25', en: '0.6.25' },
        changes: [
          {
            ru: '**Задокументирован дефект MVP:** в прошлые календарные дни **отметки «выполнено» по пунктам чек-листа** в модалке оставались доступны вопреки правилу «как главная галочка — только сегодня».',
            en: '**MVP defect documented:** on past calendar days, checklist **item done toggles** in the editor stayed available unlike the “main checkbox — today only” rule.',
          },
        ],
        plainBullets: [
          {
            ru: 'Исправление отметок пунктов — в **0.6.26** (блок релиз-нотов **2026-05-11**); **добавление/удаление** строк чек-листа по-прежнему не привязано к «сегодня».',
            en: 'Item **done** toggles were fixed in **0.6.26** (release notes **2026-05-11**); **add/remove** checklist rows remain allowed on any day.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.25', en: '0.6.25' },
        changes: [
          {
            ru: '**«Идеи на потом»:** **перенос незакрытой задачи** с **частично выполненным чек-листом** — сохранять отмеченные пункты; текст выполненных строк **можно править**; черновик в **`15-Идеи-для-развития.md`**, §13.',
            en: '**Ideas for later:** **deferring an open task** with **partial checklist progress** — keep checked items; **completed lines stay editable**; draft in **`15-Идеи-для-развития.md`**, §13.',
          },
        ],
        plainBullets: [
          {
            ru: 'Зафиксирована идея: при переносе задачи на другой день **не терять** уже отмеченные пункты чек-листа и оставлять возможность **подправить текст** выполненных строк.',
            en: 'Idea captured: when moving a task to another day, **don’t lose** checked checklist items and keep **completed line text** editable.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.25', en: '0.6.25' },
        changes: [
          {
            ru: '**«Идеи на потом»:** карточка **«Достижения»** (значки и вехи за паттерны использования планировщика — после MVP, без давления); черновик в **`15-Идеи-для-развития.md`**, §12.',
            en: '**Ideas for later:** **Achievements** card (badges/milestones for planner habits — post-MVP, low-pressure); draft in **`15-Идеи-для-развития.md`**, §12.',
          },
        ],
        plainBullets: [
          {
            ru: 'В списке идей после релиза добавлены **достижения** — опциональные значки за осмысленные успехи, их можно будет спрятать из интерфейса.',
            en: 'Post-release ideas now include optional **achievements** — badges for meaningful wins, hideable in UI.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.25', en: '0.6.25' },
        changes: [
          {
            ru: '**«Идеи на потом»:** после выхода новой версии приложения — **появляющаяся кнопка** «Обновить» с **перезагрузкой и сбросом кэша** статики / **service worker**; черновик в **`15-Идеи-для-развития.md`**, §11.',
            en: '**Ideas for later:** after a **new app version** ships — an **Update** affordance that **reloads with cache bust** for static assets / **service worker**; draft in **`15-Идеи-для-развития.md`**, §11.',
          },
        ],
        plainBullets: [
          {
            ru: 'В списке идей после релиза зафиксирован сценарий: приложение само подсказывает **обновить вкладку**, чтобы не сидеть на старом коде после деплоя.',
            en: 'Post-release ideas now include prompting users to **reload the tab** so they don’t stay on stale code after a deploy.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.25', en: '0.6.25' },
        changes: [
          {
            ru: 'Дорожная карта (**фаза 7** плана до **1.0.0**): в объём **проработки недели и календаря месяца** включены правила **отображения задач**, решение по **таймлайну**, поведение для **прошедшего времени / невыполненных и выполненных**.',
            en: 'Roadmap (**phase 7** toward **1.0.0**): **Week** and **month calendar** scope covers **task rendering**, **timeline** decision, and **past slots / open vs done** behavior.',
          },
          {
            ru: 'Политика **скрытия** — только фильтрами; синхронизация с **`17-План-реализации-MVP.md`**.',
            en: '**Visibility** policy — filters only; synced with **`17-План-реализации-MVP.md`**.',
          },
          {
            ru: '**`/app`:** кнопка **«Черновики»** показывается только если в vault есть хотя бы один черновик (ранее была видна неактивной при нуле).',
            en: '**`/app`:** **Drafts** button is shown only when at least one draft exists in the vault (previously shown disabled when empty).',
          },
        ],
        plainBullets: [
          {
            ru: 'В «Краткой сводке» в **фазе 7** теперь явно расписано, что до релиза нужно договориться: **как рисовать задачи** на неделе и в месяце, **делать ли отдельный таймлайн**, как показывать **«время вышло, а задача не закрыта»** и **уже сделанное**, и **не скрывать** задачи без явного фильтра.',
            en: '**Brief summary** phase **7** now states we must decide **how tasks show** on Week and Month, **whether to add a timeline**, how **past-but-open** and **done** look, and **not hide** work unless filters say so.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.24', en: '0.6.24' },
        changes: [
          {
            ru: '**`/app`:** иконка синхронизации визуально слабее рядом с меню аккаунта.',
            en: '**`/app`:** sync icon visually quieter next to the account menu.',
          },
          {
            ru: 'Кольца прогресса (**`DayPlanDonut`**, **`PeriodPlanDonut`**, ритуал EOD): **процент внутри** SVG-кольца (`PlanProgressRing.centerLabel`).',
            en: 'Progress rings (**`DayPlanDonut`**, **`PeriodPlanDonut`**, EOD ritual): **percent inside** the SVG ring (`PlanProgressRing.centerLabel`).',
          },
          {
            ru: '**Черновики:** кнопка рядом с фильтром при наличии черновиков; список — в модалке (в т.ч. один черновик).',
            en: '**Drafts:** button beside filters when drafts exist; list in a modal (including a single draft).',
          },
          {
            ru: '**Создание и редактирование задачи:** поле **«Группа»** перенесено в **«Дополнительные настройки»**.',
            en: '**Create and edit task:** **Group** moved under **Additional settings**.',
          },
          {
            ru: 'Форма: единый отступ **`gap-4`** между блоками; секция «Дата и бэклог» выровнена (`flex`/`gap-3`).',
            en: 'Form: consistent **`gap-4`** between blocks; «Date & backlog» section aligned (`flex`/`gap-3`).',
          },
          {
            ru: 'Янтарная плашка **«Чтобы сохранить»** — только **после первой** попытки **«Сохранить»**.',
            en: 'Amber **«To save»** checklist — only **after the first** **Save** attempt.',
          },
          {
            ru: '**Валидация оценки:** для бэклога оценка не обязательна; **некорректный ввод** по-прежнему блокирует сохранение (строки **`estimateInvalid`** и **`createTaskMissingEstimate`**).',
            en: '**Estimate validation:** backlog does not require a filled estimate; **invalid input** still blocks save (**`estimateInvalid`** vs **`createTaskMissingEstimate`**).',
          },
        ],
        plainBullets: [
          {
            ru: 'Синхронизация в шапке меньше отвлекает от аватара. У колец прогресса крупная цифра процента — внутри круга. Черновики — кнопка рядом с фильтром, когда они есть. В форме задачи реже «шумит» подсказка про сохранение: она появляется после того, как вы нажали «Сохранить», а не сразу. Для задачи **в бэклоге** оценка не обязательна; если в полях оценки мусор — сохранить всё равно нельзя, и это видно в списке ошибок.',
            en: 'The sync control is less visually tied to the account avatar. Ring charts show the big percent **inside** the circle. Drafts use one button next to filters when you have any. The amber save checklist appears **after** you try Save, not immediately. **Backlog** tasks do not require an estimate; garbled estimate fields still block save and show as an error line.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.22', en: '0.6.22' },
        changes: [
          {
            ru: '**«Идеи на потом»:** вход через **сторонние провайдеры** (**Яндекс**, **Google** и др., OAuth / federated login — типично через Supabase Auth); черновик в **`15-Идеи-для-развития.md`**, §10.',
            en: '**Ideas for later:** **third-party sign-in** (**Yandex**, **Google**, etc. — OAuth / federated login, typically via Supabase Auth); draft in **`15-Идеи-для-развития.md`**, §10.',
          },
        ],
        plainBullets: [
          {
            ru: 'В идеях после релиза зафиксирован вариант **войти через Яндекс или Google**, а не только email и пароль — когда до этого дойдёт продукт.',
            en: 'Post-release ideas now note **Yandex or Google sign-in** as an alternative to email/password — for whenever the product prioritizes it.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.22', en: '0.6.22' },
        changes: [
          {
            ru: '**«Идеи на потом»:** добавлена карточка **тестовые аккаунты с простым seed** (выделенные QA-учётки, предсказуемый seed для регрессии — только пост-MVP и не как норма безопасности); черновик в **`15-Идеи-для-развития.md`**, §9.',
            en: '**Ideas for later:** added **test accounts with a simple seed** (dedicated QA logins, predictable seed for regression — post-MVP only, not a security baseline); draft in **`15-Идеи-для-развития.md`**, §9.',
          },
        ],
        plainBullets: [
          {
            ru: 'В блоке идей после релиза появился пункт про **отдельные тестовые логины** с **простым известным seed** — чтобы команде проще гонять одни и те же сценарии; для обычных пользователей это не рекламируется.',
            en: 'The post-release ideas list now mentions **dedicated test logins** with a **simple known seed** so the team can rerun the same scenarios; not pitched as guidance for end users.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.22', en: '0.6.22' },
        changes: [
          {
            ru: 'Дорожная карта (**`MVP_PHASES_PLANNED`**): в план до **1.0.0** добавлены фазы **12** (домен: выбор, покупка, DNS, привязка к деплою) и **13** (ветка **`dev`** → тесты → слияние в **`main`**); счётчик фаз и документация приведены к диапазону **0–13**.',
            en: 'Roadmap (**`MVP_PHASES_PLANNED`**): phases **12** (domain: choose, buy, DNS, bind to hosting) and **13** (**`dev`** → test → merge to **`main`**) added to the **1.0.0** plan; phase totals and docs updated to **0–13**.',
          },
        ],
        plainBullets: [
          {
            ru: 'В «Краткой сводке» в списке **план до релиза** теперь в конце две отдельные фазы: **свой домен** для сайта и **порядок веток** (сначала разработка в `dev`, потом — стабильная `main` для прода).',
            en: 'In **Brief summary**, the pre-release plan ends with two phases: a **custom domain** for the app and a **branch policy** (work on `dev`, then promote to stable `main` for production).',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.22', en: '0.6.22' },
        changes: [
          {
            ru: 'Редактор задачи (**`TaskEditModal`**): на телефонах (WebKit) касания не «проваливаются» в список задач под модалкой — оверлей через **`createPortal` → `document.body`**, на время открытия **`overflow: hidden`** у **`body`**, затемнение закрывает по **`onPointerDown`**, слой **`z-[80]`**, у прокрутки формы — **`overscroll-y-contain`**.',
            en: 'Task editor (**`TaskEditModal`**): on phones (WebKit) touches no longer fall through to the list behind — overlay via **`createPortal` → `document.body`**, **`overflow: hidden`** on **`body`** while open, backdrop closes on **`onPointerDown`**, layer **`z-[80]`**, scroll panel uses **`overscroll-y-contain`**.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.21', en: '0.6.21' },
        changes: [
          {
            ru: 'Модалка «Краткая сводка»: подблоки внутри одной календарной даты выводятся по **убыванию semver** (`releasedInVersion`). Выпуски **0.6.5** и **0.6.6** перенесены с **`dateLabel` 2026-05-10** на **2026-05-09**; под **10.05** остаются выпуски **0.6.18** и новее.',
            en: 'Brief summary modal: sub-blocks within one calendar date are ordered by **descending semver** (`releasedInVersion`). **0.6.5** and **0.6.6** entries moved from **2026-05-10** to **2026-05-09**; May **10** lists releases **0.6.18** and newer only.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.20', en: '0.6.20' },
        changes: [
          {
            ru: 'Исправлена **хронология** релиз-нотов в данных: свежие пункты перенесены на календарный день **2026-05-10**, чтобы при сортировке дат в модалке они шли **выше** более раннего **2026-05-09**.',
            en: 'Fixed release-notes **chronology** in data: latest entries moved to calendar day **2026-05-10** so they sort **above** earlier **2026-05-09** in the modal.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.19', en: '0.6.19' },
        changes: [
          {
            ru: 'Документация и «Краткая сводка»: обновлены **README**, правило **pre-commit** и тексты модалки; релиз-ноты — обязательное **`releasedInVersion`** на подблок и строка **«Версия выпуска»** в UI.',
            en: 'Docs and Brief summary: **README**, **pre-commit** rule, and modal copy updated; release notes require **`releasedInVersion`** per sub-block plus **Released in** in the UI.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.18', en: '0.6.18' },
        changes: [
          {
            ru: 'Релиз-ноты: у каждого подблока выпуска — поле **`releasedInVersion`**: semver той **сборки продукта**, в которой изменения попали к пользователю (значение как в `package.json` **до** `vite build`, без суффикса `+git`); в модалке — строка **«Версия выпуска»**.',
            en: 'Release notes: each release sub-block has **`releasedInVersion`** — the **product semver** where the changes reached users (same as `package.json` **before** `vite build`, no `+git` suffix); the modal shows **Released in**.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-09', en: '2026-05-09' },
    items: [
      {
        releasedInVersion: { ru: '0.6.34', en: '0.6.34' },
        changes: [
          {
            ru: '**`@motivator/core` / план и EOD:** задача с чек-листом без главной галочки дня **не** считается полностью закрытой — вклад в доли кольца **ограничен** (до **0,99** слота), пока не выполнено **`isPlannedTaskFullyCompleteForDay`**; добавлены **`plannedPeriodSlotsByGroupId`** / **`plannedPeriodSlotsByColorKey`** для разбивки периода.',
            en: '**`@motivator/core` / plan & EOD:** a checklist task without the **main day-done** flag is **not** fully closed — its ring share is **capped** (up to **0.99** of one task slot) until **`isPlannedTaskFullyCompleteForDay`**; added **`plannedPeriodSlotsByGroupId`** / **`plannedPeriodSlotsByColorKey`** for period breakdown.',
          },
          {
            ru: '**`/app`:** бейдж **черновиков** на кнопке **«Фильтры»** (модалка списка по тапу); порядок элементов **тулбара**; **`min-h-dvh`** и **`flex-1 min-h-0`** — скролл недели и нижней панели на коротком экране; шапка недели — компактные стрелки и короткий диапазон дат.',
            en: '**`/app`:** **drafts** badge on **Filters** (tap opens list modal); **toolbar** control order; **`min-h-dvh`** + **`flex-1 min-h-0`** so week grid + bottom bar scroll on short viewports; week header — compact arrows and short date range.',
          },
          {
            ru: '**«Неделя» / «Месяц»:** рядом с кольцом периода — **`PeriodPlanBreakdownChart`** (**Recharts**): столбцы по **группам** или **цветам**.',
            en: '**Week / Month:** next to the period ring — **`PeriodPlanBreakdownChart`** (**Recharts**): bars by **group** or **color**.',
          },
          {
            ru: '**`TaskMiniCard`:** строки чек-листа — **`<label>`** на всю строку, **`min-h-[44px]`** для тач-цели; **`HomePage`:** убрана плашка `home.docsHint`.',
            en: '**`TaskMiniCard`:** checklist rows use a full-row **`<label>`** and **`min-h-[44px]`** touch targets; **`HomePage`:** removed the `home.docsHint` strip.',
          },
          {
            ru: '**`index.css`:** поля ввода на мобилке **≥16px** (анти-zoom iOS); **`cursor: pointer`** у кнопок и ссылок в **`@layer base`**. **`CreateTaskModal`:** прокрутка середины формы; **`TaskColorAccordion`** — единая типографика подписей цвета.',
            en: '**`index.css`:** mobile inputs **≥16px** (anti iOS zoom); **`cursor: pointer`** on buttons/links in **`@layer base`**. **`CreateTaskModal`:** scrollable mid form; **`TaskColorAccordion`** — consistent color-label typography.',
          },
        ],
        plainBullets: [
          {
            ru: 'Все пункты чек-листа отмечены, но главная «сделано» не стоит — кольцо и EOD **не** показывают полный слот задачи; зелёная строка и «всё закрыто» — только вместе с главной галочкой. На неделе/месяце рядом с кольцом — **столбцы по группам или цветам**. Черновики — **счётчик на «Фильтрах»**; главная без лишней плашки доков; на телефоне поля не уменьшают масштаб страницы при фокусе.',
            en: 'All checklist items checked but the main “done” isn’t — the ring/EOD **won’t** count a full task slot; green row and “all done” need the **main** checkbox too. Week/month show **group/color bars** beside the ring. Drafts use a **counter on Filters**; landing drops the extra docs strip; mobile inputs avoid focus zoom.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.23', en: '0.6.23' },
        changes: [
          {
            ru: '**`/app`**: шапка — иконка синхронизации и меню аккаунта (отчёты, EOD при вкладке «День», настройки, выход); ошибки удалённого vault — человекочитаемый текст и кнопка **«Повторить»**; фильтры — мобильная панель на весь экран, чипы активных условий и **«Сбросить всё»**; кнопка **«Завершить день»** в одной строке с созданием задачи на вкладке «День». Модалка создания: порядок полей как в договорённостях, **липкий подвал** с динамическим списком недостающего и прокруткой к полям; цвет и двойное подтверждение — в **«Дополнительные настройки»**. Редактирование задачи — тот же порядок секций и `<details>` доп. настроек. **«День»**: под кольцом прогресса только **процент** (без второй строки про доли задач). **«Неделя»**: выше слоты часов (`HOUR_HEIGHT_PX` **42**), контрастнее подписи часов.',
            en: '**`/app`**: header — sync icon and account menu (reports, EOD on Day tab, settings, sign out); remote vault errors — friendly copy and **Retry**; filters — fullscreen mobile sheet, active chips and **Reset all**; **End day** on the same row as create task on Day. Create modal: field order per spec, **sticky footer** with dynamic missing list and scroll-to-field; color and double-confirm under **Additional settings**. Task edit — same section order and `<details>` for extras. **Day**: progress caption shows **percent only** (no fractional task line). **Week**: taller hour slots (**`HOUR_HEIGHT_PX` 42**), stronger hour labels.',
          },
        ],
        plainBullets: [
          {
            ru: 'Синхронизация и аккаунт удобнее на телефоне; если загрузка vault с сервера не удалась — понятное сообщение и одна кнопка повтора. Фильтры не теряются: видно чипами, что включено, и можно сбросить разом. Создание и правка задачи идут в одном порядке блоков; редкие настройки спрятаны под «Дополнительно». У кольца «день» остаётся только крупный процент — без второй строки про задачи.',
            en: 'Sync and account are easier on mobile; if remote vault load fails you get plain language plus one retry. Filters show as chips with reset-all. Create and edit share the same block order; rare options live under **Additional**. The day ring caption is just the big percent — no extra task-fraction line.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.15', en: '0.6.15' },
        changes: [
          {
            ru: 'Правила релиз-нотов: **дата в данных = календарный день изменений**; если блока с этой датой ещё нет — добавить объект с `dateLabel` (новые даты обычно **первыми в массиве**). За один день несколько выпусков — несколько элементов **`items`**; в одном выпуске несколько правок — массив **`changes`**; суть без кода — **`plainBullets`** (в модалке под раскрывашкой «Подробности простым языком»). Записи **не скрываются** по дате относительно «сегодня».',
            en: 'Release notes policy: **data date = calendar day of work**; if no block exists for that day, add one with `dateLabel` (new dates usually **first in the array**). Multiple releases per day — multiple **`items`**; multiple edits in one release — **`changes`**; plain-language gist — **`plainBullets`** (collapsible in the modal). Entries are **not hidden** relative to “today”.',
          },
        ],
        plainBullets: [
          {
            ru: 'В модалке дни по убыванию даты; внутри дня подблоки — по **убыванию версии выпуска** (`releasedInVersion`). Не нужно «дождаться дня», чтобы запись появилась в списке.',
            en: 'In the modal, days are newest-first; within a day, sub-blocks follow **descending ship version** (`releasedInVersion`). You do not wait for a calendar day for an entry to appear.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.14', en: '0.6.14' },
        changes: [
          {
            ru: 'Релиз-ноты: в данных заведена отдельная календарная секция **2026-05-10** для записей того периода (раньше ошибочно сливали с 09.05).',
            en: 'Release notes: data has a separate calendar section **2026-05-10** for that period (was wrongly merged with 05-09).',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.13', en: '0.6.13' },
        changes: [
          {
            ru: 'Фильтры вида: **информер** скрыт, пока все фильтры в состоянии по умолчанию (все группы, все приоритеты, любой цвет, любые повторы).',
            en: 'View filters: **informer** hidden while every filter is at its default (all groups, all priorities, any color, any repeats).',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.12', en: '0.6.12' },
        changes: [
          {
            ru: '«Неделя»: вертикальный скролл сетки часов — **тёмная** полоса (класс `week-grid-v-scroll`), резерв под трек (`scrollbar-gutter: stable`), правый отступ у колонок дней — чтобы полоса не перекрывала последний день недели.',
            en: 'Week tab: vertical scroll on the hour grid — **dark** scrollbar (`week-grid-v-scroll`), gutter reservation (`scrollbar-gutter: stable`), right padding on day columns so the track does not cover the last weekday.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.11', en: '0.6.11' },
        changes: [
          {
            ru: 'Процесс: зафиксировано **обязательное** обновление `web/README.md` и модалки «Краткая сводка» (`productRoadmap.ts`) перед **любым** коммитом — правило в `.cursor/rules/pre-commit-docs-roadmap.mdc` и в README.',
            en: 'Process: **mandatory** updates to `web/README.md` and the Brief summary modal (`productRoadmap.ts`) before **every** commit — see `.cursor/rules/pre-commit-docs-roadmap.mdc` and README.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.11', en: '0.6.11' },
        changes: [
          {
            ru: '«Неделя»: таблица таймблокинга **без горизонтального скролла** — убраны фиксированная минимальная ширина и обёртка `overflow-x-auto`; колонки сжимаются в доступной ширине.',
            en: 'Week tab: timeblocking grid **without horizontal scroll** — removed min-width wrapper and `overflow-x-auto`; columns flex to the container.',
          },
          {
            ru: 'Подпись под кольцами прогресса («X из Y задач»): исправлена интерполяция i18n (`doneSumStr` / `taskCountStr`).',
            en: 'Plan ring caption (“X of Y tasks”): fixed i18n interpolation (`doneSumStr` / `taskCountStr`).',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.10', en: '0.6.10' },
        changes: [
          {
            ru: '«Неделя» и «Месяц»: кольцо прогресса плана за период — та же логика долей, что у «Дня» (**`plannedPeriodProgress`** в `@motivator/core`); в сумму входят только календарные дни **до сегодня включительно**; фильтры вида как у списков; блок скрыт, если в охвате нет задач в плане.',
            en: 'Week & Month tabs: period plan-progress ring — same share logic as Day (**`plannedPeriodProgress`** in `@motivator/core`); only calendar days **through today**; view filters match task lists; section hidden when no planned tasks in scope.',
          },
          {
            ru: '«День»: список плана и кольцо используют общий отбор **`tasksScheduledForPlannerDay`**; подпись под кольцом явно про **число задач**, не пункты чек-листа.',
            en: 'Day tab: plan list and ring both use **`tasksScheduledForPlannerDay`**; caption shows **task count**, not checklist rows.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.10', en: '0.6.10' },
        changes: [
          {
            ru: 'Кольцо «План на день» и EOD: прогресс по **задачам** (чек-лист как доля внутри задачи); подпись — процент и «выполнено по долям / число задач».',
            en: 'Day/EOD ring: progress per **tasks** (checklist as in-task share); caption shows percent and fractional task row.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.9', en: '0.6.9' },
        changes: [
          {
            ru: '«Идеи на потом» в краткой сводке: добавлены темы из `15-Идеи-для-развития` — feature discovery, привычки, поиск, тамагочи; обновлена карточка про диаграммы на «День».',
            en: 'Brief summary «Ideas later»: synced missing themes from `15-Идеи-для-развития` (feature discovery, habits, search, tamagotchi); Day charts card updated.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.9', en: '0.6.9' },
        changes: [
          {
            ru: '«День»: кольцо прогресса учитывает **чек-листы** (пункты как отдельные единицы); совпадает со списком после фильтров; диаграмма по центру свободной области справа.',
            en: 'Day tab: progress ring counts **checklist** items; matches filtered plan list; chart centered in the right pane.',
          },
          {
            ru: 'Фильтры: выпадающие значения (группа, цвет, приоритеты, тип повтора) строятся только по задачам **текущего вида** вкладки и остальных активных фильтров.',
            en: 'Filters: dropdown values are derived from tasks **visible in the current tab** plus cross-filtering.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.8', en: '0.6.8' },
        changes: [
          {
            ru: 'Вкладка «День»: кольцо прогресса выполнения плана на день (логика как в ритуале «Завершение дня»); на широком экране список слева, диаграмма справа.',
            en: 'Day tab: progress ring for planned-for-day completion (same logic as End-of-day ritual); on wide screens list left, chart right.',
          },
          {
            ru: 'Исправлено выравнивание списка задач на широком экране (`flex-row-reverse` + выравнивание группы влево).',
            en: 'Fixed day-plan list alignment on wide screens (`flex-row-reverse` group aligned left).',
          },
          {
            ru: 'Страница «Отчёты»: иконки подсказок у KPI, столбчатой диаграммы и таблиц провалов.',
            en: 'Reports page: hint icons for KPIs, bar chart, and missed-task tables.',
          },
          {
            ru: 'Документация `web/README.md`: перед коммитом обновлять сводку и модалку «Краткая сводка» (`productRoadmap.ts`).',
            en: '`web/README.md`: commit checklist to refresh docs and Brief summary modal (`productRoadmap.ts`).',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.7', en: '0.6.7' },
        changes: [
          {
            ru: 'Релиз-ноты в «Краткая сводка» переведены на формат списка изменений (пункты по датам вместо длинных абзацев).',
            en: 'Release notes in Brief summary are now changelog-style bullet lists per date instead of long paragraphs.',
          },
          {
            ru: 'При каждом открытии модалки все раскрывающиеся секции по умолчанию свёрнуты.',
            en: 'Every time the modal opens, all collapsible sections start collapsed.',
          },
          {
            ru: 'Вверху модалки добавлена круговая диаграмма: процент и доля закрытых фаз дорожной карты до MVP 1.0.0 (0–6 из 0–13).',
            en: 'A donut chart at the top shows percent complete for roadmap phases toward MVP 1.0.0 (phases 0–6 of 0–13).',
          },
          {
            ru: 'Релиз-ноты: каждая дата — отдельная раскрывашка, чтобы быстрее находить нужный выпуск.',
            en: 'Release notes: each date is its own collapsible section for quicker navigation.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.6', en: '0.6.6' },
        changes: [
          {
            ru: 'Настройки: в «Краткая сводка» добавлен пятый блок «Открытые вопросы» (перенесено из модалки завершения дня).',
            en: 'Settings: fifth section “Open questions” in Brief summary (moved from End-of-day modal).',
          },
          {
            ru: 'Завершение дня: круговая диаграмма доли задач, закрытых по плану на день.',
            en: 'End of day: donut chart for share of planned-for-day tasks completed.',
          },
          {
            ru: 'Блок «не закрыто (0)» отображается в зелёном стиле, если по плану не осталось незакрытых задач.',
            en: '“Not closed (0)” section uses success styling when nothing is left open per plan.',
          },
          {
            ru: 'После отметки ритуала кнопка в шапке планировщика: «Отчёт за сегодня».',
            en: 'After completing the ritual, the planner header shows “Today’s report”.',
          },
        ],
        plainBullets: [
          {
            ru: 'Открытые продуктовые вопросы перенесены из вечернего окна в сводку — вечернее окно про итог дня.',
            en: 'Product “open questions” moved out of the evening modal so the ritual stays about the day’s outcome.',
          },
          {
            ru: 'Зелёный блок при нуле и новая подпись кнопки уменьшают ощущение, что день «ещё не закрыт».',
            en: 'Green zero-state and the renamed button reduce the feeling that the day is still unfinished.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.12', en: '0.6.12' },
        changes: [
          {
            ru: '«Неделя»: выравнивание заголовков дней и сетки слотов — **одна сетка + subgrid**, без смещения колонок из‑за скролла.',
            en: 'Week tab: day headers align with the slot grid via **one grid + subgrid** (no column drift from scroll/padding).',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.15', en: '0.6.15' },
        changes: [
          {
            ru: '«Краткая сводка» — релиз-ноты: **одна раскрывашка на календарную дату**; за день несколько выпусков — **несколько блоков** (`items`); у блока — **`releasedInVersion`** (semver выпуска); в блоке несколько правок — **список** (`changes`); подробности простым языком — **`plainBullets`** под раскрывашкой; по календарю **не фильтруем**.',
            en: 'Brief summary release notes: **one collapsible per calendar date**; multiple releases per day — **multiple blocks** (`items`); each block has **`releasedInVersion`** (ship semver); several edits in one block — **list** (`changes`); plain-language notes — **`plainBullets`** under a collapsible; **no calendar filtering**.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.1', en: '0.6.1' },
        changes: [
          {
            ru: 'Версия продукта 0.6.1 в package.json; схема 0·x·y и суффикс +git для сборки.',
            en: 'Product version 0.6.1 in package.json; 0·x·y scheme and +git build suffix.',
          },
          {
            ru: 'Ведущий 0 в версии не означает «только MVP» — см. web/README.md.',
            en: 'Leading 0 does not mean “MVP-only” — see web/README.md.',
          },
        ],
        plainBullets: [
          {
            ru: 'Номер версии помогает отличать сборки; первая цифра 0 — эпоха нумерации до 1.0.0, не оценка качества.',
            en: 'Version tags builds; leading 0 is the pre-1.0.0 numbering era, not a quality score.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.1', en: '0.6.1' },
        changes: [
          {
            ru: 'DR-004 и схема vault v7: двойное подтверждение «сделано» в создании/редактировании и на мини-карточке.',
            en: 'DR-004 and vault v7: double confirmation for done in editors and on the mini card.',
          },
          {
            ru: 'Таймеры по умолчанию +10 / +30 мин; просроченное ожидание снимается автоматически.',
            en: 'Default +10 / +30 min timers; stale pending clears automatically.',
          },
          {
            ru: 'Короткие анимации на карточке при успехе и мягком пропуске.',
            en: 'Brief card animations for success vs soft miss.',
          },
        ],
        plainBullets: [
          {
            ru: 'Один тап по галочке недостаточен: нужно второе подтверждение в окне времени или отмена ожидания.',
            en: 'One tap is not enough: confirm again within the window or cancel the wait.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.1', en: '0.6.1' },
        changes: [
          {
            ru: 'Дорожная карта в настройках: до 1.0.0 остаются фазы 7–13 (включая фазу 7 — дизайн и адаптивность).',
            en: 'Settings roadmap: phases 7–13 remain until 1.0.0 (incl. phase 7 — design & responsiveness).',
          },
          {
            ru: 'В «Идеях на потом» — черновик раздела тестирования для админов и бета-тестеров.',
            en: 'Ideas for later: draft QA/testing section for admins and beta testers.',
          },
        ],
        plainBullets: [
          {
            ru: 'План до релиза показан как одиннадцать шагов; отдельно отмечена полировка под широкий и узкий экран.',
            en: 'The plan lists eleven steps to release plus layout polish for wide and small screens.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.1', en: '0.6.1' },
        changes: [
          {
            ru: 'Модалка дорожной карты: фазы 0–6 в блоке «Уже реализовано».',
            en: 'Roadmap modal: phases 0–6 under Shipped.',
          },
          {
            ru: 'Тексты синхронизированы с web/README.md и планом в Obsidian.',
            en: 'Copy aligned with web/README.md and the Obsidian plan.',
          },
        ],
        plainBullets: [
          {
            ru: 'Релиз-ноты для тестеров совпадают со сборкой и репозиторием.',
            en: 'Tester-facing notes match the build and repo.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.2', en: '0.6.2' },
        changes: [
          {
            ru: 'Страница /app/reports: график отметок, KPI, стрик DR-013 с EOD.',
            en: '/app/reports: completion chart, KPIs, DR-013 streak with EOD.',
          },
          {
            ru: 'Таблицы «часто проваленные» по DR-008.',
            en: 'Often-missed tables (DR-008).',
          },
        ],
        plainBullets: [
          {
            ru: 'Отчёты помогают видеть серию дней и задачи, которые часто срываются.',
            en: 'Reports show streaks and tasks that often slip.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.3', en: '0.6.3' },
        changes: [
          {
            ru: 'Создание задачи: янтарная подсказка обязательных полей для сохранения.',
            en: 'Create task: amber hints for required fields before save.',
          },
          {
            ru: 'Черновики: одна секция или кнопка «Черновики» с модалкой списка.',
            en: 'Drafts: inline strip or Drafts button with list modal.',
          },
          {
            ru: 'Форма не сбрасывается при смене дня или фильтра группы, пока модалка открыта.',
            en: 'Form persists when changing day or group filter while the modal is open.',
          },
        ],
        plainBullets: [
          {
            ru: 'Черновик можно продолжить позже; переключение дня не стирает набранный текст.',
            en: 'Drafts can be resumed; switching the day does not wipe typed text.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.4', en: '0.6.4' },
        changes: [
          {
            ru: 'Неделя и карточки: полоска цвета через HEX палитры.',
            en: 'Week and cards: color stripe via palette hex.',
          },
          {
            ru: 'Время: селекты часы и минуты.',
            en: 'Time: hour and minute selects.',
          },
          {
            ru: 'Чек-лист: новые пункты добавляются в конец списка.',
            en: 'Checklist: new items append to the end.',
          },
        ],
        plainBullets: [
          {
            ru: 'Цвет стабильно виден в сетке; время без нативного time-picker.',
            en: 'Color stays visible in the grid; time without native time-picker.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.6', en: '0.6.6' },
        changes: [
          {
            ru: 'Синхронизированы web/README.md, тексты в productRoadmap.ts и релиз-ноты для тестеров.',
            en: 'Synced web/README.md, productRoadmap.ts copy, and tester-facing release notes.',
          },
          {
            ru: 'Описание вкладок дорожной карты в README приведено к актуальной модалке.',
            en: 'README roadmap tabs description matches the current modal.',
          },
        ],
        plainBullets: [
          {
            ru: 'Таблица возможностей и контракт vault отражают сборку; релиз-ноты группируются по календарным датам.',
            en: 'Feature table and vault contract match the build; release notes are grouped by calendar date.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.5', en: '0.6.5' },
        changes: [
          {
            ru: 'В дорожной карте обновлены «Идеи на потом»: внешние календари (черновик в Obsidian §4).',
            en: 'Ideas for later: external calendars (draft in Obsidian §4).',
          },
          {
            ru: 'Идея: цвет метки с названием и описанием.',
            en: 'Idea: color labels with name and description.',
          },
          {
            ru: 'Задел: раздел тестирования для admin/beta, поля рефлексии EOD, мини-диаграмма на вкладке «День».',
            en: 'Draft ideas: QA settings for admin/beta, EOD reflection fields, Day tab mini-chart.',
          },
        ],
        plainBullets: [
          {
            ru: 'В модалке — короткие карточки; подробности интеграции с календарями — в репозитории Obsidian.',
            en: 'The modal shows short cards; full calendar-integration draft stays in Obsidian.',
          },
        ],
      },
      {
        releasedInVersion: { ru: '0.6.5', en: '0.6.5' },
        changes: [
          {
            ru: 'Ритуал «Завершение дня»: списки строятся только по задачам, запланированным на этот календарный день.',
            en: 'End-of-day ritual: lists only include tasks planned for that calendar day.',
          },
          {
            ru: 'Исправление: задача не попадает в «не закрыто» только из‑за редактирования в тот же день.',
            en: 'Fix: a task is not listed as “not closed” solely because it was edited today.',
          },
          {
            ru: 'Бэклог — отдельный блок «на заметку», не как долг за день.',
            en: 'Backlog is a separate FYI block, not framed as same-day debt.',
          },
          {
            ru: 'Заголовок модалки для локали ru отображается на русском.',
            en: 'Russian locale shows a Russian modal title.',
          },
          {
            ru: 'Добавлен блок «Открытые вопросы» в модалке завершения дня (позже перенесён в «Краткая сводка»).',
            en: '“Open questions” block in End-of-day (later moved to Brief summary).',
          },
        ],
        plainBullets: [
          {
            ru: 'Те же правила, что в отчётах: в основные списки попадает только запланированное на дату; бэклог отдельно.',
            en: 'Same as reports: main lists match what was planned for the date; backlog is separate.',
          },
        ],
      },
    ],
  },
]

/**
 * Оставшийся охват до 1.0.0 (источник — `obsidian-motivator/17-План-реализации-MVP.md`).
 * Фазы 0–6 см. в `IMPLEMENTED_MVP_PHASES`; здесь — фазы **7–13** (порядок: **7** аккаунт → **8** монетизация → **9** offline → **10** чеклист → **11** домен → **12** ветки → **13** дизайн).
 */
export const MVP_PHASES_PLANNED: RoadmapMvpPhase[] = [
  {
    id: 7,
    title: { ru: 'Настройки, аккаунт, юридика', en: 'Settings, account, legal' },
    summary: {
      ru: 'Настройки по блокам; пароль; seed; удаление и 30 дней; тексты; feedback; cookie. Роли и ограничения UI по permissions — отдельная доработка (см. буллеты ниже).',
      en: 'Grouped settings; password; seed; deletion & 30 days; legal; feedback; cookie. Role-based UI gating — separate pass (see bullets).',
    },
    plain: {
      ru: 'Собрать всё про аккаунт в понятные коробки: сменить пароль, бережно показать секретный ключ, если человек хочет уйти — объяснить что будет и как вернуться, повесить короткие тексты «кто мы и какие правила», кнопку «напишите нам», маленькое окошко про куки. Про «кто тут админ» — отдельным заходом позже. Задумать привычную «лицевую» иконку в углу экрана с менюшкой (настройки, выйти, отчёты…) — как у многих сайтов.',
      en: 'Pack everything about your account into clear boxes: change password, gently show the secret key, if someone wants to leave — explain what happens and how to come back, short “who we are and the rules,” a **write to us** button, a tiny cookie notice. “Who is admin” — a separate pass later. Plan a familiar corner **profile** icon with a little menu (settings, sign out, reports…) — like many sites.',
    },
    detailBullets: [
      {
        ru: '**Идея к проработке:** привычный паттерн «иконка аккаунта / аватар» в шапке приложения с выпадающим меню — как у большинства сервисов: оттуда короткие ссылки на **настройки**, **выход**, **отчёты**, дорожную карту / релиз-ноты при необходимости и т.д.; состав пунктов, порядок и неперегруз шапки — отдельное UX-решение.',
        en: '**Idea to explore:** familiar **account / avatar** control in the app header with a dropdown — like most services: quick links to **settings**, **sign out**, **reports**, roadmap / release notes when needed, etc.; item list, order, and keeping the header light are a separate UX decision.',
      },
      {
        ru: '**7a (0.7.0):** экспорт seed, юридика, cookie. **7a.1 (DR-014):** два экрана онбординга + recovery. **7c (DR-014):** полная ротация seed и/или KDF в настройках — перешифровка vault и замена ciphertext; бэкап нового seed (DR-006).',
        en: '**7a (0.7.0):** seed export, legal, cookie. **7a.1 (DR-014):** split onboarding + recovery. **7c (DR-014):** full seed and/or KDF rotation in settings — re-encrypt vault, replace server ciphertext; backup new seed (DR-006).',
      },
      {
        ru: 'Серверная политика удаления (Supabase и др.) и UX восстановления по ключу.',
        en: 'Server deletion policy (Supabase et al.) and key-based recovery UX.',
      },
      {
        ru: 'Обратная связь: кнопка / ссылка (форма, email, тикеты — по решению продукта), заметная до релиза 1.0.0.',
        en: 'Feedback: button/link (form, email, tickets — product decision), visible before 1.0.0.',
      },
      {
        ru: 'Cookie: баннер или плашка, сохранение выбора, ссылки на политику; согласовать с DR-006 и юрисдикцией.',
        en: 'Cookie: banner or bar, persist choice, link to policy; align with DR-006 and jurisdiction.',
      },
      {
        ru: '**Permissions (отложено в текущей сборке):** роли **пользователь / бета-тестер / администратор**, источник на сервере (`app_metadata.motivator_role`, RLS). Задел в коде — `motivatorRole.ts`, контекст Auth; включение ограничений UI (например дорожной карты только админам) — при отдельной задаче.',
        en: '**Permissions (deferred in current build):** **user / beta tester / admin**, server-side (`app_metadata.motivator_role`, RLS). Hooks exist (`motivatorRole.ts`, Auth context); UI gating (e.g. roadmap admins-only) — separate task.',
      },
    ],
  },
  {
    id: 8,
    title: { ru: 'Монетизация и push', en: 'Monetization & push' },
    summary: {
      ru: 'Freemium + премиум (DR-010); проверка тарифа; PWA push — по решению спринта.',
      en: 'Freemium + premium (DR-010); entitlement checks; PWA push per sprint.',
    },
    plain: {
      ru: 'Когда планировщик уже не ломается от повседневной жизни — можно добавить «особый пропуск» за деньги (что именно — решит продукт) и опциональные напоминания на телефон, если человек согласился.',
      en: 'When the planner doesn’t break in daily life — we can add a **paid extra ticket** (what exactly — product decides) and optional phone nudges if people agree.',
    },
    detailBullets: [
      {
        ru: 'Бесплатный уровень и платный **premium** (лимиты или функции — по продукту); связка с учёткой после ядра планирования.',
        en: 'Free tier and paid **premium** (limits or features — product call); billing tied after core planning ships.',
      },
      {
        ru: 'После стабилизации отчётов и ритуалов — чтобы не блокировать MVP-трек.',
        en: 'After reports and rituals stabilize — avoids blocking the MVP track.',
      },
    ],
  },
  {
    id: 9,
    title: { ru: 'Offline-first', en: 'Offline-first' },
    summary: {
      ru: 'Очередь синка и конфликты по архитектурным документам.',
      en: 'Sync queue and conflicts per architecture docs.',
    },
    plain: {
      ru: 'Чтобы приложение не «пропадало», если интернет ненадолго исчез, и чтобы два изменения с разных устройств не съедали друг друга — нужна аккуратная очередь сохранений и понятные правила «кто главный», когда истории разошлись.',
      en: 'So the app doesn’t “vanish” when the internet blinks, and two edits from different devices don’t eat each other — we need a tidy save queue and clear rules for “who wins” when stories diverge.',
    },
    detailBullets: [
      {
        ru: 'Целевое усиление после стабилизации модели событий и основных сценариев.',
        en: 'Target hardening after events model and main flows stabilize.',
      },
    ],
  },
  {
    id: 10,
    title: { ru: 'Чеклист к релизу 1.0.0', en: 'Release checklist for 1.0.0' },
    summary: {
      ru: 'Закрытие Scope по ТЗ, регрессия, актуализация деплоя и документации; **семантический тег `1.0.0`** — после фаз **11–13** (домен, ветки, дизайн).',
      en: 'Close Scope vs TZ, regression, refresh deploy/docs; the **`1.0.0` semver tag** lands after phases **11–13** (domain, branches, design).',
    },
    plain: {
      ru: 'Пройти приёмочный чек-лист как перед контрольной и убедиться, что продукт держит обещания ТЗ; финальный **переход на `1.0.0`** — после **домена**, **ветки `main`** и **полировки UI**, см. фазы 11–13.',
      en: 'Run the acceptance checklist like an exam and verify the product meets TZ; the formal bump to **`1.0.0`** comes **after domain**, a stable **`main`**, and the **UI polish** pass — see phases 11–13.',
    },
    detailBullets: [
      {
        ru: 'Закрытие Scope по 16-TZ и 03-Scope; регрессия сценариев день / неделя / месяц / отчёты / аккаунт; актуализация Vercel/README.',
        en: 'Close Scope per 16-TZ and 03-Scope; regress day / week / month / reports / account; refresh Vercel/README.',
      },
    ],
  },
  {
    id: 11,
    title: { ru: 'Домен продукта', en: 'Product domain' },
    summary: {
      ru: 'Выбор имени, покупка у регистратора, DNS и привязка к деплою (**Vercel** / выбранный хостинг), HTTPS.',
      en: 'Pick a name, purchase from a registrar, configure DNS and bind to the deployment (**Vercel** or chosen host), HTTPS.',
    },
    plain: {
      ru: 'Закрепить **свой адрес сайта** вместо только технического URL хостинга: купить домен, настроить записи так, чтобы приложение открывалось по человеческому имени и с защищённым соединением.',
      en: 'Give the app a **proper site address**, not only the host’s default URL: buy a domain, wire DNS so the app loads on a human-readable name with HTTPS.',
    },
    detailBullets: [
      {
        ru: 'Регистратор и зона **по решению продукта**; проверка доступности имени; продление и владелец записей — зафиксировать в документации команды.',
        en: 'Registrar and TLD — **product decision**; name availability; renewal and DNS ownership — captured in team docs.',
      },
      {
        ru: 'Связка с **Vercel** (или текущим пайплайном): домен в проекте, верификация, при необходимости перенос с прежнего URL.',
        en: 'Tie to **Vercel** (or current pipeline): project domain, verification, migrate from prior URL if needed.',
      },
      {
        ru: '**Доступ из РФ (#37):** оценить **Custom Domain** Supabase + свой домен SPA; при недостаточности — прокси или зеркало в РФ (см. **`web/README.md`** → «Доступ из РФ»).',
        en: '**Russia access (#37):** evaluate Supabase **Custom Domain** + product SPA domain; if insufficient — RU proxy or static mirror (see **`web/README.md`** → “Access from Russia”).',
      },
    ],
  },
  {
    id: 12,
    title: { ru: 'Процесс веток: dev → main', en: 'Branch flow: dev → main' },
    summary: {
      ru: 'Основная разработка в ветке **`dev`** (или согласованном эквиваленте); после тестирования — слияние в **`main`** как стабильная линия и источник продакшен-деплоя.',
      en: 'Day-to-day work on **`dev`** (or agreed equivalent); after testing — merge to **`main`** as the stable line and production deploy source.',
    },
    plain: {
      ru: 'Чтобы не ломать прод «полпути», договориться: новые фичи и правки копятся в **отдельной ветке**, проверяются, и только потом попадают в **основную**, откуда уходит сборка для пользователей.',
      en: 'Agree a rhythm so production isn’t broken mid-flight: features land on a **working branch**, get verified, then merge to **main** where the user-facing build comes from.',
    },
    detailBullets: [
      {
        ru: 'Зафиксировать в репозитории: правила PR, кто мержит в `main`, минимальный набор проверок перед слиянием (линт, ручной смоук — по команде).',
        en: 'Document in-repo: PR rules, who merges to `main`, minimum checks before merge (lint, manual smoke — team call).',
      },
      {
        ru: 'Согласовать с **`obsidian-motivator/14-V1-минимальный-запуск-Vercel.md`**: какая ветка триггерит preview vs production.',
        en: 'Align with **`obsidian-motivator/14-V1-минимальный-запуск-Vercel.md`**: which branch triggers preview vs production.',
      },
    ],
  },
  {
    id: 13,
    title: { ru: 'Дизайн и адаптивность', en: 'Design & responsiveness' },
    summary: {
      ru: 'Проработка визуального слоя и макета: единый стиль, типографика и отступы; комфорт на **широких экранах** (сетка, использование ширины, читаемые колонки); полировка под **мобильные** и узкие окна (touch, навигация, модалки и формы без горизонтального скролла). **Отдельно — продуктовая доводка представления задач** во **вкладке «Неделя»** и **календаре месяца:** как они рисуются во времени, нужен ли таймлайн, что делать с прошедшим слотом и невыполненным, как не прятать важное без выбора пользователя.',
      en: 'Visual and layout pass: cohesive styling, typography, spacing; **wide-screen** treatment (grid, width usage, readable columns); polish for **mobile** and narrow viewports (touch targets, navigation, modals/forms without sideways scroll). **Plus a product pass on how tasks read in the Week** and **Month calendar:** layout in time, optional timeline, past slots and incomplete work, done vs not — without hiding things the user did not choose to filter away.',
    },
    plain: {
      ru: 'Сделать интерфейс не только рабочим, но и аккуратным: чтобы на большом мониторе не было пустоты «узкой колонкой посередине без смысла» и чтобы на телефоне всё можно было нажать пальцем и прочитать без прищуривания. Для **недели** и **месяца** — отдельно договориться, **как визуально вести себя задачи** (включая «уже прошло, но не закрыто»), чтобы планировщик не врал и не пугал зря.',
      en: 'Make the UI not only functional but tidy: on a large monitor avoid an accidental “tiny strip in the middle,” and on a phone keep taps comfortable and text readable. For **Week** and **Month**, explicitly decide **how tasks should look** (including “time passed but still open”) so the planner stays honest and calm.',
    },
    detailBullets: [
      {
        ru: '**Как отображаются задачи** в календаре месяца и в недельной сетке: плотность ячеек, обрезка заголовка, цвет/полоска, время, признак выполнения, согласованность с активными **фильтрами** и информером.',
        en: '**How tasks render** in the month grid and week grid: cell density, title truncation, color bar, clock time, done state, consistency with active **filters** and the informer.',
      },
      {
        ru: '**Таймлайн:** решение продукта — оставить только почасовую сетку недели как сейчас, добавить отдельный **режим «линия дня»**, или комбинировать; критерии — читаемость на desktop/mobile и отсутствие лишнего шума.',
        en: '**Timeline:** product decision — keep the hourly week grid only, add a **day timeline** mode, or combine; success criteria — readability on desktop/mobile without clutter.',
      },
      {
        ru: '**Прошедшее время и статусы:** если интервал задачи **уже прошёл**, но задача **не выполнена** — как подсветить (например «просрочено» / «осталось») и давать ли **мягкое напоминание в интерфейсе** (не push); **выполненные** в том же календарном дне — как отличать от невыполненных, чтобы не смешивать с долгом.',
        en: '**Past time & status:** if the slot **already passed** but the task is **still open** — highlight rules (e.g. overdue vs still actionable) and optional **soft in-app nudge** (not push); **completed** tasks that day — distinct styling so “done” does not read as debt.',
      },
      {
        ru: '**Скрытие задач:** явная политика — скрывает только **выбранный фильтр** (группа, приоритет и т.д.); по умолчанию не «прятать» просрочку без явного действия пользователя; границы **плана на дату** vs **бэклог** — как в ТЗ; при необходимости подпись «есть скрытые по фильтру».',
        en: '**Hidden tasks:** explicit policy — only **active filters** hide items (group, priority, etc.); don’t silently hide overdue work; **planned-for-date** vs **backlog** boundaries per TZ; optional hint when rows are filtered out.',
      },
      {
        ru: 'Аудит ключевых экранов (`/app`, неделя, месяц, отчёты, настройки): брейкпоинты Tailwind, предсказуемые отступы и иерархия заголовков.',
        en: 'Audit core screens (`/app`, week, month, reports, settings): Tailwind breakpoints, consistent spacing and heading hierarchy.',
      },
      {
        ru: 'Широкие вьюпорты: осмысленное использование ширины (например вторичные колонки, ограничение `max-width`, выравнивание панелей), без поломки текущих сценариев.',
        en: 'Large viewports: purposeful use of width (e.g. secondary columns, sensible `max-width`, panel alignment) without breaking existing flows.',
      },
      {
        ru: 'Мобильные и тач: минимальные размеры зон нажатия, безопасные отступы от краёв, прокрутка модалок и длинных форм, проверка в PWA.',
        en: 'Mobile & touch: minimum tap targets, safe area padding, modal/long-form scrolling, smoke-test in PWA.',
      },
      {
        ru: 'Согласовать с существующей тёмной темой и токенами цвета; при необходимости — лёгкая дизайн-спека в репозитории (без обязательного Figma).',
        en: 'Align with the existing dark theme and color tokens; optional lightweight design notes in-repo (Figma not mandatory).',
      },
      {
        ru: 'После закрытия этой фазы (и фаз **7–12**) — **`1.0.0`** в `web/package.json` и публичный контракт версий по политике репозитория.',
        en: 'After this phase (and phases **7–12**) — ship **`1.0.0`** in `web/package.json` and the public version contract per repo policy.',
      },
    ],
  },
]

/**
 * Идеи после MVP: **тематические группы** и порядок внутри (`ideaLaterGroup` / `ideaLaterOrder`); в UI — секции по `ROADMAP_IDEAS_LATER_GROUP_ORDER` и функция `groupIdeasLaterForDisplay`.
 * Источник правды для расширения списка — `obsidian-motivator/15-Идеи-для-развития.md` (синхронизировать при добавлении разделов).
 */
export const IDEAS_LATER_ENTRIES: RoadmapIdeaEntry[] = [
  {
    ideaLaterGroup: 'postmvp_intro',
    ideaLaterOrder: 0,
    title: { ru: 'После релиза 1.0', en: 'After the 1.0 release' },
    summary: {
      ru: 'Всё ниже — черновой backlog без сроков и без обещаний в текущем MVP. Полный набор направлений см. также **`obsidian-motivator/15-Идеи-для-развития.md`**.',
      en: 'Everything below is an informal backlog — no dates and no MVP commitment. See also **`obsidian-motivator/15-Идеи-для-развития.md`** for the full idea pool.',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 10,
    title: {
      ru: 'Первичный вход: страница настройки приложения',
      en: 'First launch: app setup screen',
    },
    summary: {
      ru: 'После MVP: при **первом** успешном входе (после разблокировки vault при необходимости) показывать **экран первичной настройки**: язык интерфейса, названия приоритетов по умолчанию, участие в ритуале EOD, короткий обзор вкладок — точный состав и обязательность шагов зафиксировать в продукте; до завершения или явного «пропустить» считать онбординг незавершённым.',
      en: 'Post-MVP: on **first** successful session (after vault unlock when applicable), show a **first-run setup** screen — UI language, default priority labels, EOD opt-in, short tab tour — exact steps TBD; treat onboarding as incomplete until the user finishes or explicitly skips.',
    },
    detailBullets: [
      {
        ru: 'Источник флага «первый вход»: `localStorage`, `user_metadata` / `app_metadata` в Supabase или поле в vault; не должен мешать восстановлению по seed и миграциям.',
        en: '“First launch” flag: `localStorage`, Supabase `user_metadata` / `app_metadata`, or a vault field; must not break seed restore or migrations.',
      },
      {
        ru: 'Черновик в **`obsidian-motivator/15-Идеи-для-развития.md`**, §15.',
        en: 'Draft in **`obsidian-motivator/15-Идеи-для-развития.md`**, §15.',
      },
    ],
  },
  {
    ideaLaterGroup: 'collaboration_integrations',
    ideaLaterOrder: 10,
    title: {
      ru: 'Командные задачи и группы совместной работы',
      en: 'Team tasks and collaborative groups',
    },
    summary: {
      ru: 'После MVP: возможность создавать **группы людей** для совместных задач — общие активности на конкретное время или регулярные цели на день/неделю. Участники группы видят прогресс друг друга, могут оставлять комментарии, советы и делиться результатами/впечатлениями.',
      en: 'Post-MVP: create **collaborative groups** for shared tasks — scheduled activities and recurring day/week goals. Group members can see each other’s progress, leave comments/advice, and share outcomes/retrospective notes.',
    },
    detailBullets: [
      {
        ru: 'Нужны отдельные продуктовые решения: модель ролей (владелец/участник), приватность внутри группы, видимость личных задач и защита от давления/сравнений.',
        en: 'Requires explicit product decisions: role model (owner/member), in-group privacy, personal-task visibility, and anti-pressure guardrails.',
      },
      {
        ru: 'Канал взаимодействия в MVP+1: комментарии к задаче/дню, короткие отчёты о результате, реакции; без смешивания с личным vault без явного согласия.',
        en: 'Candidate interaction scope for MVP+1: task/day comments, short outcome notes, lightweight reactions; no implicit mixing with private vault data.',
      },
      {
        ru: 'Черновик — **`obsidian-motivator/15-Идеи-для-развития.md`**, §18.',
        en: 'Draft — **`obsidian-motivator/15-Идеи-для-развития.md`**, §18.',
      },
    ],
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 20,
    title: {
      ru: 'Напоминания о неиспользованных функциях (feature discovery)',
      en: 'Unused-feature hints (feature discovery)',
    },
    summary: {
      ru: 'Мягко показывать возможности приложения, которыми пользователь ещё не пользовался — без спама; учёт событий в клиенте (`localStorage` / vault), контекстные подсказки и отключение в настройках.',
      en: 'Gently surface features the user hasn’t tried yet — no spam; client-side event hints (`localStorage` / vault), contextual nudges, opt-out in settings.',
    },
    detailBullets: [
      {
        ru: 'Черновик в **`obsidian-motivator/15-Идеи-для-развития.md`**, §1.',
        en: 'Draft in **`obsidian-motivator/15-Идеи-для-развития.md`**, §1.',
      },
    ],
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 20,
    title: { ru: 'Область «Привычки»', en: 'A dedicated «Habits» area' },
    summary: {
      ru: 'Сущность отличная от разовых задач: повторы с собственным потоком и, возможно, моделью в vault; вопросы про идентичность, частоту и лимит времени на день.',
      en: 'An entity distinct from one-off tasks: repeats with their own flow and possibly vault schema; prompts about identity, cadence, and daily time budget.',
    },
    detailBullets: [
      {
        ru: 'Связь с end-of-day, отчётами и push — после ядра MVP; см. **`15-Идеи-для-развития.md`**, §2.',
        en: 'Ties to EOD, reports, push — post-core MVP; see **`15-Идеи-для-развития.md`**, §2.',
      },
    ],
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 30,
    title: {
      ru: 'Однодневные «пункты дня» (лёгкие привычки)',
      en: 'Daily one-off check-ins (lightweight habits)',
    },
    summary: {
      ru: 'После MVP: отмечать за календарный день **отдельные цели** вроде «день без …» рядом с задачами — без полной модели повторов, оценки и времени; пересечение с областью **«Привычки»** и ритуалом EOD — отдельное продуктовое решение.',
      en: 'Post-MVP: mark lightweight daily goals (e.g. a “streak day”) alongside tasks—without full repeats, estimates, or timeblocking; product alignment with **Habits** and EOD is TBD.',
    },
    detailBullets: [
      {
        ru: 'Формулировка из обратной связи GitHub **#4**; при переносе в Obsidian сверить с **`15-Идеи-для-развития.md`** (§ про привычки).',
        en: 'Wording from GitHub feedback **#4**; when mirroring to Obsidian, align with **`15-Идеи-для-развития.md`** (habits section).',
      },
    ],
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 35,
    title: { ru: 'Настройки: drag-and-drop приоритетов и групп', en: 'Settings: drag-and-drop priorities and groups' },
    summary: {
      ru: 'Перетаскивание для смены порядка групп и «критичности» приоритетов (1–5) без ручного ввода номеров — GitHub **#27**.',
      en: 'Drag-and-drop to reorder groups and priority ranks (1–5) without retyping levels — GitHub **#27**.',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 40,
    title: { ru: 'Поиск по задачам', en: 'Task search' },
    summary: {
      ru: 'Поле поиска по загруженному vault: заголовок, при необходимости группа, теги, текст чек-листа — только на клиенте, без отправки запросов на сервер в явном виде.',
      en: 'Search field over the decrypted vault: title, optionally group/tags/checklist text — client-only; no plaintext search queries to the server.',
    },
    detailBullets: [
      {
        ru: 'Дебаунс и опционально индекс в памяти при росте данных — см. **`15-Идеи-для-развития.md`**, §3.',
        en: 'Debounce and optional in-memory index as data grows — see **`15-Идеи-для-развития.md`**, §3.',
      },
      {
        ru: 'Пожелание GitHub **#5**: расширить поиск **фильтрами по группе и цвету** и добавить **сводную статистику** по найденным задачам (после базового поиска по названию на клиенте).',
        en: 'GitHub **#5** asks for **group/color filters** on search plus **aggregate stats** over matches (after baseline client-side title search).',
      },
    ],
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 45,
    title: {
      ru: 'Неделя: сетка по фактическим задачам и метка EOD',
      en: 'Week: grid from earliest task and EOD reminder marker',
    },
    summary: {
      ru: 'Пожелание GitHub **#44**: сетка недели **не обязана** показывать весь календарный день — от **раннего** слота до **позднего** + запас; при включённом **push напоминании** завершить день — **метка времени** на вкладках **День** и **Неделя**.',
      en: 'GitHub **#44**: week grid can **span only busy hours** (earliest to latest slot plus padding); with **EOD push reminder** on, show a **time marker** on **Day** and **Week**.',
    },
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 5,
    title: {
      ru: 'Доступность для РФ: деплой и API без VPN',
      en: 'Russia availability: deploy and API without VPN',
    },
    summary: {
      ru: 'После MVP / в связке с **фазой 12**: выкат **доступного из РФ** контура — свой домен, **Custom Domain** Supabase, **прокси** или **зеркало статики** + cron для push; критерий — вход, синхронизация vault и Web Push без VPN (GitHub **#37**).',
      en: 'Post-MVP / with **phase 12**: ship an **RU-reachable** stack — product domain, Supabase **Custom Domain**, **proxy** or **static mirror** + push cron; acceptance: sign-in, vault sync, and Web Push work without VPN (GitHub **#37**).',
    },
    detailBullets: [
      {
        ru: 'Варианты и чеклист — **`web/README.md`** («Доступ из РФ»); не путать с временным VPN для команды.',
        en: 'Options and checklist — **`web/README.md`** (“Access from Russia”); distinct from temporary team VPN.',
      },
    ],
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 6,
    title: {
      ru: 'Доступы: режим custom помимо ролей',
      en: 'Access: custom mode beyond fixed roles',
    },
    summary: {
      ru: 'После MVP: в разделе **«Доступы»** (`/admin/access`) — не только **user / beta_tester / admin**, но **гранулярные** флаги на возможности (прототипы, AI, push-cron, отдельные админ-экраны) без заведения новой роли на каждую комбинацию; хранение в `app_metadata` или отдельной таблице с аудитом.',
      en: 'Post-MVP: in **Access** (`/admin/access`) — not only **user / beta_tester / admin**, but **granular** toggles per capability (previews, AI, push cron, admin screens) without inventing a role per combo; store in `app_metadata` or a service table with audit.',
    },
    detailBullets: [
      {
        ru: 'Сейчас: фиксированные роли через Edge **`admin-motivator-roles`**; UI вынесен из **Настроек** в админ-панель.',
        en: 'Now: fixed roles via Edge **`admin-motivator-roles`**; UI moved out of **Settings** into the admin panel.',
      },
    ],
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 7,
    title: {
      ru: 'Админ: мониторинг посещений',
      en: 'Admin: visit analytics',
    },
    summary: {
      ru: 'Пожелание GitHub **#49**: пункт **«Мониторинг»** для **admin** — график посещений с фильтром по роли и периоду; нужны **события** на сервере (Edge/аналитика), приватность и согласование с **DR-007**.',
      en: 'GitHub **#49**: **Monitoring** for **admins** — visit chart with role and time filters; needs **server-side events** (Edge/analytics), privacy, alignment with **DR-007**.',
    },
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 10,
    title: {
      ru: '«Мои дефекты»: история обращений в настройках',
      en: '“My defects”: in-app submission history in settings',
    },
    summary: {
      ru: 'После MVP: пункт **«Мои дефекты»** — мини-карточки обращений, заведённых через приложение, со статусом (**исправлено** / **в плане** / **отклонено**) по метаданным GitHub или отдельной таблице; без утечки текста vault.',
      en: 'Post-MVP: a **“My defects”** entry — mini cards for in-app filings with status (**fixed** / **planned** / **declined**) from GitHub metadata or a service table; no vault plaintext leakage.',
    },
    detailBullets: [
      {
        ru: 'Описание сценария — feedback GitHub **#9**; потребуется контракт с GitHub (labels, state) или зеркало в Supabase.',
        en: 'Scenario from GitHub **#9**; needs a contract with GitHub (labels/state) or a Supabase mirror.',
      },
    ],
  },
  {
    ideaLaterGroup: 'collaboration_integrations',
    ideaLaterOrder: 52,
    title: { ru: 'Интеграция с будильником телефона', en: 'OS alarm integration' },
    summary: {
      ru: 'GitHub **#51**: опционально использовать **системные будильники** как канал напоминаний рядом с Web Push — отдельная настройка и ограничения платформ.',
      en: 'GitHub **#51**: optional **OS alarms** as a reminder channel alongside Web Push — separate setting and platform limits.',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 52,
    title: { ru: 'Конструктор виджетов вкладок', en: 'Per-view widget layout' },
    summary: {
      ru: 'GitHub **#52**: на **День / Неделя / Месяц** — настраиваемые блоки и кнопка **«Настройка вида»** для каждой вкладки.',
      en: 'GitHub **#52**: **Day / Week / Month** — configurable blocks and a **layout settings** control per tab.',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 53,
    title: { ru: 'День: горизонтальный таймлайн', en: 'Day: landscape timeline' },
    summary: {
      ru: 'GitHub **#53**: просмотр **дня** в **альбомной** ориентации с **таймлайном** (см. скрин в issue).',
      en: 'GitHub **#53**: **landscape** **day** view with a **timeline** (see issue screenshot).',
    },
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 8,
    title: { ru: 'Админ: единый трекер задач и обращений', en: 'Admin: unified work tracker' },
    summary: {
      ru: 'GitHub **#54**: админ-раздел — задачи, планы, обращения, дефекты, мониторинг в одном контуре (связь с **#49**).',
      en: 'GitHub **#54**: admin hub — tasks, plans, tickets, defects, monitoring (overlaps **#49**).',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 54,
    title: { ru: 'Слайдеры с фактами и статистикой', en: 'Insight carousels' },
    summary: {
      ru: 'GitHub **#55**: карусели с **полезными фактами** по аккаунту и приложению (не баг UI — продуктовый контент).',
      en: 'GitHub **#55**: carousels with **account** and **product** insights (content feature, not a layout defect).',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 55,
    title: { ru: '«Тайм-щит»: занятость и свободные окна', en: 'Time shield: busy vs free windows' },
    summary: {
      ru: 'GitHub **#56**: для пользователя — **тайм-щит** и статистика: когда чаще задачи, когда свободное время (на базе vault, клиент/отчёты).',
      en: 'GitHub **#56**: **time shield** for users — when tasks cluster vs free windows (vault analytics).',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 56,
    title: { ru: 'Неделя/месяц: инфоблоки вместо диаграмм', en: 'Week/month: info blocks vs charts' },
    summary: {
      ru: 'GitHub **#57**: альтернатива столбчатым диаграммам — **компактные информативные блоки** по задачам за период (см. скрин).',
      en: 'GitHub **#57**: alternative to bar charts — **compact info blocks** for the period (see screenshot).',
    },
  },
  {
    ideaLaterGroup: 'collaboration_integrations',
    ideaLaterOrder: 55,
    title: { ru: 'Режимы «команда» и «наставник»', en: 'Team and mentor modes' },
    summary: {
      ru: 'GitHub **#58**: **команда** — общий таск-трекер; **наставник** — помощник, который может заводить задачи в ваш план (политики доступа, vault).',
      en: 'GitHub **#58**: **team** shared tracker; **mentor** can add tasks to your plan (access policy, vault).',
    },
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 10,
    title: { ru: 'Темы и цветовая гамма', en: 'Themes and color schemes' },
    summary: {
      ru: 'GitHub **#59**: авто-подстройка **темы** под устройство и ручная настройка **палитры** интерфейса.',
      en: 'GitHub **#59**: **theme** sync with device settings and manual **palette** tuning.',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 50,
    title: { ru: 'Перенос незакрытой задачи и чек-листа', en: 'Moving an open task with checklist progress' },
    summary: {
      ru: 'После MVP: при **переносе** (или аналоге «переложить на другой день») **незакрытой** задачи, если **часть пунктов чек-листа уже выполнена**, переносить их как **отмеченные**; текст **выполненных** пунктов остаётся **доступен для правки** в модалке — чтобы можно было уточнить формулировку, не теряя факт «уже сделано».',
      en: 'Post-MVP: when **deferring** an **open** task, if **some checklist items are done**, carry them as **checked**; **completed** lines stay **editable** in the modal so wording can be refined without losing “already done.”',
    },
    detailBullets: [
      {
        ru: 'Уточнить продуктово: одноразовый перенос vs копия; как вести себя у **повторяющихся** задач и при **серии** — отдельное решение.',
        en: 'Product call: one-off defer vs duplicate; behavior for **repeats** and **series** — separate decision.',
      },
      {
        ru: 'Не сбрасывать прогресс чек-листа «молча» при смене даты без явного действия пользователя.',
        en: 'Don’t silently reset checklist progress when the planned date changes without an explicit user action.',
      },
      {
        ru: 'Черновик — **`obsidian-motivator/15-Идеи-для-развития.md`**, §13.',
        en: 'Draft — **`obsidian-motivator/15-Идеи-для-развития.md`**, §13.',
      },
    ],
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 20,
    title: { ru: 'Раздел «Тестирование» в настройках', en: 'Settings: testing / QA tools' },
    summary: {
      ru: 'Отдельная секция **только для администраторов и бета-тестеров**: переключатели и вспомогательные режимы, которые упрощают проверку приложения и сценариев; обычный пользователь раздел не видит. В той же зоне — **поле / кнопка «Завести дефект»**: форма отправки в **GitHub Issue** (основной целевой канал), см. отдельную карточку ниже и **§14** в Obsidian.',
      en: 'A **settings section for admins and beta testers only**: toggles and helpers to exercise flows and validate behavior; hidden from regular users. In the same area — a **“File a defect”** control: a form that creates a **GitHub Issue** (primary target sink); see the next card and Obsidian **§14**.',
    },
    detailBullets: [
      {
        ru: 'Доступ по ролям на сервере (`app_metadata.motivator_role`: **admin**, **beta_tester**); состав пунктов и название секции — при реализации.',
        en: 'Role-gated server-side (`app_metadata.motivator_role`: **admin**, **beta_tester**); section title and items — TBD at implementation.',
      },
      {
        ru: '**«Завести дефект»:** одна точка входа в настройках (и при необходимости дублирующая ссылка из шапки только для ролей QA) — открывает модалку или экран с полями; после успешной отправки показывать **ссылку на созданный GitHub Issue**.',
        en: '**“File a defect”:** one entry point in settings (optional duplicate in header for QA roles only) — modal or screen with fields; on success show a **link to the created GitHub Issue**.',
      },
      {
        ru: 'Поле выбора **«какую дату считать сегодня»** (override системной): вместо текущей даты ОС приложение везде берёт выбранную — план и бэклог на день, ритуал EOD, отчёты, стрики, просрочки; можно ставить задачи на любой день, отмечать выполнение или нет и проверять, как считает логика.',
        en: '**“Treat as today”** date picker (overrides system clock): the chosen local date replaces “now” everywhere day logic applies — day/backlog, EOD ritual, reports, streaks, overdue rules; plan tasks for any date, mark done or skip, and verify calculations.',
      },
      {
        ru: 'Другие примеры настроек (не полный список): ускорение или отключение ожиданий по DR-004, показ отладочных подписей, ослабление debounce синка для проверки конфликтов, экспорт последних операций с vault на клиенте.',
        en: 'Other possible options (examples): shorten/disable DR-004 wait windows, debug labels, relaxed sync debounce for conflict testing, export recent client-side vault ops.',
      },
      {
        ru: 'Предпочтительно хранить QA-флаги **локально** (например `localStorage`) или в профиле без записи в зашифрованный vault — чтобы тестовые режимы не утекали в бэкапы и не мешали обычным пользователям.',
        en: 'Prefer **local** QA flags (e.g. `localStorage`) or non-vault prefs so test modes never leak into encrypted backups or ordinary users’ data.',
      },
    ],
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 30,
    title: { ru: 'Дефекты из приложения (тестеры и админы)', en: 'In-app defect filing (testers & admins)' },
    summary: {
      ru: 'После MVP: для ролей **бета-тестер** и **администратор** — **форма «Завести дефект»** в интерфейсе (заголовок, описание, шаги воспроизведения, опционально скриншот/контекст экрана). **Основной канал назначения** — создание **GitHub Issue** в выбранном репозитории через **серверный** вызов API (токен не в клиенте); после отправки — **прямая ссылка** на issue.',
      en: 'Post-MVP: for **beta tester** and **admin** — a **“File a defect”** form (title, description, repro steps, optional screenshot/screen context). **Primary sink** — create a **GitHub Issue** in a chosen repo via a **server-side** API call (no client token); on success — a **direct link** to the issue.',
    },
    detailBullets: [
      {
        ru: '**GitHub:** репозиторий и метки по умолчанию (`bug`, `from-app` и т.д.) — конфиг на сервере; **GitHub App** или **fine-grained PAT** только в Edge Function / бэкенде; шаблон тела issue (markdown) с блоками «Окружение»: `APP_VERSION`, маршрут, локаль, user id (без email в открытую — по политике).',
        en: '**GitHub:** default repo & labels (`bug`, `from-app`, etc.) — server config; **GitHub App** or **fine-grained PAT** only in Edge Functions / backend; issue body template (markdown) with an **Environment** block: `APP_VERSION`, route, locale, user id (email policy — product/legal).',
      },
      {
        ru: '**Клиент** вызывает только **Supabase Edge Function** (или аналог) с JWT пользователя; функция проверяет роль и дергает **`POST /repos/{owner}/{repo}/issues`**; лимиты API и обработка ошибок — в ответе UI.',
        en: 'The **client** calls only a **Supabase Edge Function** (or equivalent) with the user JWT; the function checks the role then **`POST /repos/{owner}/{repo}/issues`**; handle rate limits/errors in the UI response.',
      },
      {
        ru: 'Резервный канал (таблица Supabase, почта) — если GitHub недоступен или для закрытой волны без доступа к репо.',
        en: 'Fallback (Supabase table, email) if GitHub is unavailable or for a wave without repo access.',
      },
      {
        ru: 'Автоподстановка **версии приложения** (`APP_VERSION` / build), маршрута, локали; **не** отправлять содержимое vault в явном виде без явного согласия пользователя.',
        en: 'Auto-fill **app version** (`APP_VERSION` / build), route, locale; **never** ship vault plaintext without explicit user consent.',
      },
      {
        ru: 'Черновик и **план этапов** — **`obsidian-motivator/15-Идеи-для-развития.md`**, §14.',
        en: 'Draft plus **implementation phases** — **`obsidian-motivator/15-Идеи-для-развития.md`**, §14.',
      },
    ],
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 40,
    title: { ru: 'Тестовые аккаунты с простым seed', en: 'Test accounts with a simple seed' },
    summary: {
      ru: 'После MVP: выделенные учётки для ручных прогонов и регрессии, где **seed шифрования vault намеренно простой** (короткая известная фраза) — чтобы быстро воспроизводить один и тот же расшифрованный контекст без роли как «боевого» пользователя.',
      en: 'Post-MVP: dedicated accounts for manual runs and regression where the **vault encryption seed is deliberately simple** (a short known passphrase) — reproducible decrypted context without pretending to be a production user profile.',
    },
    detailBullets: [
      {
        ru: 'Только для **внутренней** QA/автотестов (отдельные логины Supabase или изолированное окружение); не продвигать как норму безопасности для людей.',
        en: '**Internal** QA/automation only (separate Supabase logins or isolated env); never marketed as good security hygiene for real users.',
      },
      {
        ru: 'Ротация seed при утечке, запрет слияния таких vault с личными бэкапами — политика при реализации.',
        en: 'Rotate seeds if leaked; forbid merging these vaults with personal backups — policy at implementation.',
      },
      {
        ru: 'Черновик — **`obsidian-motivator/15-Идеи-для-развития.md`**, §9.',
        en: 'Draft — **`obsidian-motivator/15-Идеи-для-развития.md`**, §9.',
      },
    ],
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 50,
    title: { ru: 'Вход через сторонние сервисы (OAuth)', en: 'Sign-in via third-party providers (OAuth)' },
    summary: {
      ru: 'После MVP: авторизация не только по email и паролю, но и через **провайдеров** — например **Яндекс** и **Google** (типовой путь **OAuth** / federated login в **Supabase Auth**).',
      en: 'Post-MVP: auth beyond email/password via **identity providers** — e.g. **Yandex** and **Google** (standard **OAuth** / federated login with **Supabase Auth**).',
    },
    detailBullets: [
      {
        ru: 'Настройка провайдеров в консоли Supabase (или аналога), кнопки «Войти через …» на экране входа, политика **связки** нескольких способов входа с одним пользователем — при реализации.',
        en: 'Provider setup in Supabase (or equivalent), “Continue with …” on sign-in, **account linking** policy — at implementation.',
      },
      {
        ru: 'Клиентское шифрование vault **не заменяется** OAuth: seed для vault по-прежнему задаёт пользователь; что показывать при первом входе через провайдера — отдельный UX-проход.',
        en: 'Client-side vault crypto is **unchanged** by OAuth — users still supply the vault seed; first-login-through-provider UX is a separate pass.',
      },
      {
        ru: 'Юридика и согласие на передачу минимальных данных провайдеру — по юрисдикции и DR.',
        en: 'Legal/consent for minimal provider data sharing — jurisdiction and DR.',
      },
      {
        ru: 'Черновик — **`obsidian-motivator/15-Идеи-для-развития.md`**, §10.',
        en: 'Draft — **`obsidian-motivator/15-Идеи-для-развития.md`**, §10.',
      },
    ],
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 60,
    title: { ru: 'Обновить после новой версии (сброс кэша)', en: 'Refresh after new version (cache bust)' },
    summary: {
      ru: 'После MVP: если клиент видит, что **версия приложения на сервере новее**, чем у уже загруженной вкладки — показать **аккуратную кнопку** (или баннер) **«Обновить»**, по нажатию — **перезагрузка страницы со сбросом кэша** статики и актуализацией **service worker**, чтобы пользователь не застревал на старом бандле после деплоя.',
      en: 'Post-MVP: when the client detects the **shipped app version is newer** than the loaded tab — show a subtle **Update** button or banner; on click, **reload with cache bypass** for static assets and refresh the **service worker** so users don’t stay on a stale bundle after deploy.',
    },
    detailBullets: [
      {
        ru: 'Источник версии — например **`APP_VERSION`** из сборки (`vite`), сравнение с последней сохранённой в **`localStorage`** или из ответа `/meta`; точная схема — при реализации.',
        en: 'Version source — e.g. **`APP_VERSION`** from `vite` build vs last seen in **`localStorage`** or a lightweight **`/meta`** endpoint; exact scheme — at implementation.',
      },
      {
        ru: 'Для **PWA**: договориться о **`skipWaiting`** / перезапуске контроллера без потери несинхронизированного vault — не форсить перезагрузку в опасный момент.',
        en: 'For **PWA**: define **`skipWaiting`** / controller swap rules without forcing reload while unsynced vault work is pending.',
      },
      {
        ru: 'Черновик — **`obsidian-motivator/15-Идеи-для-развития.md`**, §11.',
        en: 'Draft — **`obsidian-motivator/15-Идеи-для-развития.md`**, §11.',
      },
    ],
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 60,
    title: { ru: 'Ритуал «Завершение дня»: поля рефлексии', en: 'End-of-day ritual: reflection inputs' },
    summary: {
      ru: 'После MVP: ответы на мягкие вопросы прямо в модалке, хранение в vault или отдельном слое, сводки за неделю/месяц для ретроспективы без самобичевания.',
      en: 'Post-MVP: answer gentle prompts in the modal, persist to vault or a side channel, weekly/monthly summaries for blame-free retrospectives.',
    },
    detailBullets: [
      {
        ru: 'Вопросы из текущей подсказки CPT и расширения по продукту; экспорт или отчёт «что менялось в ответах» — по приоритету.',
        en: 'Prompts based on current CPT-style hints and product design; export or “what changed in answers” reporting — TBD.',
      },
    ],
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 70,
    title: { ru: 'Диаграммы: отчёты и вкладка «День»', en: 'Charts: reports vs Day tab' },
    summary: {
      ru: '**`/app/reports`** — столбчатая диаграмма по дням; вкладки **«День»**, **«Неделя»**, **«Месяц»** — кольца прогресса плана (**реализовано**). Дальнейшие визуализации (тренды, сравнение периодов) — по приоритету после 1.0.',
      en: '**`/app/reports`** — per-day bar chart; **Day**, **Week**, and **Month** tabs — plan progress rings (**shipped**). Further charts (trends, period compare) — prioritized post-1.0.',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 80,
    title: { ru: 'Цвет метки — как мини-группа (название и описание)', en: 'Label color as a mini-group (name & description)' },
    summary: {
      ru: 'После MVP: настройка **цветовых меток** не только как оттенок на карточке, а как сущность со **своим названием и описанием** (по смыслу близко к группе проектов, но привязка к цвету): одна точка настроек, текст в подсказках и при фильтрации.',
      en: 'Post-MVP: **color labels** become more than a swatch — each has an optional **display name and description** (group-like semantics tied to a color): centralized settings, copy in tooltips and when filtering.',
    },
    detailBullets: [
      {
        ru: 'Данные в vault: таблица или расширение схемы «ключ цвета → подпись, описание»; миграция с текущей фиксированной палитры в `@motivator/core`.',
        en: 'Vault payload: map **color key → label, description**; migrate from today’s fixed palette in `@motivator/core`.',
      },
      {
        ru: 'Связать с фильтром по цвету, легендой месяца и отчётами, чтобы описание работало в интерфейсе, а не только в настройках.',
        en: 'Wire into color filters, month legend, and reports so the text surfaces where users look.',
      },
    ],
  },
  {
    ideaLaterGroup: 'collaboration_integrations',
    ideaLaterOrder: 20,
    title: { ru: 'Интеграция с внешними календарями', en: 'External calendar integration' },
    summary: {
      ru: 'После MVP: связка с **Google Calendar**, **Outlook / Microsoft 365**, **Apple/iCloud** и системными календарями — один временной контур; варианты **ICS** (файл / подписка по защищённой ссылке).',
      en: 'Post-MVP: tie to **Google Calendar**, **Outlook / Microsoft 365**, **Apple/iCloud**, and OS calendars — one timeline; **ICS** file or secure subscribe URL.',
    },
    detailBullets: [
      {
        ru: 'Развёрнутый черновик требований и ограничений уже есть в репозитории: **`obsidian-motivator/15-Идеи-для-развития.md`**, раздел **«Интеграция с внешними календарями»**; в объём MVP по `03-Scope-MVP-и-бэклог` не входит.',
        en: 'Full draft lives in **`obsidian-motivator/15-Идеи-для-развития.md`** (**External calendars** section); outside MVP Scope.',
      },
      {
        ru: 'При клиентском шифровании vault нужна явная политика: что синхронизируется наружу, как разруливаются конфликты с облаком календаря.',
        en: 'With client-side vault crypto, product must define outbound fields and conflict rules vs cloud calendars.',
      },
    ],
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 30,
    title: { ru: 'Презентационная страница (лендинг)', en: 'Marketing / landing page' },
    summary: {
      ru: 'Публичная страница о приложении: зачем оно, базовые возможности, новости — и вход в регистрацию без открытия планировщика.',
      en: 'A public page about the app: purpose, core features, news — plus sign-up without opening the planner shell.',
    },
    detailBullets: [
      {
        ru: 'Отдельный маршрут (до или рядом с `/app`): регистрация, краткий онбординг, ссылки на политики.',
        en: 'Dedicated route (before or alongside `/app`): sign-up, short onboarding, legal links.',
      },
      {
        ru: 'Блок новостей или релиз-нот для пользователей без доступа к GitHub (можно связать с RELEASE_NOTES_BLOCKS или CMS).',
        en: 'News / release notes for users without GitHub access (may tie to RELEASE_NOTES_BLOCKS or a CMS).',
      },
      {
        ru: 'Роль **бета-тестер** (`app_metadata.motivator_role`, рядом с admin/user): закрытая волна регистраций, канал обратной связи с продактом; от обычного пользователя — расширенный доступ к экспериментальным функциям или каналу новостей (уточняется при реализации).',
        en: '**Beta tester** role (`app_metadata.motivator_role`, alongside admin/user): invite-only waves, feedback loop with product; vs regular users — optional early/experimental features or news channel (TBD at implementation).',
      },
    ],
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 40,
    title: { ru: 'Документация и руководство пользователя', en: 'In-app docs & user guide' },
    summary: {
      ru: 'После MVP: отдельная **страница или раздел «Справка / Руководство»** внутри приложения (или по публичной ссылке с тем же брендингом) — структурированное описание экранов, планирования, повторов, отчётов, seed и безопасности **простым языком**, с поиском по разделам и ссылками из подсказок в UI.',
      en: 'Post-MVP: a dedicated **Help / User guide** area inside the app (or a branded public URL) — structured plain-language coverage of screens, planning, repeats, reports, seed & safety, with section search and links from in-app hints.',
    },
    detailBullets: [
      {
        ru: 'Не дублировать полностью **лендинг** (карточка «Презентационная страница»): лендинг — «зачем зайти», руководство — «как пользоваться после входа»; можно перекрёстно ссылаться.',
        en: 'Don’t fully duplicate the **landing** card: landing = “why sign up,” guide = “how to use after login”; cross-link instead.',
      },
      {
        ru: 'Контент: **Markdown** в репозитории, headless CMS, или генерируемая страница из i18n — по ресурсам; **ru/en** в паре с приложением.',
        en: 'Content: **Markdown** in-repo, headless CMS, or i18n-driven pages — team choice; **ru/en** aligned with the app.',
      },
      {
        ru: 'Черновик — **`obsidian-motivator/15-Идеи-для-развития.md`**, §16.',
        en: 'Draft — **`obsidian-motivator/15-Идеи-для-развития.md`**, §16.',
      },
    ],
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 90,
    title: { ru: 'Режим «Напоминание» (не задача)', en: '“Reminder” mode (not a tracked task)' },
    summary: {
      ru: 'После MVP: отдельный **режим записи** рядом с обычной задачей — **напоминание о чём-либо**: не ведёт себя как полноценная задача (без обязательной оценки, без «выполнено» как долга, **не участвует** в отчётах/стрике/EOD как невыполненный план), но может **показываться в дне** или в списке как лёгкая **записка** с датой/временем.',
      en: 'Post-MVP: a separate **entry mode** next to a normal task — a **reminder about something**: not a full task (no mandatory estimate, no “done” debt framing, **skipped** in reports/streak/EOD as unclosed plan), yet can **surface on a day** or list as a light **note** with date/time.',
    },
    detailBullets: [
      {
        ru: 'Согласовать с **бэклогом** и **заметками**: не размножить сущности; возможно один флаг в vault + особые правила отображения и фильтра «только напоминания».',
        en: 'Align with **backlog** and **notes** entities — avoid sprawl; possibly one vault flag + special rendering and a “reminders only” filter.',
      },
      {
        ru: 'Опционально **push** или тихий баннер в день — отдельное решение; не превращать в второй календарь событий.',
        en: 'Optional **push** or a quiet day banner — separate call; don’t become a second event calendar.',
      },
      {
        ru: 'Черновик — **`obsidian-motivator/15-Идеи-для-развития.md`**, §17.',
        en: 'Draft — **`obsidian-motivator/15-Идеи-для-развития.md`**, §17.',
      },
    ],
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 50,
    title: { ru: 'Опросник приоритетов', en: 'Priority survey' },
    summary: {
      ru: 'Узнать у пользователей, что иметь в виду в первую очередь, а что можно отложить.',
      en: 'Ask users what to tackle first and what can wait.',
    },
    detailBullets: [
      {
        ru: 'Опрос или форма (в приложении, по ссылке или рассылке): кандидаты в улучшения с ответами вроде «скорее / позже / не важно».',
        en: 'Survey or form (in-app, link, or email): improvement candidates with answers like “sooner / later / not important”.',
      },
      {
        ru: 'Результаты — ориентир для бэклога после **1.0**, без обязательства сделать всё по голосованию.',
        en: 'Results inform the post-**1.0** backlog — no obligation to ship everything by vote.',
      },
    ],
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 100,
    title: { ru: 'Цели и шаблоны', en: 'Goals and templates' },
    summary: {
      ru: 'Два разных направления планирования «над» отдельными задачами.',
      en: 'Two distinct directions for planning above single tasks.',
    },
    detailBullets: [
      {
        ru: 'Глобальные цели: горизонт квартал/год, связь с календарём и планом.',
        en: 'Global goals: quarter/year horizon, linkage to calendar and plan.',
      },
      {
        ru: 'Шаблоны задач: сохранённые заготовки полей для быстрого создания похожих задач.',
        en: 'Task templates: saved field presets to spawn similar tasks quickly.',
      },
      {
        ru: 'К форме создания по шаблону (после MVP): настройка **порядка полей** — какое поле где в модалке (перетаскивание / список), чтобы под разные типы задач показывать сначала главное.',
        en: 'For template-driven create (post-MVP): **field order** — which input appears where in the modal (reorder list / drag), so recurring task types surface the important fields first.',
      },
      {
        ru: 'Там же — **обязательность полей**: для шаблона или общего профиля помечать, что нужно заполнить до сохранения; точная модель (глобально vs на шаблон, исключения) — при реализации.',
        en: 'Same scope — **required fields**: per template or profile, mark what must be filled before save; exact model (global vs per-template, exceptions) — TBD at implementation.',
      },
      {
        ru: 'Черновик формулировок — **`obsidian-motivator/15-Идеи-для-развития.md`**, §8.',
        en: 'Draft wording — **`obsidian-motivator/15-Идеи-для-развития.md`**, §8.',
      },
    ],
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 15,
    title: { ru: 'Жесты: long-press', en: 'Gestures: long-press' },
    summary: {
      ru: 'Дополнительные действия или контекстное меню по долгому нажатию на карточки и элементы.',
      en: 'Extra actions or a context menu on long-press for cards and controls.',
    },
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 60,
    title: { ru: 'Геймификация', en: 'Gamification' },
    summary: {
      ru: 'Очки, уровни, награды — только после отдельной продуктовой проработки.',
      en: 'Points, levels, badges — only after a dedicated product pass.',
    },
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 70,
    title: { ru: 'Достижения', en: 'Achievements' },
    summary: {
      ru: 'После MVP: **достижения** — значки или вехи за осмысленные паттерны работы с планировщиком (первая неделя со стриком, закрытие давней задачи и т.п.), без давления и с возможностью **не показывать** блок в интерфейсе.',
      en: 'Post-MVP: **achievements** — badges or milestones for meaningful planner habits (first streak week, closing a long-standing task, etc.), low-pressure with an option to **hide** the feature.',
    },
    detailBullets: [
      {
        ru: 'Согласовать с карточкой **«Геймификация»**: достижения — про **узнаваемые вехи**, а не обязательную гонку за очками; не стыдить за перерывы.',
        en: 'Align with **Gamification**: achievements as **recognition milestones**, not a mandatory points race; no shame for gaps.',
      },
      {
        ru: 'Где хранить состояние разблокировок (vault vs метаданные профиля), уведомления о новом значке — при отдельной проработке.',
        en: 'Where unlock state lives (vault vs profile metadata), notification UX — separate design pass.',
      },
      {
        ru: 'Черновик — **`obsidian-motivator/15-Идеи-для-развития.md`**, §12.',
        en: 'Draft — **`obsidian-motivator/15-Идеи-для-развития.md`**, §12.',
      },
    ],
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 80,
    title: { ru: 'Персонаж-тамагочи и группы', en: 'Tamagotchi-style character & groups' },
    summary: {
      ru: 'Мягкая геймификация **без давления**: персонаж, потребности (настроение, «кормление» и т.д.), привязка к **группам задач** — что усиливает персонажа при выполнении; опционально отключить в настройках.',
      en: 'Soft gamification **without punishment**: a character with needs, **task-group** hooks for what “feeds” the avatar — all optional and disable-able.',
    },
    detailBullets: [
      {
        ru: 'Не превращать планировщик в игру; не наказывать за пропуски. Черновик — **`15-Идеи-для-развития.md`**, §5.',
        en: 'Don’t turn the planner into a game; no penalties for misses. Draft — **`15-Идеи-для-развития.md`**, §5.',
      },
    ],
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 110,
    title: { ru: 'Нагрузка и рабочее время', en: 'Workload and working hours' },
    summary: {
      ru: 'Мягкие подсказки, чтобы не перегружать день, без жёстких запретов.',
      en: 'Soft hints to avoid overload — no hard blocking.',
    },
    detailBullets: [
      {
        ru: 'Анти-выгорание: предупреждение при слишком длинных оценках подряд.',
        en: 'Anti-burnout: nudge when back-to-back estimates look too heavy.',
      },
      {
        ru: 'Рабочие часы в настройках: «остаток рабочего дня» для подсказок оценки вместо границы календарного дня.',
        en: 'Working hours in settings: “rest of workday” for estimate hints vs raw midnight boundary.',
      },
    ],
  },
  {
    ideaLaterGroup: 'reliability_accounts',
    ideaLaterOrder: 70,
    title: { ru: 'Нативные клиенты', en: 'Native clients' },
    summary: {
      ru: 'Отдельные приложения iOS/Android при наличии ресурсов; крипто — паритет с VAULT_CRYPTO_CONTRACT.',
      en: 'Dedicated iOS/Android apps when resources allow; crypto parity with VAULT_CRYPTO_CONTRACT.',
    },
  },
  {
    ideaLaterGroup: 'everyday_core',
    ideaLaterOrder: 120,
    title: { ru: 'Экран «День»: другие виды', en: 'Day screen: alternate views' },
    summary: {
      ru: 'Помимо списка — таймлайн по часам, компактные режимы, переключатель вида.',
      en: 'Beyond the list — hourly timeline, compact modes, view toggle.',
    },
    detailBullets: [
      {
        ru: 'Вертикальная шкала дня (как колонка недели): слоты по времени и блок «без времени».',
        en: 'Vertical day scale (like a week column): timed slots plus an “untimed” strip.',
      },
      {
        ru: 'Запоминание выбранного вида в localStorage или в настройках.',
        en: 'Persist the chosen view in localStorage or settings.',
      },
    ],
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 90,
    title: { ru: 'Подсказки через LLM (API)', en: 'LLM hints (API)' },
    summary: {
      ru: 'Внешние модели по API, свой ключ и провайдер — только после продуктовой и privacy-оценки.',
      en: 'External models via API, BYOK — only after product & privacy review.',
    },
    detailBullets: [
      {
        ru: 'При клиентском шифровании vault в промпт попадает только явно разрешённый контекст; без автоматической выгрузки vault.',
        en: 'With client-side vault encryption, only explicitly allowed context goes to prompts — no automatic full vault export.',
      },
    ],
  },
  {
    ideaLaterGroup: 'surface_ai_fun',
    ideaLaterOrder: 100,
    title: { ru: 'MCP и контекстные ассистенты', en: 'MCP & contextual assistants' },
    summary: {
      ru: 'Интеграции через Model Context Protocol или аналоги — отдельный слой от «сырого» HTTP API к LLM.',
      en: 'Integrations via MCP or similar — a different layer from direct LLM HTTP APIs.',
    },
    detailBullets: [
      {
        ru: 'Может сосуществовать с подсказками через API; протокол контекста и прямой вызов модели — разные сценарии для продукта и безопасности.',
        en: 'Can coexist with API-based hints; contextual protocol vs raw model calls differ for product and safety.',
      },
    ],
  },
]

/**
 * Сгруппировать идеи «на потом» для модалки: порядок групп — `ROADMAP_IDEAS_LATER_GROUP_ORDER`,
 * внутри группы — по `ideaLaterOrder` (меньше — выше). Без `ideaLaterGroup` запись попадает в `everyday_core`.
 */
export function groupIdeasLaterForDisplay(
  entries: RoadmapIdeaEntry[],
): { groupId: RoadmapIdeaLaterGroupId; ideas: RoadmapIdeaEntry[] }[] {
  const defaultGroup: RoadmapIdeaLaterGroupId = 'everyday_core'
  const byGroup = new Map<RoadmapIdeaLaterGroupId, RoadmapIdeaEntry[]>()
  for (const id of ROADMAP_IDEAS_LATER_GROUP_ORDER) {
    byGroup.set(id, [])
  }
  for (const e of entries) {
    const g = e.ideaLaterGroup ?? defaultGroup
    const bucket = byGroup.get(g) ?? byGroup.get(defaultGroup)!
    bucket.push(e)
  }
  for (const list of byGroup.values()) {
    list.sort((a, b) => (a.ideaLaterOrder ?? 500) - (b.ideaLaterOrder ?? 500))
  }
  return ROADMAP_IDEAS_LATER_GROUP_ORDER.map((groupId) => ({
    groupId,
    ideas: byGroup.get(groupId)!,
  })).filter((x) => x.ideas.length > 0)
}
