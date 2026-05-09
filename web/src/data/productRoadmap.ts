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

/** Запланировано к релизу MVP 1.0.0 по ТЗ (обязательный scope — не исчерпывающий список всех задач разработки). */
export const MVP_PLANNED_ITEMS: LocalizedString[] = [
  {
    ru: 'Формальный релиз продукта 1.0.0 и закрытие обязательного объёма из obsidian-motivator/16-TZ-MVP-v1.0.md.',
    en: 'Formal 1.0.0 release and mandatory scope from obsidian-motivator/16-TZ-MVP-v1.0.md.',
  },
  {
    ru: 'Удаление аккаунта с политикой восстановления (например 30 дней) и понятный UX.',
    en: 'Account deletion with recovery window (e.g. 30 days) and clear UX.',
  },
  {
    ru: 'Экспорт / онбординг seed: отдельный экран или улучшенный поток «скопировать seed».',
    en: 'Seed export / onboarding: dedicated screen or improved copy-seed flow.',
  },
  {
    ru: 'Двойное подтверждение чувствительных действий, End-of-Day, анимации — в объёме, зафиксированном в ТЗ MVP.',
    en: 'Double confirmation for sensitive actions, End-of-Day, animations — as scoped in the MVP spec.',
  },
  {
    ru: 'Остальное из поэтапного плана: `obsidian-motivator/17-План-реализации-MVP.md` (приоритет и порядок там).',
    en: 'Remaining phased work: `obsidian-motivator/17-План-реализации-MVP.md` (priority and order there).',
  },
]

/** После MVP и идеи без обязательства по срокам. */
export const IDEAS_LATER_ITEMS: LocalizedString[] = [
  {
    ru: 'Версии после 1.0 (v1.1+): глобальные цели, шаблоны задач, подсказки по long-press, геймификация — вне текущего MVP.',
    en: 'Post-1.0 (v1.1+): global goals, task templates, long-press hints, gamification — out of current MVP.',
  },
  {
    ru: 'Мягкое предупреждение при слишком длинных оценках подряд (анти‑выгорание), без жёсткой блокировки.',
    en: 'Soft nudge for very long back-to-back estimates (anti-burnout), not a hard block.',
  },
  {
    ru: 'Рабочие часы / «остаток дня» в настройках для предупреждений оценки вместо грубого календарного дня.',
    en: 'Working hours / “rest of day” in settings for estimate warnings instead of raw calendar day.',
  },
  {
    ru: 'Нативные клиенты и паритет крипто по `VAULT_CRYPTO_CONTRACT.md` — при появлении ресурсов.',
    en: 'Native clients and crypto parity per `VAULT_CRYPTO_CONTRACT.md` — when resources allow.',
  },
]
