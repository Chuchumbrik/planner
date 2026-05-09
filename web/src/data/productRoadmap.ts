/**
 * Контент модалки «Краткая сводка»: дорожная карта, changelog по датам, идеи, открытые вопросы.
 * Редактируйте при появлении новых фич и изменений scope MVP.
 *
 * Перед коммитом (вместе с `web/README.md`): новые пользовательские изменения — блок в
 * **RELEASE_NOTES_BLOCKS** (дата сверху); при смене scope — **IMPLEMENTED_MVP_PHASES** /
 * **MVP_PHASES_PLANNED** / **IDEAS_LATER_ENTRIES**; проверить подсказки «Открытые вопросы»
 * в локалях (`settings.roadmapOpenQuestion*`).
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

/** Идея после MVP: заголовок + кратко + список под раскрывашкой */
export type RoadmapIdeaEntry = {
  title: LocalizedString
  summary: LocalizedString
  detailBullets?: LocalizedString[]
}

/** Одна запись за дату: список изменений + опционально пункты «простыми словами». */
export type RoadmapReleaseNoteItem = {
  changes: LocalizedString[]
  plainBullets?: LocalizedString[]
}

/** Релиз-ноты по датам для тестеров без доступа к GitHub. */
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
        ru: 'Вкладка «День»: рядом с планом — кольцо прогресса по плану на календарный день (весовые единицы: задача без чек-листа или пункты чек-листа; модалка EOD использует ту же функцию); на узком экране блок с диаграммой выше списка.',
        en: 'Day tab: progress ring for the day plan (weighted units: task without checklist vs checklist items; EOD modal uses the same helper); on narrow screens the chart stacks above the list.',
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
        ru: 'Глобальный вкл/выкл кнопки EOD в настройках; запись локальной даты завершения ритуала.',
        en: 'Global EOD button toggle in settings; writes local ritual completion date.',
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
        ru: 'Задел под роли (`motivatorRole`, `app_metadata.motivator_role`) без ограничений UI — см. план фазы 8.',
        en: 'Role hooks (`motivatorRole`, `app_metadata.motivator_role`) without UI gating — see phase 8 plan.',
      },
      {
        ru: 'Модалка **«Завершение дня»**: блоки только по **плану на календарный день**; бэклог — отдельное мягкое напоминание; заголовок для локали **ru** на русском; круговая диаграмма доли закрытых задач по плану; продуктовые **«Открытые вопросы»** перенесены в модалку **«Краткая сводка»** (настройки).',
        en: '**End-of-day** modal: **planned-for-day** tasks only; backlog FYI strip; **ru** title localized; donut chart for share of planned tasks closed; **Open questions** product notes live under **Brief summary** in settings.',
      },
    ],
  },
]

