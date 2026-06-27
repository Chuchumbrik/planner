---
id: react-ui-conventions
title: Конвенции React UI
class: guidance
scope: [cursor, claude]
applies-when: при создании или изменении компонентов, страниц, hooks с UI в web/src
globs: ["web/src/**/*.tsx", "web/src/**/*.ts"]
enforcement: none
status: active
links: [layer-boundaries-and-ports, engineering-craft, unit-test-writer]
---

# Конвенции React UI

Стек: **React 19**, **TypeScript**, **Tailwind**, **shadcn/ui**, **TanStack Query**, **Zustand**, **react-i18next**, **Framer Motion** (точечно), **Recharts** (admin).

Правило: UI **тонкий** — отображает состояние и делегирует правила в `@motivator/core` или сервисы.

## Структура файлов

| Тип | Где | Именование |
|-----|-----|------------|
| Страница | `web/src/pages/*Page.tsx` | суффикс `Page` |
| Переиспользуемый UI | `web/src/components/**` | PascalCase, одна ответственность |
| Логика без DOM | `web/src/lib/**` | не класть в `.tsx` без нужды |
| Admin | `web/src/components/admin/**` | общие отступы из `designClasses.ts` |
| Тест | колокация `X.test.tsx` | см. [[unit-test-writer]] |

## Стили и layout

- Общие классы — **`web/src/lib/designClasses.ts`** (`PAGE_CONTAINER`, `ADMIN_SECTION_GAP`, `motivator-card`, …).
- Не плодить magic numbers: если паттерн повторился — константа в `designClasses` или Tailwind theme.
- **Touch targets:** min ~44px на интерактиве (`adminTabButton` — образец).
- Тёмная/светлая тема — через design tokens проекта, не хардкод `#fff` без токена.

## i18n

- Пользовательский текст — **ключи** в `web/src/i18n/locales/ru.json` и **`en.json`** синхронно.
- В JSX — `useTranslation()` / `t('…')`; не русские строки inline (кроме dev-only).
- Новый ключ — осмысленная иерархия (`settings.vault.title`), не `label1`.

## Состояние и данные

| Нужно | Инструмент |
|-------|------------|
| Серверные данные, cache, retry | **TanStack Query** |
| Локальный UI (модалка, таб) | `useState` / небольшой **Zustand** |
| Auth / Vault global | существующие **Providers** — не дублировать контексты |
| Формы | controlled inputs; валидация до submit |

**AbortController** в fetch-hooks при смене фильтров/размонтировании (см. admin dashboard hooks).

## Доступность (a11y)

- Интерактив — семантика: `button`, `link`, `label` + `htmlFor`.
- RTL: **`getByRole`**, **`getByLabelText`**, **`getByText`** — в тестах и при выборе селекторов.
- Иконки-кнопки — `aria-label` или видимый текст.
- Модалки — focus trap / закрытие Esc (shadcn Dialog — по умолчанию).
- Чувствительные экраны — **vitest-axe** в тестах компонента.

## Компоненты: как писать

1. **Props** — явный тип; избегать `any`; optional с `?` и дефолтами осознанно.
2. **Без** логики vault/crypto в JSX — вынести в lib/core.
3. **Мемоизация** (`useMemo`/`useCallback`) — только при измеримой нужде, не по умолчанию.
4. **Effects** — минимум; зависимости полные; cleanup для подписок/timers.
5. **Error/loading/empty** — три состояния всегда, где есть async.

## Admin UI

- Вкладки, KPI, charts — паттерны из `AdminDashboardPage`, `AdminKpiCard`, `InfoTooltip`.
- Константы секций — `ADMIN_*` из `designClasses.ts`.
- Edge/API имена — `adminMonitoringConstants.ts`, не строки в компоненте.

## Тестирование UI

- **@testing-library/react** + **user-event** (не `fireEvent`, где есть выбор).
- Тест **поведения** пользователя, не implementation details.
- Моки — порты и fetch, не внутренности child-компонентов.

## Антипаттерны

| ❌ | ✅ |
|----|-----|
| `getByTestId` везде | role/label/text |
| 400-line page component | split + lib/core |
| Хардкод русского | i18n keys |
| `supabase` в leaf component | hook → port |
| Snapshot-only test | assert visible outcome |

## Связанные артеfactы

- `web/README.md` (admin, PWA, vault UX)
- `obsidian-motivator/07-Технический-стек.md`
- [[layer-boundaries-and-ports]], [[engineering-craft]], [[unit-test-writer]]
