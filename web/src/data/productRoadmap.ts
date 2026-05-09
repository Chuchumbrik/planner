/**
 * Контент модалки «реализовано / план / релиз-ноты / идеи» в настройках.
 * Редактируйте при появлении новых фич и изменений scope MVP.
 */

export type LocalizedString = { ru: string; en: string }

/** Одна фаза MVP (реализованные и плановые используют одну форму). */
export type RoadmapMvpPhase = {
  id: number
  title: LocalizedString
  summary: LocalizedString
  detailBullets: LocalizedString[]
}

/** Идея после MVP: заголовок + кратко + список под раскрывашкой */
export type RoadmapIdeaEntry = {
  title: LocalizedString
  summary: LocalizedString
  detailBullets?: LocalizedString[]
}

/** Короткие релиз-ноты для тестеров без доступа к GitHub (дата + пункты). */
export type RoadmapReleaseNoteBlock = {
  dateLabel: LocalizedString
  items: LocalizedString[]
}

/**
 * Фазы 0–6 по плану MVP — **уже в сборке** (фаза 6 — первая итерация EOD и связки отчётов;
 * DR-004 и полный набор анимаций — в `MVP_PHASES_PLANNED`). Номера совпадают с
 * `obsidian-motivator/17-План-реализации-MVP.md`.
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
        ru: 'Сборка Web + PWA (manifest, service worker); i18next ru/en, переключатель в настройках, ключ в localStorage.',
        en: 'Web + PWA (manifest, SW); i18next ru/en, settings toggle, localStorage key.',
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
        ru: 'Приоритеты 1–5 с названиями в vault; оценка часы+минуты; время начала XOR окончания (или без времени); пересечение слотов с подтверждением.',
        en: 'Priorities 1–5 with vault labels; estimate h+m; start XOR end time (or none); slot overlap confirmation.',
      },
      {
        ru: 'Модалка создания: подсказка обязательных полей для «Сохранить» (янтарный стиль); форма не сбрасывается при смене дня/фильтра группы, пока окно открыто.',
        en: 'Create modal: required-field hint for Save (amber); form persists when changing day/group filter while open.',
      },
      {
        ru: 'Черновики в vault; на `/app` один черновик — компактная секция, несколько — кнопка «Черновики» со счётчиком и модалка списка.',
        en: 'Vault drafts; on `/app` one draft — inline strip, several — “Drafts” button with count and list modal.',
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
    ],
  },
  {
    id: 6,
    title: { ru: 'Ритуал End-of-Day (первая итерация)', en: 'End-of-Day ritual (first iteration)' },
    summary: {
      ru: 'Кнопка «Завершить день», модалка DR-002, vault **v6** (`eodCompletedLocalDates`, `eodPreferences`), чекбокс участия задачи в ритуале; полный стрик DR-013 в отчётах после EOD. Лёгкая позитивная анимация блока при завершении. **Остаётся по фазе 6:** DR-004 и минимум двух пар анимаций тона по ТЗ — в блоке «план».',
      en: '“Finish day” button, DR-002 modal, vault **v6** (`eodCompletedLocalDates`, `eodPreferences`), per-task ritual toggle; full DR-013 streak in reports after EOD. Light positive motion on completion. **Still for phase 6:** DR-004 and two tone-pair animations per spec — see planned block.',
    },
    detailBullets: [
      {
        ru: 'Глобальный вкл/выкл кнопки EOD в настройках; запись локальной даты завершения ритуала.',
        en: 'Global EOD button toggle in settings; writes local ritual completion date.',
      },
      {
        ru: 'Связка с отчётами (фаза 5): стрик DR-013 использует даты EOD.',
        en: 'Tied to reports (phase 5): DR-013 streak uses EOD dates.',
      },
      {
        ru: 'Задел под роли (`motivatorRole`, `app_metadata.motivator_role`) без ограничений UI — см. план фазы 7.',
        en: 'Role hooks (`motivatorRole`, `app_metadata.motivator_role`) without UI gating — see phase 7 plan.',
      },
    ],
  },
]

/** Блоки релиз-нотов (обновляйте при значимых деплоях для тестеров). */
export const RELEASE_NOTES_BLOCKS: RoadmapReleaseNoteBlock[] = [
  {
    dateLabel: { ru: '2026-05-09', en: '2026-05-09' },
    items: [
      {
        ru: 'Версия продукта **0.6.1** (`package.json`): схема **`0·x·y`**, четвёртый слой — **`+git`**; ведущий **0** ≠ «только MVP» (см. `web/README.md`).',
        en: 'Product version **0.6.1** (`package.json`): **`0·x·y`** scheme, fourth layer is **`+git`**; leading **0** ≠ “MVP-only” (see `web/README.md`).',
      },
      {
        ru: 'Модалка дорожной карты: фазы **0–6** в «реализовано»; остаток фазы 6 (DR-004, анимации по ТЗ) — в «плане».',
        en: 'Roadmap modal: phases **0–6** under shipped; remainder of phase 6 (DR-004, spec animations) — under planned.',
      },
      {
        ru: 'Отчёты `/app/reports`: график отметок, KPI, стрик DR-013 с EOD, таблицы «часто проваленные» по DR-008.',
        en: '`/app/reports`: completion chart, KPI, DR-013 streak with EOD, often-missed tables (DR-008).',
      },
      {
        ru: 'Создание задачи: янтарная подсказка обязательных полей; черновики — одна секция или кнопка «Черновики» с модалкой; форма не сбрасывается при смене дня/фильтра.',
        en: 'Create task: amber required-field hints; drafts — inline strip or “Drafts” button with modal; form persists when changing day/filter.',
      },
      {
        ru: 'Неделя и карточки: полоска цвета через HEX палитры; время в селектах часы/минуты; чек-лист — новые пункты в конец списка.',
        en: 'Week & cards: color stripe via palette hex; time as hour/minute selects; checklist appends new items to the end.',
      },
    ],
  },
]

