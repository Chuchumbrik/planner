/**
 * Контент модалки «реализовано / MVP / идеи» в настройках.
 * Редактируйте при появлении новых фич и изменений scope MVP.
 */

export type LocalizedString = { ru: string; en: string }

export type RoadmapImplementedBlock = {
  /** ISO-дата или короткая подпись периода */
  dateLabel: LocalizedString
  items: LocalizedString[]
}

/** Одна фаза плана MVP (см. obsidian-motivator/17-План-реализации-MVP.md). */
export type RoadmapMvpPhase = {
  id: number
  title: LocalizedString
  /** Короткая строка в общем списке фаз */
  summary: LocalizedString
  /** Детальные пункты — в дополнительной раскрывашке */
  detailBullets: LocalizedString[]
}

/** Идея после MVP: заголовок + кратко + список под раскрывашкой */
export type RoadmapIdeaEntry = {
  title: LocalizedString
  summary: LocalizedString
  detailBullets?: LocalizedString[]
}

/** Уже есть в текущей веб-сборке (хронология сверху — новее). */
export const IMPLEMENTED_BLOCKS: RoadmapImplementedBlock[] = [
  {
    dateLabel: { ru: '2026-05-09', en: '2026-05-09' },
    items: [
      {
        ru: 'Фаза 5 MVP: страница `/app/reports` — отчёты на клиенте (DR-007): график отметок, KPI, «часто проваленные» (DR-008); полный стрик DR-013 — после End-of-Day (фаза 6). Расчёты в `@motivator/core` (`vaultAnalytics`).',
        en: 'MVP phase 5: `/app/reports` — client-side reports (DR-007): completion chart, KPI, often-missed (DR-008); full DR-013 streak after End-of-Day (phase 6). Logic in `@motivator/core` (`vaultAnalytics`).',
      },
      {
        ru: 'Модалка создания задачи: подсказка обязательных полей для «Сохранить» в стиле блока черновиков (янтарь).',
        en: 'Create-task modal: required-field hint for Save styled like the drafts strip (amber).',
      },
      {
        ru: 'Черновики на /app: один черновик — компактная секция; несколько — кнопка «Черновики» со счётчиком и модальное окно со списком.',
        en: 'Drafts on /app: one draft — inline section; several — “Drafts” button with count and modal list.',
      },
      {
        ru: 'Форма создания не сбрасывается при смене выбранного дня или фильтра группы, пока модалка открыта (цвет и поля сохраняются).',
        en: 'Create form does not reset when changing selected day or group filter while the modal is open.',
      },
      {
        ru: 'Цвет задачи: полоска на мини-карточке и в недельной сетке через опорный HEX палитры (Tailwind не теряет классы из core).',
        en: 'Task color stripe on mini card and week grid via palette hex (Tailwind keeps core-driven colors).',
      },
      {
        ru: 'Блок «Время»: часы и минуты двумя списками в стиле UI вместо нативного time-picker; мини-карточка показывает время как часы:минуты.',
        en: 'Time block: hour/minute dropdowns instead of native picker; mini card shows clock as hours:minutes.',
      },
      {
        ru: 'Чек-лист: новые пункты в конец списка; отметки на мини-карточке дня/бэклога.',
        en: 'Checklist: new items append; toggles reflected on day/backlog mini cards.',
      },
    ],
  },
  {
    dateLabel: {
      ru: '2026 · ранняя веб-сборка (pre‑MVP)',
      en: '2026 · early web build (pre‑MVP)',
    },
    items: [
      {
        ru: 'Локализация i18next (ru/en), переключатель языка в настройках, ключ в localStorage.',
        en: 'i18next (ru/en), language toggle in settings, localStorage key.',
      },
      {
        ru: 'Клиентское шифрование vault (AES‑GCM + PBKDF2), схема v5, debounced синхронизация ciphertext с Supabase.',
        en: 'Client-side vault encryption (AES-GCM + PBKDF2), schema v5, debounced ciphertext sync with Supabase.',
      },
      {
        ru: 'Вкладки «День» / «Неделя» / «Месяц»; бэклог и план на дату; фильтры (группа, приоритеты, цвет, повторы) и информер при свёрнутой панели.',
        en: 'Day / Week / Month tabs; backlog and planned day; filters (group, priorities, color, repeats) and informer when panel collapsed.',
      },
      {
        ru: 'Задачи: приоритет 1–5, группы, цвет и HEX/пипетка, оценка в часах и минутах, время начала или окончания (или без времени), пересечение слотов с подтверждением.',
        en: 'Tasks: priority 1–5, groups, color + hex/eyedropper, estimate h+m, start or end time (or none), slot overlap confirmation.',
      },
      {
        ru: 'Повторы: каждый день / каждые N дней / дни недели; якорь серии; отметки выполнения по вхождениям (completedOccurrenceLocalDates); DR-008 id серии.',
        en: 'Recurrence: daily / every N days / weekdays; series anchor; per-occurrence completions; DR-008 series id.',
      },
      {
        ru: 'Черновики формы создания в vault; настройки названий приоритетов и CRUD групп; смена пароля Supabase; PWA (manifest + service worker).',
        en: 'Create-task drafts in vault; priority labels and group CRUD; Supabase password change; PWA (manifest + SW).',
      },
      {
        ru: 'Редактирование задачи (TaskEditModal): те же правила расписания и валидации, что и при создании (taskScheduleValidation).',
        en: 'Task edit modal: same schedule rules and validation as create (taskScheduleValidation).',
      },
    ],
  },
]

