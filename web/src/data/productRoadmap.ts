/**
 * Черновой список для модалки «сделано / планы» в настройках.
 * Редактируйте даты и пункты при появлении новых релизов.
 */

export type LocalizedString = { ru: string; en: string }

export type RoadmapImplementedBlock = {
  /** ISO-дата или короткая подпись периода (одна строка в UI) */
  dateLabel: LocalizedString
  items: LocalizedString[]
}

/** Уже вошло в текущую веб-сборку (по возможности с датой merge/фичи). */
export const IMPLEMENTED_BLOCKS: RoadmapImplementedBlock[] = [
  {
    dateLabel: { ru: '2026-05-09', en: '2026-05-09' },
    items: [
      {
        ru: 'Создание задачи: подсказка обязательных полей для «Сохранить»; форма не сбрасывается при смене дня/фильтра, пока модалка открыта (цвет и поля сохраняются).',
        en: 'Create task: required-field hint for Save; form no longer resets when changing day/filter while the modal is open (color and fields preserved).',
      },
      {
        ru: 'Цвет задачи: полоска на мини-карточке и в недельной сетке через опорный HEX палитры (устранена потеря классов Tailwind из пакета core).',
        en: 'Task color: left stripe on mini card and week grid via palette hex (fixes Tailwind JIT missing classes from core).',
      },
      {
        ru: 'Блок «Время»: выбор часов и минут двумя списками в стиле интерфейса вместо нативного time-picker.',
        en: 'Time block: hour and minute dropdowns styled for the app instead of the native time picker.',
      },
      {
        ru: 'Мини-карточка: время суток показывается как часы и минуты (локализованная строка).',
        en: 'Mini card: clock time shown as hours and minutes (localized).',
      },
      {
        ru: 'Чек-лист: новые пункты добавляются в конец списка (сверху вниз — порядок ввода).',
        en: 'Checklist: new items append to the list (top-to-bottom matches entry order).',
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
        ru: 'Клиентское шифрование vault (AES‑GCM), схема v5, синхронизация ciphertext с Supabase.',
        en: 'Client-side vault encryption (AES-GCM), schema v5, ciphertext sync with Supabase.',
      },
      {
        ru: 'Вкладки «День» / «Неделя» / «Месяц», бэклог, фильтры и информер, повторяющиеся задачи.',
        en: 'Day / Week / Month tabs, backlog, filters and informer, recurring tasks.',
      },
      {
        ru: 'Оценка времени, время начала или завершения, пересечение слотов с подтверждением.',
        en: 'Time estimate, start or end time, slot overlap confirmation.',
      },
      {
        ru: 'Черновики формы создания задачи, настройки приоритетов и групп, смена пароля Supabase, i18n ru/en, PWA.',
        en: 'Create-task drafts, priority labels and groups, Supabase password change, ru/en i18n, PWA.',
      },
    ],
  },
]

/** Запланировано по ТЗ MVP и следующим этапам (не полный объём работ). */
export const BACKLOG_ITEMS: LocalizedString[] = [
  {
    ru: 'Формальный релиз MVP 1.0.0 по ТЗ и завершение обязательного scope из obsidian-motivator/16-TZ-MVP-v1.0.md.',
    en: 'Formal 1.0.0 MVP release per TZ and remaining mandatory scope from obsidian-motivator/16-TZ-MVP-v1.0.md.',
  },
  {
    ru: 'Удаление аккаунта с политикой восстановления (30 дней) и связанный UX.',
    en: 'Account deletion with recovery policy (30 days) and related UX.',
  },
  {
    ru: 'Экспорт / онбординг seed: отдельный экран или улучшение потока «скопировать seed».',
    en: 'Export / onboarding seed: dedicated screen or improved copy-seed flow.',
  },
  {
    ru: 'Двойное подтверждение, End-of-Day, анимации — в объёме, зафиксированном в ТЗ MVP.',
    en: 'Double confirmation, End-of-Day, animations — as scoped in MVP TZ.',
  },
  {
    ru: 'После MVP (v1.1+): глобальные цели, шаблоны задач, подсказки по long-press, геймификация и др. — вне текущего MVP.',
    en: 'Post-MVP (v1.1+): global goals, task templates, long-press hints, gamification, etc. — out of current MVP.',
  },
  {
    ru: 'Идея после MVP: мягкое предупреждение при слишком длинных оценках подряд (анти‑выгорание), без жёсткой блокировки.',
    en: 'Post-MVP idea: soft nudge for very long back-to-back estimates (anti-burnout), not a hard block.',
  },
]