/**
 * Оставшийся охват до 1.0.0 (источник — `obsidian-motivator/17-План-реализации-MVP.md`).
 * Фазы 0–6 см. в `IMPLEMENTED_MVP_PHASES`; здесь — **остаток фазы 6** и фазы 7–10.
 */
export const MVP_PHASES_PLANNED: RoadmapMvpPhase[] = [
  {
    id: 6,
    title: { ru: 'Фаза 6 — остаток: DR-004 и анимации', en: 'Phase 6 — remainder: DR-004 & animations' },
    summary: {
      ru: 'Первая итерация EOD уже в сборке. Остаётся: **двойное подтверждение** по правилам задачи (**DR-004**) и **минимум двух пар** анимаций тона (успех / мягко при «не сделал») по ТЗ.',
      en: 'EOD first iteration is shipped. Still to do: task **double confirmation** (**DR-004**) and **at least two pairs** of tone animations (success / gentle “not done”) per spec.',
    },
    detailBullets: [
      {
        ru: 'DR-004 не смешивать с первой итерацией EOD — отдельный UX-поток.',
        en: 'Keep DR-004 separate from the first EOD iteration — dedicated UX flow.',
      },
      {
        ru: 'При необходимости — доработка состава задач ритуала и КПТ-банка под финальную модель.',
        en: 'Optional: refine ritual task set and CPT bank for the final model.',
      },
    ],
  },
  {
    id: 7,
    title: { ru: 'Настройки, аккаунт, юридика', en: 'Settings, account, legal' },
    summary: {
      ru: 'Настройки по блокам; пароль; seed; удаление и 30 дней; тексты; feedback; cookie. Роли и ограничения UI по permissions — отдельная доработка (см. буллеты ниже).',
      en: 'Grouped settings; password; seed; deletion & 30 days; legal; feedback; cookie. Role-based UI gating — separate pass (see bullets).',
    },
    detailBullets: [
      {
        ru: 'Отдельный экран или улучшенный поток онбординга seed (ТЗ §4).',
        en: 'Dedicated screen or improved seed onboarding flow (TZ §4).',
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
    detailBullets: [
      {
        ru: 'Целевое усиление после стабилизации модели событий и основных сценариев.',
        en: 'Target hardening after events model and main flows stabilize.',
      },
    ],
  },
  {
    id: 10,
    title: { ru: 'Релиз 1.0.0', en: '1.0.0 release' },
    summary: {
      ru: 'Чеклист ТЗ, semver 1.0.0, регрессия, деплой и документация.',
      en: 'TZ checklist, semver 1.0.0, regression, deploy and docs.',
    },
    detailBullets: [
      {
        ru: 'Закрытие Scope по 16-TZ и 03-Scope; актуализация Vercel/README.',
        en: 'Close Scope per 16-TZ and 03-Scope; refresh Vercel/README.',
      },
    ],
  },
]

/**
 * Идеи после MVP: порядок сверху вниз — рамка → тематические группы → платформы.
 * Связанные пункты объединены в одну карточку с «Подробнее»; ИИ разнесён на LLM и MCP.
 */
export const IDEAS_LATER_ENTRIES: RoadmapIdeaEntry[] = [
  {
    title: { ru: 'После релиза 1.0', en: 'After the 1.0 release' },
    summary: {
      ru: 'Всё ниже — черновой backlog без сроков и без обещаний в текущем MVP.',
      en: 'Everything below is an informal backlog — no dates and no MVP commitment.',
    },
  },
  {
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
    ],
  },
  {
    title: { ru: 'Жесты: long-press', en: 'Gestures: long-press' },
    summary: {
      ru: 'Дополнительные действия или контекстное меню по долгому нажатию на карточки и элементы.',
      en: 'Extra actions or a context menu on long-press for cards and controls.',
    },
  },
  {
    title: { ru: 'Геймификация', en: 'Gamification' },
    summary: {
      ru: 'Очки, уровни, награды — только после отдельной продуктовой проработки.',
      en: 'Points, levels, badges — only after a dedicated product pass.',
    },
  },
  {
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
    title: { ru: 'Нативные клиенты', en: 'Native clients' },
    summary: {
      ru: 'Отдельные приложения iOS/Android при наличии ресурсов; крипто — паритет с VAULT_CRYPTO_CONTRACT.',
      en: 'Dedicated iOS/Android apps when resources allow; crypto parity with VAULT_CRYPTO_CONTRACT.',
    },
  },
  {
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
