# Design 2.0 — этап 7: аудит адаптива и PWA

**Дата:** 2026-05-24  
**Ветка:** `design-2.0`  
**Инструмент:** Chrome DevTools MCP (320×568, 393×852), код-ревью  
**Production baseline:** `0.7.3+5ee2982` (до правок этапа 7)

---

## Чеклист (`.cursor/stages-out.md`)

| Критерий | До | После правок | Комментарий |
|----------|-----|--------------|-------------|
| Нет horizontal scroll 320–430px | ✅ | ✅ | `/app` overflowX=0 на 320px; stat-карточки — горизонтальный scroll **внутри** ряда (snap), не страницы |
| Tap targets ≥ 44px | ⚠️ | ✅ | Sync/account ~38px, вкладки ~32px, toolbar ~30px → `SHELL_ICON_BTN`, `viewTab` min-h-11, `PLANNER_TOOLBAR_BTN`, `PLANNER_NAV_BTN` |
| `safe-area-inset-*` | ⚠️ | ✅ | `SHELL_HEADER`, `AUTH_PAGE_HEADER`, filter sheet header, `MODAL_FOOTER` (было), bottom nav (было) |
| PWA theme `#131315`, standalone, viewport | ⚠️ | ✅ | `index.html` OK; manifest был `#09090b` → **`#131315`** в `vite.config.ts` |
| Breakpoints sm/md/lg | ✅ | ✅ | Регрессий не выявлено (прогон 19 + 320px) |
| Keyboard focus ring | ⚠️ | ✅ | `motivator-input:focus` (было); добавлен `:focus-visible` на кнопки/табы/ссылки |
| Reduced motion | ⚠️ | ✅ | `animate-pulse` / `animate-spin` отключаются при `prefers-reduced-motion` |

---

## Экраны

| Маршрут | 320px overflow | Заметки |
|---------|----------------|---------|
| `/` | OK | `overflow-x-hidden`, safe-area header |
| `/login` | OK | glass card `max-w-md`, inputs 16px на mobile |
| `/onboarding` | OK | `AUTH_PAGE_HEADER` + safe-area |
| `/app` (День/Неделя/Месяц) | OK | toolbar/filters/charts — правки tap; неделя — вертикальный scroll сетки |
| `/app/reports` | OK | таблицы в `overflow-x-auto` **внутри** card — by design |
| `/settings` | OK | tabs horizontal scroll в sidebar chip row |

---

## Внесённые правки (код)

- `designClasses.ts` — `SHELL_ICON_BTN`, `PLANNER_TOOLBAR_BTN`, `AUTH_PAGE_HEADER`, safe-area header, `viewTab`/`PLANNER_NAV_BTN` min 44px, `MODAL_CLOSE_BTN` tap area
- `ShellHeaderActions.tsx` — 44×44 sync/account
- `AppPage.tsx` — toolbar EOD/filters/charts/nav ≥44px mobile; filter sheet safe-area top
- `HomePage.tsx`, `OnboardingPage.tsx`, `LoginPage.tsx` — safe-area + overflow-x-hidden
- `vite.config.ts` — manifest `theme_color` / `background_color` → `#131315`
- `index.css` — focus-visible, reduced-motion для pulse/spin

---

## Manual (вне MCP)

- [ ] PWA «Add to Home Screen» на реальном iPhone / Android
- [ ] OS `notificationclick` (прогон 17 чеклист)
- [ ] Landscape на телефоне (orientation portrait в manifest — осознанно)

---

## Следующий шаг

**Этап 8** — лёгкий a11y-проход (конtrast spot-check, aria-live, modal trap).
