# Design 2.0 — этап 8: доступность (лёгкий проход)

**Дата:** 2026-05-24  
**Ветка:** `design-2.0`  
**Объём:** не полный WCAG-аудит — минимум для MVP (см. `.cursor/stages-out.md`)

---

## Чеклист

| Критерий | До | После | Комментарий |
|----------|-----|-------|-------------|
| Конtrast primary on surface | ✅ | ✅ | `#4edea3` on `#131315` ≈ **13:1** (AAA) |
| Конtrast on-surface-variant on cards | ✅ | ✅ | `#bbcabf` on `#201f22` / `#1c1b1d` ≈ **8–9:1** (AA body) |
| Полупрозрачный variant `/70` для данных | ⚠️ | ✅ | `ProductRoadmapModal` — tabular nums → полный `text-on-surface-variant` |
| `aria-label` icon-only (FAB, nav, close) | ⚠️ | ✅ | Create/Task edit close ✕; остальное уже было (shell, charts, FAB) |
| Modals: focus trap + return focus | ❌ | ✅ | `useDialogFocusTrap` — create/edit task, EOD, roadmap, defect, drafts, date picker, AI panel |
| `aria-live` для динамики | ⚠️ | ✅ | sync popover (`polite`/`alert`), скрытые фильтры, settings (было) |
| Disabled AI Command | ✅ | ✅ | `aria-disabled="true"` + `aria-label` на send (без изменений) |

---

## Конtrast spot-check (токены)

| Пара | Ratio (approx) | WCAG AA body |
|------|----------------|--------------|
| primary / surface | 13:1 | ✅ |
| on-surface / surface-container | 11:1 | ✅ |
| on-surface-variant / surface-container | 8.7:1 | ✅ |
| outline / surface (borders only) | 4.8:1 | ✅ UI component |

**Осознанно не трогали:** декоративные подписи `on-surface-variant/60–80` (версия в sidebar, brand mark) — не основной текст.

---

## Код

- **`web/src/lib/useDialogFocusTrap.ts`** — Tab-цикл внутри dialog, возврат фокуса на триггер при закрытii
- **Модалки:** `CreateTaskModal`, `TaskEditModal`, `EndOfDayModal`, `ProductRoadmapModal`, `FileDefectModal`, `AppPage` (drafts), `LocalDatePickerField`, `AiAssistantPanel`
- **A11y правки:** `aria-labelledby` на create/edit task; `aria-modal` cookie banner; sync `role="status"` / `role="alert"`

---

## Manual (вне автоматики)

- [ ] VoiceOver / TalkBack: порядок фокуса в create task и EOD
- [ ] NVDA/JAWS на Windows (опционально)
- [ ] Полный axe DevTools — после merge, не блокер MVP

---

## Следующий шаг

**Этап 9** — документация, roadmap phase 13, bump версии.