/** Оставшиеся фазы до релиза 1.0.0 по плану (источник правды — `obsidian-motivator/17-План-реализации-MVP.md`). */
export const MVP_PHASES_PLANNED: RoadmapMvpPhase[] = [
  {
    id: 0,
    title: { ru: 'Фундамент', en: 'Foundation' },
    summary: {
      ru: 'Схема vault, миграции, клиентское шифрование, Web+PWA, базовая локализация.',
      en: 'Vault schema, migrations, client encryption, Web+PWA, baseline i18n.',
    },
    detailBullets: [
      {
        ru: 'Целевая версия схемы vault: план/backlog, слоты, оценка, повторы, приоритеты 1–5, чек-лист, группы, черновики создания.',
        en: 'Target vault schema: plan/backlog, slots, estimate, repeats, priorities 1–5, checklist, groups, create-form drafts.',
      },
      {
        ru: 'Цепочка миграций на клиенте; при необходимости таблица соответствия полей для старых данных.',
        en: 'Client-side migration chain; field mapping table for legacy data if needed.',
      },
      {
        ru: 'Клиентское шифрование (DR-005/006), паритет с VAULT_CRYPTO_CONTRACT.',
        en: 'Client-side crypto (DR-005/006), parity with VAULT_CRYPTO_CONTRACT.',
      },
      {
        ru: 'Сборка Web + PWA (manifest, service worker); каркас i18n ru/en по Scope.',
        en: 'Web + PWA build (manifest, SW); ru/en i18n skeleton per Scope.',
      },
    ],
  },
  {
    id: 1,
    title: { ru: 'Ядро задачи и «День»', en: 'Core task & Day' },
    summary: {
      ru: 'Сущности задачи/группа/цвет, экран дня, бэклог, приоритеты, оценка, время, черновики.',
      en: 'Task/group/color entities, Day screen, backlog, priorities, estimate, time, drafts.',
    },
    detailBullets: [
      {
        ru: 'Разделение просмотра (мини-карточка) и редактирования (модалка); палитра цвета.',
        en: 'Separate browse (mini card) vs edit (modal); color palette.',
      },
      {
        ru: 'Чек-лист «план работы»; локальная дата устройства; секция Backlog внутри Today.',
        en: 'Work-plan checklist; device-local date; Backlog inside Today.',
      },
      {
        ru: 'Приоритеты 1–5 с названиями; оценка времени; время начала XOR окончания; модалка создания и черновики.',
        en: 'Priorities 1–5 with labels; time estimate; start XOR end time; create modal & drafts.',
      },
    ],
  },
  {
    id: 2,
    title: { ru: 'Неделя (таймблокинг)', en: 'Week (timeblocking)' },
    summary: {
      ru: 'Сетка дни × часы, освобождение слота при завершении, пересечения с подтверждением.',
      en: 'Day×hour grid, slot release on complete, overlaps with confirmation.',
    },
    detailBullets: [
      {
        ru: 'Задачи в реальных слотах по правилам ТЗ (старт + оценка → конец или режим «к времени завершения»).',
        en: 'Tasks in real slots per TZ rules (start + estimate → end or “due time” mode).',
      },
      {
        ru: 'Мягкое предупреждение при пересечении с другой задачей на тот же день.',
        en: 'Soft warning when overlapping another task on the same day.',
      },
    ],
  },
  {
    id: 3,
    title: { ru: 'Месяц, фильтры', en: 'Month & filters' },
    summary: {
      ru: 'Календарь месяца с отметками; фильтры вида и информер.',
      en: 'Month calendar with markers; view filters and informer.',
    },
    detailBullets: [
      {
        ru: 'Фильтры: группа, приоритеты, повторы (и прочее из ТЗ для месяца).',
        en: 'Filters: group, priorities, repeats (and other TZ fields for month).',
      },
      {
        ru: 'Информер активных условий фильтрации (сводка охвата).',
        en: 'Informer summarizing active filter conditions.',
      },
    ],
  },
  {
    id: 4,
    title: { ru: 'Повторы', en: 'Recurrence' },
    summary: {
      ru: 'Типы повторов из ТЗ; якорь серии; отметки по вхождениям; DR-008 для отчётов.',
      en: 'TZ recurrence types; series anchor; per-occurrence marks; DR-008 for reporting.',
    },
    detailBullets: [
      {
        ru: 'Каждый день / каждые N дней / дни недели; связь с отчётами и идентификатором серии.',
        en: 'Daily / every N days / weekdays; linkage to reports and series id.',
      },
    ],
  },
  {
    id: 5,
    title: { ru: 'Отчёты на клиенте', en: 'Client-side reports' },
    summary: {
      ru: 'Аналитика после расшифровки (DR-007); стрик DR-013 после EOD; «часто проваленные» (DR-008). Первая версия `/app/reports` уже в сборке.',
      en: 'Analytics after decrypt (DR-007); DR-013 streak after EOD; often missed (DR-008). First `/app/reports` iteration shipped.',
    },
    detailBullets: [
      {
        ru: 'Доли, диаграммы по периодам; при необходимости worker/батчи для тяжёлых расчётов (DR-007).',
        en: 'Shares and period charts; optional worker/batches for heavy math (DR-007).',
      },
      {
        ru: 'Полный стрик по DR-013 возможен после ритуала End-of-Day (фаза 6).',
        en: 'Full DR-013 streak once End-of-Day ritual exists (phase 6).',
      },
    ],
  },
  {
    id: 6,
    title: { ru: 'Двойное подтверждение, EOD, анимации', en: 'Double-check, EOD, motion' },
    summary: {
      ru: 'Двойное подтверждение (DR-004); End-of-Day (DR-002); минимум двух пар анимаций тона.',
      en: 'Double confirmation (DR-004); End-of-Day (DR-002); at least two tone-pair animations.',
    },
    detailBullets: [
      {
        ru: 'Состав задач ритуала EOD с учётом плана на день и календаря; уточнение КПТ при необходимости.',
        en: 'EOD task set aligned with day plan and calendar; CPT bank refinement if needed.',
      },
      {
        ru: 'Анимации: пара «успех» и пара «мягко при не выполнено» — по ТЗ MVP.',
        en: 'Animations: success pair and gentle “not done” pair — per MVP spec.',
      },
    ],
  },
  {
    id: 7,
    title: { ru: 'Настройки, аккаунт, юридика', en: 'Settings, account, legal' },
    summary: {
      ru: 'Настройки по блокам; пароль; seed; удаление аккаунта и 30 дней; тексты; кнопка обратной связи; согласие на cookie.',
      en: 'Grouped settings; password; seed; account deletion + 30 days; legal copy; feedback entry; cookie consent.',
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
    ],
  },
  {
    id: 8,
    title: { ru: 'Монетизация и push', en: 'Monetization & push' },
    summary: {
      ru: 'Freemium (DR-010); PWA push — если остаются в релизе по решению спринта.',
      en: 'Freemium (DR-010); PWA push if still in release per sprint decision.',
    },
    detailBullets: [
      {
        ru: 'После стабилизации ядра планирования и отчётов.',
        en: 'After core planning and reports are stable.',
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

/** После MVP — тематические блоки с развёрнутым текстом под раскрывашкой */
export const IDEAS_LATER_ENTRIES: RoadmapIdeaEntry[] = [
  {
    title: { ru: 'Продукт после 1.0 (v1.1+)', en: 'Post-1.0 (v1.1+)' },
    summary: {
      ru: 'Глобальные цели, шаблоны задач, подсказки long-press, геймификация — вне текущего MVP.',
      en: 'Global goals, task templates, long-press hints, gamification — outside current MVP.',
    },
  },
  {
    title: { ru: 'Анти-выгорание (мягко)', en: 'Anti-burnout (soft)' },
    summary: {
      ru: 'Предупреждение при слишком длинных оценках подряд без жёсткой блокировки.',
      en: 'Nudge on very long back-to-back estimates without hard blocking.',
    },
  },
  {
    title: { ru: 'Рабочие часы в настройках', en: 'Working hours in settings' },
    summary: {
      ru: '«Остаток дня» для предупреждений оценки вместо грубого календарного дня.',
      en: '“Rest of working day” for estimate hints instead of raw calendar day.',
    },
  },
  {
    title: { ru: 'Нативные клиенты', en: 'Native clients' },
    summary: {
      ru: 'iOS/Android и паритет крипто по VAULT_CRYPTO_CONTRACT — при ресурсах.',
      en: 'iOS/Android and crypto parity per VAULT_CRYPTO_CONTRACT — when resources allow.',
    },
  },
  {
    title: { ru: 'Режимы экрана «День»', en: 'Alternate Day views' },
    summary: {
      ru: 'Помимо списка — таймлайн по часам, переключение режимов, компактные варианты.',
      en: 'Besides list — hourly timeline, mode toggle, compact layouts.',
    },
    detailBullets: [
      {
        ru: 'Вертикальная шкала дня (аналог колонки недели): слоты по времени и блок «без времени».',
        en: 'Vertical day scale (like week column): timed slots and an “untimed” strip.',
      },
      {
        ru: 'Сохранение предпочтения вида в localStorage или настройках.',
        en: 'Persist view preference in localStorage or settings.',
      },
    ],
  },
  {
    title: { ru: 'ИИ через API', en: 'AI via API' },
    summary: {
      ru: 'Подключение внешних моделей по API (собственный ключ, выбор провайдера) для подсказок по задачам и календарю — только после отдельной продуктовой и privacy-оценки.',
      en: 'External LLMs via API (BYOK, provider choice) for task/calendar hints — only after product & privacy review.',
    },
    detailBullets: [
      {
        ru: 'Клиентское шифрование vault: в промпт уходит только то, что пользователь явно разрешил; без автоматической выгрузки vault.',
        en: 'Client-side vault encryption: only user-consented context goes to prompts; no automatic full vault export.',
      },
      {
        ru: 'Возможное сосуществование с MCP (отдельная идея в документации продукта): прямой API и контекстный протокол — разные слои.',
        en: 'May coexist with MCP (separate idea in product docs): direct API vs contextual protocol as different layers.',
      },
    ],
  },
]
