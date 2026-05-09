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

/** Один пункт релиз-нотов: что изменилось + то же очень простым языком. */
export type RoadmapReleaseNoteItem = {
  summary: LocalizedString
  plain: LocalizedString
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
    ],
  },
]

/** Блоки релиз-нотов (обновляйте при значимых деплоях для тестеров). */
export const RELEASE_NOTES_BLOCKS: RoadmapReleaseNoteBlock[] = [
  {
    dateLabel: { ru: '2026-05-09', en: '2026-05-09' },
    items: [
      {
        summary: {
          ru: 'Версия продукта **0.6.1** (`package.json`): схема **`0·x·y`**, четвёртый слой — **`+git`**; ведущий **0** ≠ «только MVP» (см. `web/README.md`).',
          en: 'Product version **0.6.1** (`package.json`): **`0·x·y`** scheme, fourth layer is **`+git`**; leading **0** ≠ “MVP-only” (see `web/README.md`).',
        },
        plain: {
          ru: 'У программы есть «номер версии» — как имя у игрушки, чтобы не перепутать старые и новые. Первая цифра **0** не значит, что приложение плохое: мы просто ещё не дошли до большого «первого» официального выпуска **1.0.0**. К номеру приписывают короткий код из букв и цифр — чтобы знать, из какой коробки собрали эту копию.',
          en: 'The app has a **version number** — like a nametag so we don’t mix old and new builds. The first digit **0** doesn’t mean the app is bad; we just haven’t reached the big **1.0.0** birthday yet. A short letter-number code is added so we know which “box” this copy came from.',
        },
      },
      {
        summary: {
          ru: '**DR-004** и схема vault **v7**: двойное подтверждение выполнения задачи (чекбокс в создании/редактировании, второй тап по галочке на карточке, таймеры по умолчанию +10/+30 мин); просроченное ожидание снимается автоматически; короткие анимации на карточке.',
          en: '**DR-004** and vault **v7**: double confirmation for marking done (create/edit toggles, second tap on the mini card, default +10/+30 min timers); stale pending clears automatically; brief card animations.',
        },
        plain: {
          ru: 'Если для задачи включено «второе подтверждение», одного нажатия на галочку мало: сначала загорается ожидание, потом нужно подтвердить ещё раз, пока не вышло время. Если не успел — отметка «сделано» не ставится, можно отменить ожидание или попробовать снова. Это отдельно от вечернего «закрыть день».',
          en: 'When double confirmation is on for a task, one tap isn’t enough: the card shows a waiting state, then you confirm again before time runs out. If you miss it, it doesn’t count as done — you can cancel the wait or try again. This is separate from the evening “finish day” ritual.',
        },
      },
      {
        summary: {
          ru: 'Дорожная карта в настройках: план до **1.0.0** — фазы **7–11** (в т.ч. отдельная фаза **7** — дизайн и адаптивность для широких и мобильных экранов); в «Идеях на потом» — черновая идея **раздела тестирования** для админов и бета-тестеров.',
          en: 'Settings roadmap: **1.0.0** plan — phases **7–11** (including phase **7** — design & responsiveness); **Ideas for later** drafts a **testing / QA** settings section for admins and beta testers.',
        },
        plain: {
          ru: 'Второй список в окне дорожной карты теперь честно показывает одиннадцать шагов до большого релиза и отдельный блок про красивый интерфейс на большом экране и телефоне. Внизу, среди идей после первой версии, появилась заметка про скрытый раздел для проверки приложения — когда дойдём до реализации.',
          en: 'The roadmap’s plan section now lists eleven steps to the big release and calls out a dedicated pass for layout on wide and small screens. Under “Ideas for later” there’s a note about a future QA-only settings area — for when we build it.',
        },
      },
      {
        summary: {
          ru: 'Модалка «Что сделано и планы»: фазы **0–6** в «реализовано»; перечень реализованного и релиз-ноты синхронизированы с документацией (`web/README.md`, план в Obsidian).',
          en: '“Shipped & planned” modal: phases **0–6** under shipped; lists and release notes aligned with docs (`web/README.md`, Obsidian plan).',
        },
        plain: {
          ru: 'Текст в модалке и релиз-нотах для тестеров обновлён, чтобы не расходиться с тем, что реально есть в сборке и в файлах проекта.',
          en: 'Copy in the modal and tester-facing release notes is updated so it matches what’s actually in the build and repo docs.',
        },
      },
      {
        summary: {
          ru: 'Отчёты `/app/reports`: график отметок, KPI, стрик DR-013 с EOD, таблицы «часто проваленные» по DR-008.',
          en: '`/app/reports`: completion chart, KPI, DR-013 streak with EOD, often-missed tables (DR-008).',
        },
        plain: {
          ru: 'Есть страничка «Отчёты»: там картинка-график, сколько дней ты отмечал дела, и «сколько дней подряд получалось». Если ты нажал «день закончен», это помогает считать серию верно. Есть ещё списки «что часто забывалось» — как напоминание, над чем поработать.',
          en: 'There’s a **Reports** page: a little chart, how many days you checked things off, and a “how many days in a row” score. If you tap **day finished**, it counts your streak fairly. There are also lists of “often missed” items — like gentle reminders what to work on.',
        },
      },
      {
        summary: {
          ru: 'Создание задачи: янтарная подсказка обязательных полей; черновики — одна секция или кнопка «Черновики» с модалкой; форма не сбрасывается при смене дня/фильтра.',
          en: 'Create task: amber required-field hints; drafts — inline strip or “Drafts” button with modal; form persists when changing day/filter.',
        },
        plain: {
          ru: 'Когда ты создаёшь новое дело, программа жёлтым подсказывает, что нужно заполнить обязательно. Если ты начал и закрыл окно не сохранив — можно вернуться к черновику (один показывается сразу, много — по кнопке «Черновики»). Если ты просто переключил день или фильтр, то то, что ты уже набрал, не пропадает само.',
          en: 'When you make a new task, hints in amber show what you must fill in. If you started and closed without saving, you can come back to a draft (one shows inline; many drafts open from a **Drafts** button). If you only switch the day or filter, what you typed doesn’t vanish.',
        },
      },
      {
        summary: {
          ru: 'Неделя и карточки: полоска цвета через HEX палитры; время в селектах часы/минуты; чек-лист — новые пункты в конец списка.',
          en: 'Week & cards: color stripe via palette hex; time as hour/minute selects; checklist appends new items to the end.',
        },
        plain: {
          ru: 'В неделе у задач есть цветная полоска слева — цвет не теряется. Время выбирают двумя маленькими списками: часы и минуты. В чек-листе новые пункты всегда добавляются вниз — как новые строчки в конце списка покупок.',
          en: 'In the week view, tasks have a colored stripe on the side — the color stays put. Time is picked with two small lists: hours and minutes. New checklist lines always go at the bottom — like new lines at the end of a shopping list.',
        },
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
        ru: 'Примеры настроек (не обязательный полный список): ускорение или отключение ожиданий по DR-004, фиксация «сегодня» / тестовая дата для календаря, показ отладочных подписей, ослабление debounce синка для проверки конфликтов, экспорт последних операций с vault на клиенте.',
        en: 'Possible options (examples): shorten/disable DR-004 wait windows, pinned “today” or test date for calendar views, debug labels, relaxed sync debounce for conflict testing, export recent client-side vault ops.',
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