/** Блоки релиз-нотов (обновляйте при значимых деплоях для тестеров). Каждая запись — список коротких пунктов. */
export const RELEASE_NOTES_BLOCKS: RoadmapReleaseNoteBlock[] = [
  {
    dateLabel: { ru: '2026-05-14', en: '2026-05-14' },
    items: [
      {
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
    ],
  },
  {
    dateLabel: { ru: '2026-05-13', en: '2026-05-13' },
    items: [
      {
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
    ],
  },
  {
    dateLabel: { ru: '2026-05-12', en: '2026-05-12' },
    items: [
      {
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
            ru: 'Вверху модалки добавлена круговая диаграмма: процент и доля закрытых фаз дорожной карты до MVP 1.0.0 (0–6 из 0–11).',
            en: 'A donut chart at the top shows percent complete for roadmap phases toward MVP 1.0.0 (phases 0–6 of 0–11).',
          },
          {
            ru: 'Релиз-ноты: каждая дата — отдельная раскрывашка, чтобы быстрее находить нужный выпуск.',
            en: 'Release notes: each date is its own collapsible section for quicker navigation.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-11', en: '2026-05-11' },
    items: [
      {
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
    ],
  },
  {
    dateLabel: { ru: '2026-05-10', en: '2026-05-10' },
    items: [
      {
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
      {
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
            ru: 'Таблица возможностей и контракт vault отражают сборку; релиз-ноты датированы для истории.',
            en: 'Feature table and vault contract match the build; dated notes keep history.',
          },
        ],
      },
    ],
  },
  {
    dateLabel: { ru: '2026-05-09', en: '2026-05-09' },
    items: [
      {
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
        changes: [
          {
            ru: 'Дорожная карта в настройках: до 1.0.0 остаются фазы 7–11 (включая фазу 7 — дизайн и адаптивность).',
            en: 'Settings roadmap: phases 7–11 remain until 1.0.0 (incl. phase 7 — design & responsiveness).',
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
    ],
  },
]

/**
 * Оставшийся охват до 1.0.0 (источник — `obsidian-motivator/17-План-реализации-MVP.md`).
 * Фазы 0–6 см. в `IMPLEMENTED_MVP_PHASES`; здесь — фазы **7–11**.
 */
export const MVP_PHASES_PLANNED: RoadmapMvpPhase[] = [
  {
    id: 7,
    title: { ru: 'Дизайн и адаптивность', en: 'Design & responsiveness' },
    summary: {
      ru: 'Проработка визуального слоя и макета: единый стиль, типографика и отступы; комфорт на **широких экранах** (сетка, использование ширины, читаемые колонки); полировка под **мобильные** и узкие окна (touch, навигация, модалки и формы без горизонтального скролла).',
      en: 'Visual and layout pass: cohesive styling, typography, spacing; **wide-screen** treatment (grid, width usage, readable columns); polish for **mobile** and narrow viewports (touch targets, navigation, modals/forms without sideways scroll).',
    },
    plain: {
      ru: 'Сделать интерфейс не только рабочим, но и аккуратным: чтобы на большом мониторе не было пустоты «узкой колонкой посередине без смысла» и чтобы на телефоне всё можно было нажать пальцем и прочитать без прищуривания. Это отдельный заход до финального MVP — после того как функции уже живут в приложении.',
      en: 'Make the UI not only functional but tidy: on a large monitor avoid an accidental “tiny strip in the middle,” and on a phone keep taps comfortable and text readable. A dedicated pass before the MVP finish line — after core features already exist.',
    },
    detailBullets: [
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
    ],
  },
  {
    id: 8,
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
    id: 9,
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
    id: 10,
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
    id: 11,
    title: { ru: 'Релиз 1.0.0', en: '1.0.0 release' },
    summary: {
      ru: 'Чеклист ТЗ, semver 1.0.0, регрессия, деплой и документация.',
      en: 'TZ checklist, semver 1.0.0, regression, deploy and docs.',
    },
    plain: {
      ru: 'Большой финиш чертежа **1.0.0**: пройти чек-лист как перед школьной контрольной, проверить всё ещё раз, выложить для людей и подложить понятные бумажки-инструкции.',
      en: 'The big **1.0.0** finish line: run the checklist like before an exam, test everything again, ship for real people, and leave simple instruction papers.',
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
    title: { ru: 'Раздел «Тестирование» в настройках', en: 'Settings: testing / QA tools' },
    summary: {
      ru: 'Отдельная секция **только для администраторов и бета-тестеров**: переключатели и вспомогательные режимы, которые упрощают проверку приложения и сценариев; обычный пользователь раздел не видит.',
      en: 'A **settings section for admins and beta testers only**: toggles and helpers to exercise flows and validate behavior; hidden from regular users.',
    },
    detailBullets: [
      {
        ru: 'Доступ по ролям на сервере (`app_metadata.motivator_role`: **admin**, **beta_tester**); состав пунктов и название секции — при реализации.',
        en: 'Role-gated server-side (`app_metadata.motivator_role`: **admin**, **beta_tester**); section title and items — TBD at implementation.',
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
    title: { ru: 'Диаграммы: отчёты и вкладка «День»', en: 'Charts: reports vs Day tab' },
    summary: {
      ru: 'На **`/app/reports`** уже есть столбчатая диаграмма по дням; компактная диаграмма на экране «День» — отдельное улучшение (часто в связке с фазой дизайна и широких экранов).',
      en: '**`/app/reports`** already has a per-day bar chart; a compact chart on the **Day** tab is a separate enhancement (often tied to the design / wide-screen phase).',
    },
  },
  {
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
