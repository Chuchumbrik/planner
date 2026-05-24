# QA-отчёт Motivator (MVP 1.0.0)

**Среда:** production `https://planner-tawny-omega.vercel.app`  
**Версия:** `0.7.3+5ee2982` (прогон 19, UX-001…004)  
**Дата прогона:** 2026-05-24  
**Исполнитель:** QA Automation (Chrome DevTools MCP)  
**Учётная запись:** `mussha2010@yandex.ru` (**admin**)

**Инструменты:** Chrome DevTools MCP — desktop 1440×900; mobile iPhone 14 Pro 393×852 (touch); Pixel 7 412×915; Slow 3G для сетевых сценариев.

---

## Summary

**Общее состояние (прогон 19):** production **`0.7.3+5ee2982`** — **блокеры Verified**, **UX-001…004 Verified**. Остаются **инфра push-cron**, **BUG-001** (Slow 3G), **OS notificationclick** (manual), **TC-SEC-15**.

**UX-впечатление:** единая шапка (sync + аккаунт) на всех shell-страницах; sidebar footer — **shield** + Premium «Скоро»; sync с popover; mobile — toggle диаграмм в ряду фильтров. Мелочи: «Бесплатно» vs «Free» (UX-02), EOD всё ещё в toolbar + shortcut в меню (не блокер).

**Вердикт (прогон 19, `0.7.3+5ee2982`):** **готов к 1.0.0** с оговорками — **блокеры + UX-001…004 OK**; **`send-due` positive E2E**, **BUG-001**, manual push — **не блокируют релиз** по решению команды. См. [Прогон 19](#прогон-19--ux-001004-ui-re-qa).

**Вердикт (прогон 18, `0.7.3+850815d`):** **условно готов** — блокеры Verified; UX-001…004 ещё не на production.

> **Прогоны 2–19:** см. [«Прогон 2»](#прогон-2) … [«Прогон 19»](#прогон-19--ux-001004-ui-re-qa). Тестовая УЗ: `.cursor/test-account.local.md`.

---

## Статус исправлений после QA (ветка `design-2.0`)

**Дата правок в коде:** 2026-05-23  
**Деплой на production:** `0.7.3+850815d` (прогон 18, 2026-05-24)  
**Исходный прогон:** production `0.7.3+1256c6d` (прогоны 1–17)

### Verified на production (прогон 18)

| ID | Было | Результат re-QA | Доказательство |
|----|------|-----------------|----------------|
| **BUG-006** | `max-w-sm/md/lg` = 16–40 px | **Verified Fixed** | Login card **448 px** (`max-w-md`); модалка задачи **~1169 px** / `max-w` 1200px. `regr18-login-layout-1440.png` |
| **BUG-009** | «Продолжить → Сохранить» терял задачу | **Verified Fixed** | `upsertDraft` → `createTask({ removeDraftId })` — задача в vault, черновик удалён |
| **BUG-008** | Ось времени не скроллится | **Verified Fixed** | `.week-grid-v-scroll`: ось двигается при `scrollTop=400` |
| **BUG-011** | «Повторить» = re-fetch | **Verified Fixed** | Warm offline create → баннер «Повторить» → задача **сохранена**, `remoteError` cleared |
| **BUG-012** | `?highlightTask=` игнорировался | **Verified Fixed** | Ring `ring-2 ring-primary`, scroll in viewport, URL очищается. `regr18-highlightTask-ring-1440.png` |
| **BUG-013** | SW: только `focus()` | **Verified (code)** | Фикс в `sw.ts` + роутер; **OS-клик** — manual (не в MCP) |
| **BUG-010** | Битый seed → вечная «Инициализация…» | **Verified Fixed** | `motivator_seed_b64=not-valid!!!` → `/onboarding` «Восстановление ключа», **не** бесконечный spinner |
| **BUG-004** | «3» отдельной строкой в EOD DONE | **Partial Verified** | В блоке **СДЕЛАНО** приоритет скрыт; в **НЕ ЗАКРЫТО** rank **3** по-прежнему виден (by design в `EndOfDayModal.tsx`) |
| **BUG-001** | EOD терялся при reload до sync | **Not re-tested** | `awaitVaultSync` в коде; Slow 3G + reload **не** прогонялся в 18 |

### Исправлено в коде (историческая таблица)

| ID | Было | Фикс | Ключевые файлы |
|----|------|------|----------------|
| **BUG-006** | `max-w-sm/md/lg` = 16–40 px | Токены `--spacing-pad-*` + утилиты отступов; Tailwind **`max-w-*`** снова из **`--container-*`** (~24–32 rem) | `web/src/styles/motivator-theme.css` |
| **BUG-009** | «Продолжить → Сохранить» — черновик удалён, задачи нет | Атомарный `createTask` + `removeDraftId`; `mutate` от **`latestPayloadRef`** | `web/src/vault/VaultProvider.tsx`, `AppPage.tsx` |
| **BUG-008** | Ось времени не скроллится с колонками | Единый `.week-grid-v-scroll` на всю сетку часов (ось + 7 дней) | `web/src/components/WeekGrid.tsx` |
| **BUG-011** | «Повторить» делал re-fetch | **`retrySync`**: при гидрации — повтор **upload**, иначе re-hydrate | `VaultProvider.tsx`, `AppPage.tsx` |
| **BUG-012** | `?highlightTask=` игнорировался | Парсинг URL, scroll + ring на карточке (`data-task-id`) | `AppPage.tsx`, `TaskMiniCard.tsx` |
| **BUG-013** | SW: только `focus()` | `navigate` / `postMessage` + роутер в `App.tsx` | `web/src/sw.ts`, `App.tsx` |
| **BUG-001** | EOD терялся при reload до sync | После ритуала — **`awaitVaultSync()`** | `AppPage.tsx`, `VaultProvider.tsx` |
| **BUG-010** | Битый seed → вечная «Инициализация…» | `.catch` на `deriveAesKey` → **`VaultDecryptHelp`** | `VaultProvider.tsx` |
| **BUG-004** | «3» отдельной строкой в EOD DONE | Приоритет скрыт в блоке «сделано»; `flex-nowrap` | `EndOfDayModal.tsx` |

**TC для повтора после деплоя (минимум по блокерам):** TC-C08, TC-DRAFT-06/07, таб «Неделя» + scroll, TC-PWA warm offline + «Повторить», `?highlightTask=`, EOD + Slow 3G reload, TC-A11-5 malformed seed, EOD DONE без строки «3».

### Design 2.0 — Verified (прогон 18)

| Область | Ожидание | Результат |
|---------|----------|-----------|
| **Настройки** | Вкладки Stitch, прототипы **убраны** | **Passed** — «Общие / Приватность / Планирование / Уведомления / Администрирование»; `regr18-settings-tabs-1440.png` |
| **Sidebar** | Прототипы + AI в навигации | **Passed** — Deep Focus, AI Insights, Журнал безопасности, Админ-панель; `regr18-sidebar-design20-1440.png` |
| **Mobile 393×852** | Bottom nav + FAB | **Passed** — vw=393, навигация День/Отчёты, FAB, 121+ карточек |
| **Route guards** | `/app`, `/settings` без сессии | **Passed** — isolated → `/login` (регрессия security) |

### Не исправлено / вне scope

| ID / область | Статус | Комментарий |
|--------------|--------|-------------|
| **BUG-002** | **Открыт** | «Сохранить» → диалог черновика (MCP desktop); повторить после BUG-006 |
| **BUG-005** | **Открыт** | Нет `VITE_FEEDBACK_URL` — конфиг деплоя |
| **BUG-007** | **Открыт** | Defect title >120 символов — edge, низкий приоритет |
| **UX-001…004** (прогон 5) | **Verified Fixed** | Прогон 19 на `0.7.3+5ee2982` — см. ниже |
| **send-due positive E2E** | **Blocked** | Нет `CRON_SECRET` у QA; drift прокси/Edge (прогон 17) |
| **TC-SEC-15** non-admin | **Not run** | Нужна отдельная УЗ без admin |
| **OS notificationclick** | **Manual** | После BUG-012/013 — чеклист в [прогоне 17](#прогон-17--send-due-security--notificationclick--highlighttask) |
| **Desktop validation TC-VAL-*** | **Re-test** | Часть failed из‑за BUG-006, не из‑за логики — полный прогон 6 |

### Включено в тот же коммит (Design 2.0, не было в исходном QA)

| Область | Изменение |
|---------|-----------|
| **Настройки** | Вкладки Stitch (`SettingsTabLayout`); прототипы **убраны** из Settings |
| **Навигация** | Прототипы и AI в sidebar/drawer; Settings внизу sidebar; mobile hamburger |
| **AI** | Глобальная кнопка + правая панель (`AiAssistantPanel`, stub); только **admin** / **beta_tester** |
| **Role gate** | `RequireTesterPreview`, `canAccessPreviewFeatures` |
| **VaultDecryptHelp** | Ссылка на `/settings#privacy` |

| **send-due positive E2E** | **Blocked** | Нет `CRON_SECRET` у QA; drift прокси/Edge (прогон 17, без регрессии в 18) |
| **TC-SEC-15** non-admin | **Not run** | Тестовая УЗ **admin** |
| **OS notificationclick** | **Manual** | BUG-012/013 fixed in code; нужен реальный OS-клик |

### Чеклист полного re-QA — выполнен (прогон 18)

1. ✅ Layout login/modals (BUG-006)
2. ⚠️ UX-аудит (прогон 5) — **не перепроверялся полностью**; Design 2.0 sidebar/settings — OK
3. ⚠️ Валидация полей desktop (прогон 6) — **не полный**; модалки снова кликабельны после BUG-006
4. ✅ Неделя scroll (BUG-008), черновики (BUG-009)
5. ✅ Malformed seed (BUG-010)
6. ✅ PWA warm offline + «Повторить» (BUG-011)
7. ✅ highlightTask (BUG-012), security negative (регрессия 401)
8. ⚠️ RU/EN i18n — **не перепроверялся**
9. ✅ Mobile 393×852

**Критерий готовности к 1.0.0:** блокеры **Verified** ✅; UX-001…004 — **Verified** (прогон 19); инфра push-cron — **на усмотрение команды**.

### Чеклист полного re-QA (исторический, до деплоя)

---

## Карта экранов (Desktop / Mobile)

| Экран / функция | Маршрут | Desktop | Mobile (≤~430px) |
|-----------------|---------|---------|------------------|
| Лендинг | `/` | Редирект в `/app` при активной сессии | То же |
| Вход | `/login` | Email/пароль, «Забыли пароль?» | — |
| Онбординг seed | `/onboarding` | Восстановление / первичная настройка vault | — |
| Планировщик — День | `/app` | Sidebar; табы; AI (disabled); фильтры; EOD; stat-карточки; план + кольцо **справа**; бэклог | Bottom nav; **FAB**; кольцо **над** списком |
| Планировщик — Неделя | `/app` | Сетка 7×24ч; сводка; donut + bar chart | Вертикальный скролл колонок |
| Планировщик — Месяц | `/app` | Календарь; сводка; клик по дню → День | Компактная сетка |
| Меню аккаунта | `/app` | Отчёты, EOD/отчёт, Краткая сводка, Настройки, Выход | Идентично |
| Отчёты | `/app/reports` | KPI 7/30, график, таблицы | Bottom nav |
| Настройки | `/settings` | Seed, планирование, push, аккаунт, юридика, admin | Bottom nav |
| Краткая сводка | модалка | Roadmap, релиз-ноты | Полноэкранная модалка |
| Юридика | `/legal/*` | Ссылки из настроек | — |
| Прототипы | `/prototype/*` | Ссылки в настройках | — |
| FAB дефект | `/app*`, `/settings` | «Сообщить о проблеме» | FAB |
| Hydration overlay | `/app` | Блокировка до загрузки vault | То же |

---

## Test Cases (актуальный реестр)

**Легенда:** D = desktop 1440×900 · M = mobile 393×852 (touch) · **Статус** в [прогонах 1–7](#execution-results-прогон-1), [прогон 6](#прогон-6--валидация-полей--фильтры), [прогон 7](#прогон-7--ru-локаль--неделямесяц--auth).

### Critical — ядро и блокеры

| ID | Название | Предусловия | Шаги | Ожидаемый результат | Статус |
|----|----------|-------------|------|---------------------|--------|
| TC-C01 | Загрузка vault | Auth + seed | `/app` на Slow 3G | Оверлей → данные, sync OK | Passed |
| TC-C02 | Создание задачи | `/app`, сегодня | Модалка → title + estimate → Save | Задача в плане, sync | Passed* |
| TC-C03 | Persist после reload | Есть задача | F5 | Данные на месте | Passed |
| TC-C04 | Выполнение задачи | Задача в плане | Чекбокс | 100%, порядок | Passed |
| TC-C05 | EOD ритуал | Ритуал вкл. | EOD → завершить → sync | Отчёт persist | Passed† |
| TC-C06 | Нет edit до hydrate | Slow/offline | `/app` до hydrate | Overlay, нет create | Passed |
| TC-C07 | Logout / login | УЗ в `.cursor/test-account.local.md` | Выход → login → restore seed | `/app`, данные | Passed |
| TC-C08 | Layout `max-w-*` | Любой экран с `max-w-sm/md/lg` | Открыть login, create task, onboarding | Читаемая ширина карточки/модалки | **Failed** BUG-006 |

\* На desktop сохранение через UI затруднено BUG-006 (модалка ~40px); логика валидации в прогоне 6 проверена отдельно.  
† BUG-001 на Slow 3G при первом reload.

### High — планировщик, shell, отчёты

| ID | Название | Шаги | Ожидаемый результат | Статус |
|----|----------|------|---------------------|--------|
| TC-H01 | Табы Д/Н/М | D/M: переключение | Корректный контент | Passed |
| TC-H02 | Неделя + задача | Таб Неделя | Задача в колонке дня | Passed |
| TC-H03 | Месяц → День | Клик по дню в календаре | День с датой | Passed |
| TC-H04 | Фильтры (базово) | Панель фильтров, 1 критерий | Список + «скрыто N» | Passed → см. TC-VAL-F* |
| TC-H05 | EOD read-only | День закрыт EOD | Нет «Complete ritual» | Passed |
| TC-H06 | Отчёты | `/app/reports`, 7/30 | KPI, график | Passed |
| TC-H07 | Язык EN | Settings → English | UI EN (vault-лейблы могут остаться RU) | Passed |
| TC-H13 | Язык RU | Settings → Русский | UI RU; остатки EN: «End of Day», «FREE», «Productivity Vault» | Passed* |
| TC-H08 | Краткая сводка | Account menu → Brief summary | Модалка roadmap | Passed* |
| TC-H09 | Редактирование задачи | Клик по карточке | TaskEditModal, save | Passed* |
| TC-H10 | Черновики (базово) | Закрыть create без save | Диалог + бейдж Drafts | Passed |
| TC-DRAFT-01 | Черновик: dirty close | Title → ✕ → «Закрыть» | Бейдж +1, hint про «Черновики» | Passed |
| TC-DRAFT-02 | Черновик: pristine close | Открыть create без правок → ✕ | Hint «не сохранится», бейдж без изменений | Passed |
| TC-DRAFT-03 | Список черновиков | Бейдж → модалка | Title черновика в списке | Passed |
| TC-DRAFT-04 | Продолжить: restore | «Продолжить» после F5 | Поля формы (title, «только бэклог») | Passed |
| TC-DRAFT-05 | Persist черновика | F5 после dirty close | Бейдж и содержимое на месте | Passed |
| TC-DRAFT-06 | Save из «Продолжить» | Continue → «Сохранить» (backlog/plan) | Задача в плане/бэклоге, черновик удалён | **Failed** BUG-009 |
| TC-DRAFT-07 | Save без черновика | Create → backlog → Save | Задача в бэклоге | Passed |
| TC-DRAFT-08 | Несколько черновиков | 2× dirty close | Бейдж «:2», оба title в списке | Passed |
| TC-DRAFT-09 | Удалить черновик | Список → «Удалить» | Бейдж −1, sync OK | Passed |
| TC-DRAFT-10 | Mobile FAB | 393×852, FAB «Создать задачу…» | Модалка «Новая задача» | Passed |
| TC-H11 | DR-004 two-tap | `doubleConfirmEnabled` в edit | Pending → done | Blocked (opt-in) |
| TC-H12 | Навигация shell | Sidebar / bottom nav | `/app`, reports, settings | Passed |

\* Модалки на desktop страдают BUG-006; содержимое открывается.

### Auth / Onboarding (TC-A*)

| ID | Название | Ожидаемый результат | Статус |
|----|----------|---------------------|--------|
| TC-A01 | Лендинг `/` без сессии | CTA login | Passed |
| TC-A02 | Login UI | Email/password, register, forgot | Passed |
| TC-A03 | Register PD consent | Checkbox обязателен | Passed |
| TC-A04 | Forgot password | Info без утечки аккаунта | Passed |
| TC-A05 | Неверный пароль | Ошибка, остаёмся на login | Passed (prog 8) |
| TC-A06 | Onboarding restore | Seed + KDF → `/app` | Passed |
| TC-A07 | Reload после restore | Без повторного onboarding | Passed |
| TC-A08 | `/login` с сессией | Redirect `/app` | Passed |
| TC-A09 | Legal `/legal/privacy` | Без auth | Passed |
| TC-A10 | Onboarding setup (новый vault) | Генерация seed | **Passed** (prog 8) |
| TC-A11 | Неверный seed / KDF на restore | Restore с bad seed или bad KDF | Ошибка, нет доступа к данным, recovery | **Passed** (prog 11) |

### UX / Design (TC-UX*)

| ID | Название | Ожидаемый результат | Статус |
|----|----------|---------------------|--------|
| TC-UX01 | Две person-иконки (desktop) | Один смысл «аккаунт» | **Passed** — прогон 19 (`shield` footer + `account_circle` header) |
| TC-UX02 | Account menu только на `/app` | Единая шапка на всех страницах | **Failed** |
| TC-UX03 | Дубли Reports/Settings/EOD | Один primary path | **Failed** |
| TC-UX04 | Sync icon affordance | Статус или popover, не пустая кнопка | **Failed** |
| TC-UX05 | Upgrade Premium stub | Явное «скоро», не disabled CTA | **Failed** |
| TC-UX06 | FAB «+» + defect (mobile admin) | Нет перегруза угла | Partial |

### Валидация — создание задачи (TC-VAL-T*)

| ID | Сценарий (нестандартный) | Ожидаемый результат | Прогон 6 |
|----|-------------------------|---------------------|----------|
| TC-VAL-T01 | Пустой title → Save | Блокировка, «Enter a task title» | **Pass** |
| TC-VAL-T02 | Title только пробелы/`\t`/`\n` | Как пустой title | **Pass** |
| TC-VAL-T03 | Title 600 символов | Обрезка до **500**, счётчик 500/500 | **Pass** |
| TC-VAL-T04 | Control chars `\u0001` в title | Удаляются санитайзером | **Pass** |
| TC-VAL-T05 | Emoji + estimate 1h | Сохранение | **Fail**‡ |
| TC-VAL-T06 | План на день без оценки | Блокировка «need time estimate» | **Pass** |
| TC-VAL-T07 | Бэклог (checkbox), без оценки | Сохранение OK | **Pass** |
| TC-VAL-T08 | Minutes `99` | Санитизация → **59** | **Pass** |
| TC-VAL-T09 | Hours `25` + min `0` | Cap → **24** h | **Pass** |
| TC-VAL-T10 | `24h` + `1m` (сумма >24h) | `estimateInvalid` / блокировка | Partial‡ |
| TC-VAL-T11 | `0h` `0m` на плановой дате | Как «нет оценки» — блок | **Pass** |
| TC-VAL-T12 | RTL/hebrew в title + estimate | Сохранение | **Fail**‡ |
| TC-VAL-T13 | `<img onerror=…>` в title | Хранится как текст (экранирование в UI) | **Pass** |
| TC-VAL-T14 | Сегодня, time=none, оценка > остатка дня | Мягкое предупреждение (не блок) | Not run‡ |
| TC-VAL-T15 | Start time + оценка не влезает в сутки | Блок `estimateExceedsDay` | Not run‡ |
| TC-VAL-T16 | Только minutes `90` → 59, save | Сохранение с 59m | **Fail**‡ |
| TC-VAL-T17 | `\n` и `\t` в title | Сохраняются или нормализуются | Not run |
| TC-VAL-T18 | ZWSP `\u200B` в title | Поведение предсказуемо | Not run |
| TC-VAL-T19 | Дубликат title существующей задачи | Разрешено (не unique) | **Fail**‡ |
| TC-VAL-T20 | Пробелы в полях hours/minutes | Блок «need estimate» | **Pass** |

‡ На production desktop **Save через UI** часто не закрывает модалку из‑за BUG-006; сценарии T05/T12/T16/T19 требуют повтора после фикса layout или на mobile FAB.

### Валидация — дефект GitHub (TC-VAL-D*)

| ID | Сценарий | Ожидаемый результат | Прогон 6 |
|----|----------|---------------------|----------|
| TC-VAL-D01 | Пустые title + description → Create issue | «Enter a title and description.» | **Pass** |
| TC-VAL-D02 | Title OK, description только пробелы | Та же ошибка | **Pass** |
| TC-VAL-D03 | Title >120 символов (ручной ввод) | `maxLength=120`, обрезка | **Pass** (атрибут); см. BUG-007 |
| TC-VAL-D04 | Description >8000 | `maxLength=8000` | **Pass** (атрибут) |
| TC-VAL-D05 | Title только пробелы | Ошибка required | **Pass** |
| TC-VAL-D06 | HTML/script в description | Текст в issue, без выполнения | Not run |
| TC-VAL-D07 | Description >200 символов без steps | Hint «recommend steps» | Not run |
| TC-VAL-D08 | Шаблон Day/Week/Settings | Подстановка title+body | **Pass** |
| TC-VAL-D09 | Вложения: 3-й файл / >3MB / не image | Ошибка `file_too_large` / `invalid_file_type` | Not run |
| TC-VAL-D10 | Preview mode | Markdown preview без PII vault | Not run |

### Валидация — фильтры (TC-VAL-F*)

| ID | Сценарий | Ожидаемый результат | Прогон 6 |
|----|----------|---------------------|----------|
| TC-VAL-F00 | Baseline: ≥1 задача на день | Счётчик видимых карточек | **Pass** (2→1 после фильтра) |
| TC-VAL-F01 | Снять приоритет «Уровень 3» | Задача скрыта, «Hidden by filter: 1» | **Pass** |
| TC-VAL-F02 | «All priorities» после F01 | Все задачи снова видны | **Partial** — нужен явный чек L3 |
| TC-VAL-F03 | Фильтр по группе | Чип / hidden count | Partial (1 группа в данных) |
| TC-VAL-F04 | Reset all | Чипы сброшены | **Pass** |
| TC-VAL-F05 | Фильтр по цвету | Скрытие несовпадающих | **Pass** |
| TC-VAL-F06 | Повторы: recurring / non | Опции только если есть в scope | **Pass** |
| TC-VAL-F07 | Фильтр сохраняется на табе Неделя | hidden count на неделе | **Pass** |
| TC-VAL-F08 | То же на Месяц | hidden count в месяце | **Pass** |
| TC-VAL-F09 | Снять **все** приоритеты | 0 задач или hidden = все | **Partial** |
| TC-VAL-F10 | Mobile: панель фильтров | Full-screen overlay + «Done» | **Pass** |
| TC-VAL-F11 | Чип dismiss (×) | Снимает один критерий | Not run |
| TC-VAL-F12 | Комбо: цвет + группа + repeat | Пересечение AND | Not run |

### Medium / Low

| ID | Название | Статус |
|----|----------|--------|
| TC-M01 | Бэклог без оценки | Passed (T07) |
| TC-M02 | Повторы задач | Not run |
| TC-M03 | Overlap confirm | Not run |
| TC-M04 | Min date (date picker) | Not run |
| TC-M05 | Web Push E2E | **Passed** (prog 12, partial†) |
| TC-M09 | PWA offline | **Partial** (prog 13) |
| TC-M06 | Seed export | Not run |
| TC-M07 | Defect FAB (admin/beta) | Passed |
| TC-M08 | Cookie consent | Not run |
| TC-L01 | Premium stub | UX fail |
| TC-L02 | AI СКОРО | Visible, disabled |
| TC-L03 | Прототипы `/prototype/*` | Not run |
| TC-L04 | Admin roles | Passed (settings) |

---

## Execution Results (прогон 1)

| ID | Desktop | Mobile | Комментарий |
|----|---------|--------|-------------|
| TC-C01 | Passed | Passed* | *mobile overlay не перепроверен отдельно |
| TC-C02 | Passed | Passed | MCP click Save → иногда диалог черновика |
| TC-C03 | Passed | Passed | |
| TC-C04 | Passed | Passed | |
| TC-C05 | Failed→Passed | Failed→Passed | BUG-001 на Slow 3G |
| TC-C06 | Passed | Passed | |
| TC-C07 | **Passed** | **Passed** | Sign out → login → onboarding restore → `/app`; reload без повторного seed |
| TC-H01 | Passed | Passed | |
| TC-H02 | Passed | Not run | |
| TC-H03 | Passed | Not run | Клик «23 1 готово» в месяце → таб День, 23.05 |
| TC-H04 | Passed | Passed | |
| TC-H05 | Passed | Passed | «Today's report»: ritual complete, нет «Complete ritual» |
| TC-H06 | Passed | Passed | Pixel 7: EN UI, streak KPI = 1 после EOD |
| TC-H07 | Passed | Not run | Settings → English; `/app` на EN |
| TC-H08 | Passed | Not run | |
| TC-H09 | Passed | Not run | Edit modal (script click); Close без отдельного Save |
| TC-H10 | Passed | Not run | |
| TC-H11 | N/A→Blocked | Not run | DR-004 opt-in; после включения в edit — нужен ручной 2-tap тест |
| TC-H12 | Passed | Passed | Pixel 7: bottom nav + Week |
| TC-H02 | Passed | Passed | Pixel 7: задача в SAT, untimed row |
| TC-M07 | Passed | Not run | Defect modal EN, viewport 1440×900 в preview |

---

## Exploratory Testing (прогон 1)

1. EOD + Slow 3G: ритуал не persist до повторной попытки (BUG-001).
2. Hydration overlay корректен.
3. Fill automation искажает кириллицу в title — проверить вручную.
4. Settings: поля disabled при загрузке — проверить залипание.
5. Выполненная задача скрыта из слотов недели — по дизайну.
6. VITE_FEEDBACK_URL не задан (BUG-005).
7. Большой объём данных / 2 вкладки — см. [прогон 14](#прогон-14--нагрузка--2-вкладки) (109 задач QA-LOAD, LWW между вкладками).

---

## UX Testing Report

| Критерий | Оценка | Рекомендации |
|----------|--------|--------------|
| Learnability | Хорошо | Tooltip DR-004, seed vs пароль |
| Efficiency | Хорошо | Hotkey «новая задача» post-MVP |
| Clarity (Неделя/Месяц) | Средне | Zoom, контраст мелкого текста |
| Touch & Mobile | Хорошо | Full-screen фильтры, safe-area EOD |
| Emotional Feel | Отлично | — |
| Feedback | Средне | Toast после EOD + блок до sync |
| Accessibility | Средне | Focus trap, keyboard pass |
| Wide-screen | Хорошо | Опционально шире сетка недели |
| Overall Friction | Средне | Save vs close, slow EOD |

---

## Найденные баги

**Легенда статуса (после фикса 2026-05-23):** **Fixed (unverified)** — исправлено в `design-2.0`, нужен re-QA на деплое; **Open** — не трогали; **Closed** — не баг / закрыт ранее.

| ID | Platform | Priority | Severity | Status | Description | Steps |
|----|----------|----------|----------|--------|-------------|-------|
| BUG-001 | Both | Critical | Major | **Fixed (unverified)** | EOD не сохраняется при reload до sync (Slow 3G) | EOD → reload до «Синхронизировано»; **не** re-tested прогон 18 |
| BUG-002 | Desktop | High | Minor | **Open** | «Сохранить» открывает диалог черновика (MCP) | Создать задачу → Сохранить |
| BUG-003 | — | — | — | **Closed** | **Закрыт (не баг):** DR-004 opt-in per task; без галочки в edit — один клик норма | — |
| BUG-004 | Both | Medium | Trivial | **Partial Verified** | Лишний «3» в EOD DONE скрыт; в NOT DONE rank виден | EOD modal; прогон 18 |
| BUG-005 | Both | Low | Trivial | **Open** | Нет VITE_FEEDBACK_URL | Настройки |
| BUG-006 | Both | **Critical** | **Blocker** | **Verified Fixed** | ~~«Сжатые» карточки~~ → login **448px**, modal **~1169px** | Прогон 18 |
| BUG-007 | Desktop | Low | Trivial | **Open** | Defect title: `maxLength=120`, но при программной подстановке >120 символов значение и счётчик `N/120` **расходятся** (низкий риск для ручного ввода) | Defect modal, DevTools fill >120 |
| BUG-008 | Both | High | Major | **Verified Fixed** | ~~Ось «Неделя» не скроллится~~ | Прогон 18 |
| BUG-009 | Both | **Critical** | **Major** | **Verified Fixed** | ~~Черновик «Продолжить → Сохранить»~~ | Прогон 18 |
| BUG-010 | Both | Low | Minor | **Verified Fixed** | ~~Malformed seed → вечная инициализация~~ → onboarding recovery | Прогон 18 |
| BUG-011 | Both | Medium | Major | **Verified Fixed** | ~~«Повторить» терял правки~~ | Прогон 18 |
| BUG-012 | Both | Medium | Major | **Verified Fixed** | ~~highlightTask игнорировался~~ → ring + scroll | Прогон 18 |
| BUG-013 | Both | Low | Minor | **Verified (code)** | SW navigate/postMessage; OS-клик — manual | Прогон 18 |

---

## Прогон 2

**Дата:** 2026-05-23 (продолжение после сохранения отчёта).

| ID | Desktop | Mobile (Pixel 7) | Комментарий |
|----|---------|------------------|-------------|
| TC-H03 | Passed | — | Месяц: день 23 «1 готово» → День, дата 23.05.2026 |
| TC-H05 | Passed | — | «Today's report»: баннер ritual complete; только Close |
| TC-H06 | Passed | Passed | 7/30 days; streak = 1 (после EOD); chart empty (today excluded) |
| TC-H07 | Passed | — | RU→EN; sidebar «Planner/Day/Week»; приоритеты в vault остаются «Уровень N» |
| TC-H09 | Passed | — | Task edit modal; Additional settings: DR-004 checkbox; закрытие через Close |
| TC-H02 | — | Passed | Week grid, задача в субботу без времени |
| TC-H12 | — | Passed | Bottom nav Planner/Reports/Settings |
| TC-M07 | Passed | — | «Report a problem» → GitHub defect form |
| TC-H11 | Blocked | — | DR-004 только при `doubleConfirmEnabled`; автотест не подтвердил 2 шага |

### Новые наблюдения (прогон 2)

- **i18n:** пользовательские названия групп/приоритетов из vault **не переводятся** при EN — ожидаемо.
- **Отчёты:** после EOD streak KPI = **1**; график по-прежнему «No data» (сегодня не в окне графика).
- **BUG-004** подтверждён в EN: в EOD списке DONE отдельная строка **«3»** (приоритет) перед названием задачи.
- **BUG-003** уточнение: не баг — DR-004 **выключен по умолчанию**; включается в Task → Additional settings.

---

## Прогон 3 — Auth / Onboarding

**Дата:** 2026-05-23. После выхода из аккаунта `mussha2010@yandex.ru` (admin).

| ID | Результат | Комментарий |
|----|-----------|-------------|
| TC-C07-1 Sign out | **Passed** | Settings → Sign out; `confirm` про удаление seed из браузера; редирект `/login` |
| TC-C07-2 Route guard | **Passed** | `/app`, `/onboarding` без сессии → `/login` |
| TC-A01 Landing `/` | **Passed** | EN: hero, «Open your vault» → `/login`, «Sign in» в header |
| TC-A02 Login UI | **Passed** | Email/password, Forgot password, Register toggle, Home |
| TC-A03 Register UI | **Passed** | «Register»: PD consent checkbox, link `/legal/personalData`, «Create account» |
| TC-A04 Forgot password | **Passed** | «Reset password»; email → «If an account exists…» (без утечки существования аккаунта) |
| TC-A05 Invalid login | **Passed** | Неверный пароль → «Invalid login credentials», остаёмся на `/login` |
| TC-A06 Login + onboarding | **Passed** | Логин → `/onboarding` (restore); учётные данные: `.cursor/test-account.local.md` (не в git) |
| TC-A07 Seed restore | **Passed** | Seed из локального файла + **пустой** KDF → `/app`, задача QA на месте |
| TC-A08 Reload после restore | **Passed** | F5 `/app`: hydration overlay → данные, **без** повторного onboarding |
| TC-A09 Login при активной сессии | **Passed** | `/login` с сессией + разблокированным vault → редирект на `/app` |
| TC-A10 Legal `/legal/privacy` | **Passed** | Страница открывается без авторизации, EN UI |

### Тест-кейсы Auth (дополнение)

| ID | Название | Шаги | Ожидаемый результат |
|----|----------|------|---------------------|
| TC-A01 | Лендинг без сессии | Открыть `/` | CTA на login, нет доступа к `/app` |
| TC-A02 | Вход | `/login` → email + password | Редирект `/app` или `/onboarding` |
| TC-A03 | Регистрация UI | Toggle Register | PD consent обязателен |
| TC-A04 | Сброс пароля | Forgot → email → Send | Инфо-сообщение, возврат к login |
| TC-A05 | Неверный пароль | Login с bad password | Ошибка, без редиректа |
| TC-A06 | Onboarding restore | Login при vault на сервере, без local seed | Экран импорта seed+KDF |
| TC-A07 | Onboarding setup | Login нового пользователя | Генерация seed + ack «сохранил» |

---

## Прогон 4 — Layout / viewport

**Дата:** 2026-05-23. Повторная проверка по скриншоту пользователя (узкая колонка на `/login`). Метод: Chrome DevTools MCP, `getComputedStyle` + `getBoundingClientRect`, viewports **1440×900** и **393×852** (iPhone).

### Корневая причина (BUG-006)

В `web/src/styles/motivator-theme.css` в блоке `@theme` заданы **spacing-токены** `--spacing-sm/md/lg` (16 / 24 / 40 px). В **Tailwind CSS v4** утилиты `max-w-sm`, `max-w-md`, `max-w-lg` берут значения из **той же шкалы**, а не из стандартных 24rem / 28rem / 32rem.

Проверка на production (`/login`, скрытый тестовый div):

| Класс | Ожидание (Tailwind default) | Факт на production |
|-------|----------------------------|-------------------|
| `max-w-sm` | ~24rem | **16px** |
| `max-w-md` | ~28rem | **24px** |
| `max-w-lg` | ~32rem | **40px** |
| `max-w-2xl` | ~42rem | 672px (OK) |
| `max-w-desktop` | кастом | 1200px (OK) |

Источник в коде: `LoginPage.tsx` — `max-w-md`; `OnboardingPage.tsx` — `max-w-lg`; `designClasses.ts` `MODAL_SHELL` — `max-w-lg`; `CreateTaskModal` — `MODAL_SHELL` + вложенный `max-w-sm`; `LegalDocumentPage` — `max-w-lg`; `AppPage` — `lg:max-w-md` (табы Д/Н/М), `lg:max-w-lg` (колонки недели).

Скриншот воспроизведения: `docs/qa-screenshots/layout-login-bug-1440.png`.

### Матрица экранов (usable width карточки / ключевого контейнера)

Порог «непросматриваемо»: ширина основной карточки **&lt; 280px** при viewport ≥ 390px (или аналогичное сжатие текста по одному символу в строке).

| Экран | Маршрут | Класс-ограничитель | 1440×900 | 393×852 | Статус |
|-------|---------|-------------------|----------|---------|--------|
| Вход | `/login` | `max-w-md` | **~82px** (max 24px + padding) | **~50px** | **Fail** |
| Онбординг restore | `/onboarding` | `max-w-lg` | — | **40px** | **Fail** |
| Юридика | `/legal/privacy` | `max-w-lg` | **40px** | — | **Fail** |
| Лендинг | `/` | `max-w-2xl`, `max-w-3xl`, `max-w-desktop` | 672–1200px | — | **Pass** |
| Планировщик (shell) | `/app` | `max-w-desktop` | 1200px | OK mobile | **Pass** (основной контент) |
| Табы Д/Н/М (desktop) | `/app` | `lg:max-w-md` | **24px** | n/a (нет lg) | **Fail** (desktop) |
| Модалка «Новая задача» | `/app` | `MODAL_SHELL` → `max-w-lg` | **40×800px** | не замерено | **Fail** |
| Модалка «Краткая сводка» | модалка | `max-w-2xl` | ~672px (ожидаемо OK) | — | **Pass*** |
| EOD / Task edit | модалки | `MODAL_SHELL` / `max-w-lg` | **40px** (по классу) | — | **Fail*** |
| Отчёты | `/app/reports` | `max-w-2xl` в intro | OK | — | **Pass** |
| Настройки | `/settings` | `PAGE_CONTAINER` / `max-w-desktop` | OK | — | **Pass** |

\*EOD / Roadmap / Task edit не снимались отдельным скриншотом в этом прогоне; ширина следует из тех же классов (`MODAL_SHELL`, `max-w-lg`).

### Вывод прогона 4

Скриншот пользователя — **не единичный глюк viewport**, а **системная регрессия Design 2.0 + Tailwind v4**: все экраны с `max-w-sm|md|lg` непригодны для использования на **любом** размере окна. Лендинг и часть текстов на `max-w-2xl`/`max-w-desktop` выглядят нормально, что объясняет, почему баг мог не бросаться в глаза на `/` и внутри основной сетки планировщика.

**Рекомендуемый фикс:** в `@theme` завести отдельную шкалу `--max-width-*` (28rem / 32rem …) **или** переименовать spacing-токены (`--spacing-padding-md` и т.д.), **или** заменить проблемные классы на явные `max-w-[28rem]` / `max-w-[32rem]`; прогнать визуальную регрессию login, onboarding, legal, все `MODAL_*`.

---

## UX-аудит — логика и user-friendliness (прогон 5)

**Дата:** 2026-05-23. Только анализ (код не менялся): разбор `MotivatorShell`, `AppPage`, i18n, сопоставление с production и предыдущими прогонами.

### Подтверждение: две «иконки пользователя» на странице Дня (desktop)

| Место | Иконка | Роль в продукте | Кликабельно |
|-------|--------|-----------------|-------------|
| **Шапка справа** | `account_circle` | Меню аккаунта: роль, Отчёты, EOD, Краткая сводка, Настройки, Выход | Да |
| **Sidebar снизу слева** | `person` | Блок тарифа: «Vault защищён» + бейдж **Free** + заглушка Upgrade | **Нет** |

**Вердикт:** это **логическая ошибка UX**, не баг рендера. Две person-подобные иконки на одном экране читаются как «профиль / аккаунт», хотя нижняя — **статус vault + monetization**, не пользователь. Пользователь ожидает один вход в «моё» (профиль, план, выход).

**Рекомендации (приоритет High):**
1. Нижний блок: иконка **`shield` / `lock` / `verified_user`**, не `person`; подпись «Vault защищён» оставить или заменить на «Шифрование активно».
2. **Объединить** план/роль/выход в одном месте: кликабельный footer sidebar **или** единое меню аккаунта в шапке **на всех** страницах shell.
3. На mobile sidebar скрыт — остаётся только шапка; footer с `person` не виден до **≥768px** — на планшете/desktop дублирование снова проявляется.

---

### Навигация и дублирование путей

| Проблема | Где | Почему мешает |
|----------|-----|----------------|
| **Reports + Settings в двух местах** | Sidebar/bottom nav **и** меню аккаунта (только `/app`) | Непонятно, «главный» ли путь; лишние когнитивные ветки |
| **EOD в двух местах** | Кнопка в toolbar Дня **и** пункт меню аккаунта | Один и тот же ритуал — два входа; на `/reports` и `/settings` EOD только через возврат на планировщик |
| **«Краткая сводка» только в меню аккаунта на `/app`** | Нет в sidebar, нет в Settings | Плохая discoverability; в intro модалки явно сказано «из меню на /app» |
| **Выход в двух местах** | Меню аккаунта (`/app`) + кнопка внизу Settings | Разный UX на разных экранах; на Reports нет быстрого выхода в шапке |
| **Меню аккаунта только на AppPage** | `ReportsPage`, `SettingsPage` — пустой `headerActions` | Нет единой «шапки пользователя»; sync-иконка тоже только на планировщике |

**Рекомендации:**
- Sidebar = **структура приложения** (Планировщик, Отчёты, Настройки).
- Меню аккаунта = **сессия** (роль, план Free/Premium, выход) + опционально «Краткая сводка».
- Убрать из меню аккаунта дубликаты Reports/Settings, **или** убрать их из sidebar на mobile (не оба сразу).
- EOD оставить **один** primary entry — в toolbar дня (контекстно); из меню аккаунта убрать или оставить как «shortcut» с пометкой.

---

### Ложные affordances (выглядит кликабельным — не работает или не то)

| Элемент | Проблема |
|---------|----------|
| **Sync-иконка** в шапке `/app` | `<button>` с hover/active, **без `onClick`** — кажется «нажми для статуса/повтора» |
| **Upgrade to Premium** в sidebar | Визуально кнопка, **`disabled` + opacity** — фрустрация «почему не жмётся» без явного «Скоро» в видимом тексте (hint только в `title`/`sr-only`) |
| **AI Command** (desktop) | Disabled input + «СКОРО» — занимает полосу у табов; при BUG-006 ещё и сжимается (`lg:max-w-md`) |
| **Footer `person`** | Визуально как avatar/profile, **не интерактивен** |

---

### Копирайт и mental model

| ID | Наблюдение |
|----|------------|
| UX-01 | Ключ i18n `shell.vaultLocked` = «Vault защищён» при **разблокированном** vault — имя ключа и текст путают «заблокирован / защищён» |
| UX-02 | `shell.planFree` в RU-локали остаётся **«Free»** (англ.) — разрыв языка |
| UX-03 | Seed vs пароль входа vs KDF — по-прежнему высокий риск (уже в QA learnability) |
| UX-04 | BUG-004: приоритет «3» отдельной строкой в EOD DONE — шум в отчёте |
| UX-05 | DR-004 opt-in без подсказки в UI — пользователь не понимает «двойной клик» |
| UX-06 | `roadmapTempButton` — «временная» точка входа только с планировщика; продуктовая функция спрятана |

---

### Mobile / плотность / FAB

| Наблюдение | Рекомендация |
|------------|--------------|
| **FAB «+»** и **FAB дефекта** (admin/beta) оба **справа внизу** | Разнести по углам или объединить «⋯» menu для internal tools |
| Создание задачи: кнопка в toolbar **скрыта** на mobile (`max-md:hidden`), только FAB | OK, но на tablet md+ снова две точки (toolbar + нет FAB) — согласовано |
| Bottom nav 3 пункта + FAB над ней | Нормальный паттерн; проверить safe-area на iPhone с home indicator |
| Фильтры: full-screen sheet на mobile | Хорошо; «Готово» vs tap overlay — OK |

---

### Иерархия внимания на экране Дня

1. Заголовок «Планировщик» + sync + account (шапка)
2. Табы Д/Н/М + отдельная кнопка «скрыть графики» (визуально оторвана от tablist)
3. AI stub (desktop)
4. Панель: Фильтры | EOD | Создать задачу — **горизонтальный скролл** при узкой ширине
5. Stat-карточки + план + кольцо + бэклог

**Рекомендации:** сгруппировать «вид + графики»; EOD визуально выделить (primary/secondary по состоянию дня — уже частично есть); уменьшить шум от AI-stub до иконки «скоро» или перенести в roadmap.

---

### Сводная таблица приоритетов (дизайн / UX, без кода)

| Pri | ID | Тема | Действие |
|-----|-----|------|----------|
| P0 | — | BUG-006 layout | Отдельный технический фикс (не UX-полировка) |
| P1 | UX-DUP-01 | Две person-иконки | Сменить семантику footer + консолидация account |
| P1 | UX-NAV-01 | Дубли Reports/Settings/EOD | Упростить IA, один primary path |
| P1 | UX-NAV-02 | Account menu только на `/app` | Вынести в `MotivatorShell` для всех страниц |
| P2 | UX-AFF-01 | Sync button без action | Сделать tooltip/popover или `<div role="status">` |
| P2 | UX-AFF-02 | Disabled Upgrade | Явный label «Скоро» / не button |
| P2 | UX-COPY-01 | vaultLocked / Free | Правка i18n |
| P3 | UX-MOB-01 | Два FAB справа (admin) | Компоновка |
| P2 | UX-FORM-01 | Типографика полей ввода | См. [аудит полей](#ux-form-01--типографика-полей-форм) |
| P3 | UX-04..06 | EOD list, DR-004, roadmap discoverability | Полировка |

---

### Прогон 5b — визуальная верификация (production)

**Дата:** 2026-05-23. Chrome DevTools MCP, `https://planner-tawny-omega.vercel.app`, учётная запись admin (FAB дефекта виден). Код **не** менялся.

#### Скриншоты (`docs/qa-screenshots/`)

| Файл | Viewport | Что зафиксировано |
|------|----------|-------------------|
| `ux-01-app-day-desktop-account-menu.png` | 1440×900 | Меню аккаунта открыто: Reports, Today's report, Brief summary, Settings, Sign out |
| `ux-02-sidebar-footer-person-icon.png` | 1440×900 | Crop sidebar: `person` + «Vault secured» + **FREE** + disabled Upgrade |
| `ux-03-app-day-desktop-full.png` | 1440×900 | Полный экран Дня: **две** user-иконки (шапка + sidebar) |
| `ux-04-settings-desktop-no-account-header.png` | 1440×900 | Settings: в шапке **только** заголовок, нет sync/account |
| `ux-05-reports-desktop-no-account-header.png` | 1440×900 | Reports: то же — нет меню аккаунта |
| `ux-06-app-day-mobile-393.png` | 393×852 | Mobile: один `account_circle`, bottom nav (Settings = **gear**), два FAB справа |
| `ux-07-eod-modal-bug004-priority-line-mobile.png` | 393×852 | EOD read-only: строка **«3»** перед названием задачи (BUG-004) |
| `ux-08-create-task-modal-bug006-desktop.png` | 1440×900 | Модалка задачи **40×800 px** (BUG-006) |
| `ux-09-account-menu-duplicate-nav-items.png` | 1440×900 | Дубли: Reports/Settings в sidebar **и** в меню аккаунта |
| `ux-10-app-day-tablet-768-dual-person.png` | 768×1024 | **Breakpoint md:** sidebar уже виден, bottom nav скрыт — дубль person снова |
| `ux-11-settings-mobile-bottom-nav-only.png` | 393×852 | Settings mobile: выход только внизу страницы, в шапке пусто |
| `ux-12-account-menu-mobile-393.png` | 393×852 | Меню аккаунта на mobile (единственная «профильная» точка) |
| `layout-login-bug-1440.png` | 1440×900 | (прогон 4) Сжатый login — BUG-006 |

#### Автоматические замеры (DOM)

| Проверка | Desktop 1440 | Mobile 393 | Tablet 768 |
|----------|--------------|------------|------------|
| Sidebar `person` footer | **Виден** | Скрыт (`display:none`) | **Виден** |
| Account menu в шапке | Только `/app` | Только `/app` | Только `/app` |
| Sync `<button>` onClick | **Нет** (клик без эффекта) | То же | — |
| `/settings` header buttons | **0** | **0** | — |
| `/reports` account menu | **Нет** | — | — |
| Create task modal width | **40 px** | — | — |
| FAB «+» (mobile) | — | right **24px**, bottom **96px** | — |
| FAB «Report a problem» (admin) | right 16px, bottom 16px (desktop fixed) | right **16px**, bottom **16px** | — |

**Mobile FAB (admin):** оба FAB **справа**, вертикальный зазор ~**24 px** между «+» и «Report a problem» — не перекрываются, но визуально **перегружают** правый нижний угол (см. `ux-06`).

**EOD дубль (визуально):** на Дне кнопка **«Today's report»** в toolbar **и** пункт **«Today's report»** в меню аккаунта ведут к одному сценарию (`ux-01`, `ux-12`).

**Tablet (768 px):** порог `md` — sidebar включается, bottom nav отключается; пользователь iPad сразу видит **UX-DUP-01** (`ux-10`).

#### Статус пунктов UX-аудита после визуального прогона

| ID | Визуально подтверждено |
|----|------------------------|
| UX-DUP-01 | **Да** — `ux-03`, `ux-10` |
| UX-NAV-01 | **Да** — `ux-09`, EOD в toolbar + menu |
| UX-NAV-02 | **Да** — `ux-04`, `ux-05`, `ux-11` |
| UX-AFF-01 | **Да** — sync click без UI-реакции |
| UX-AFF-02 | **Да** — `ux-02` disabled Upgrade |
| UX-04 (BUG-004) | **Да** — `ux-07` |
| BUG-006 | **Да** — `ux-08`, `layout-login-bug-1440` |
| UX-MOB-01 | **Да** — два FAB справа `ux-06` |

---

### UX-FORM-01 — типографика полей форм

**Дата:** 2026-05-23. Замечание при прогоне 7 (скриншот пользователя: панель «View filters»). Код **не** менялся.

**Симптом:** текст **внутри** полей (особенно `<select>`) выглядит «вычурно» / не в стиле остального UI: крупнее подписи, другой ритм букв, нативный вид dropdown, текст прижат к рамке.

#### Корневые причины (код)

1. **`FIELD_LABEL` / `SETTINGS_LABEL` на элементе `<label>`, а не только на подписи**  
   Класс `text-label-sm` задаёт Geist + `letter-spacing: 0.04em`. Свойство **наследуется** дочерними `select`/`input`/`button`.  
   Пример — фильтры в `AppPage.tsx` (строки 1216–1219): `SETTINGS_LABEL` на `<label>`, внутри `<select className={MOTIVATOR_INPUT}>`.  
   Тот же паттерн в `CreateTaskModal`, `TaskEditModal`, `SettingsPage`, аккордеонах времени/цвета, `SeedKeyImportForm`.  
   **Исключение (правильнее):** `PriorityLabelField` — стиль только на `<span>`, у input `letter-spacing: normal`.

2. **`.motivator-input` без внутренних отступов** — только border/фон/radius (`motivator-theme.css`, ~296–301).  
   На production (фильтры, desktop): `padding: 0`, высота select **~21 px**. Login/onboarding добавляют `px-3 py-2.5` **локально** — поля auth выглядят иначе, чем в приложении.

3. **Контраст label vs value**  
   - Подпись: Geist 12px, weight 500, tracking 0.04em (`text-label-sm`).  
   - Значение: Inter 14px desktop / **16px mobile** (правило anti-zoom в `index.css`).  
   - На mobile значение заметно **крупнее** подписи → перевёрнутая иерархия.

4. **Нативные `<select>`** — `appearance: auto`; на Windows/OS шрифт selected value может отличаться от Inter (визуально «системный»), в отличие от кастомной кнопки «All priorities».

#### Замеры DOM (production, фильтры)

| Элемент | font-size | letter-spacing | padding | height |
|---------|-----------|----------------|---------|--------|
| Label «Group» | 12px Geist | 0.48px | — | — |
| `<select>` Group | 14px Inter | **0.48px (наслед.)** | **0** | ~21px |
| Button «All priorities» | 14px Inter | **0.48px (наслед.)** | **0** | ~22px |

Mobile (393px): select **16px** — ещё сильнее контраст с подписью 12px.

#### Затронутые экраны

| Область | Поля |
|---------|------|
| Фильтры `/app` | group, color, repeats (select); priorities (button) |
| Create / Edit task | title, priority, group, estimate, repeat… |
| Settings | rename, priority labels, EOD time, language… |
| Defect modal | title, description, template fields |
| Auth | email, password, seed — **с padding**; label `uppercase tracking-wide` |
| Admin roles | search, role select |

#### Рекомендации (P2)

1. Перенести `FIELD_LABEL`/`SETTINGS_LABEL` **только на `<span>`** подписи, не на `<label>`/обёртку.
2. В `.motivator-input`: `px-3 py-2`, `letter-spacing: normal`, `font-family: var(--font-sans)`; min-height ~36–40px.
3. Select: `appearance: none` + стрелка **или** button+popover (как «Priorities») для всех фильтров.
4. Mobile: согласовать 16px в полях с размером подписи (sans 13–14px, без display-tracking).
5. Auth: убрать `uppercase tracking-wide` или привести к единому стилю подписей.

**Статус:** **Failed** (UX-FORM-01) — системная проблема.

---

## Прогон 6 — валидация полей + фильтры

**Дата:** 2026-05-23. Production, admin, desktop 1440 + mobile 393. Код **не** менялся. Метод: DOM-скрипты + MCP `fill`/`click`, «нестандартные» данные (control chars, 600-char title, minutes 99, RTL, HTML в title, whitespace-only, combo-фильтры).

### Создание задачи — итог

| Категория | Результат |
|-----------|-----------|
| **Блокирующая валидация** | Пустой/пробельный title, нет оценки на плановой дате, нулевая оценка — **работает** |
| **Санитизация** | Title →500, control chars, minutes 99→59, hours 25→24 — **работает** |
| **Бэклог** | Без оценки сохраняется — **OK** |
| **Save E2E** | На desktop **затруднён** BUG-006; emoji/RTL/duplicate title — **не подтверждены** как save |
| **Побочный эффект** | Накопилось **16 черновиков** в vault от прогона (закрытие модалки без save) |

Логи: `docs/qa-screenshots/validation-run-log.json`, `validation-task-batch2.json`.

### Дефект GitHub — итог

| ID | Результат |
|----|-----------|
| TC-VAL-D01/D02/D05 | Required title+description (trim) — **Pass** |
| TC-VAL-D03 | `maxLength=120` на input — **Pass** при ручном вводе; programmatic fill >120 → BUG-007 |
| TC-VAL-D08 | Шаблон **Day** подставляет title/body — **Pass** |
| TC-VAL-D09/D10 | Вложения, preview — **Not run** |

Модалка дефекта: inner width **40px** (BUG-006), как create task.

### Фильтры — итог

| ID | Результат | Комментарий |
|----|-----------|-------------|
| TC-VAL-F01 | **Pass** | Снятие «Уровень 3» скрывает QA-задачу, hint «Hidden by filter: 1» |
| TC-VAL-F02 | **Partial** | Кнопка **All** в меню приоритетов не вернула L3 автоматически — нужен ручной чек |
| TC-VAL-F04–F08 | **Pass** | Reset, цвет, repeat, перенос на Week/Month |
| TC-VAL-F09 | **Partial** | При «0 приоритетов» в UI остаётся 1 видимая кнопка — проверить логику `priorityEnabled` |
| TC-VAL-F10 | **Pass** | Mobile: overlay + «Done» |
| TC-VAL-F11–F12 | **Not run** | Dismiss чипа, triple AND |

Лог: `docs/qa-screenshots/validation-filters-batch.json`.

**Наблюдение (фильтры):** в dropdown приоритетов показываются **только ранги, присутствующие в текущем scope** (после других фильтров) — при одной задаче L3 в меню виден только «Уровень 3».

### Рекомендации QA (без правок кода)

1. После фикса BUG-006 — **повторить TC-VAL-T05/T12/T14–T19** и TC-VAL-D07/D09 на desktop.
2. Прогнать **TC-VAL-F11/F12** и chip dismiss вручную.
3. ~~Очистить **черновики** тестовой УЗ (16 шт.)~~ — **сделано** в [прогоне 8](#прогон-8--негативный-login--setup--черновики).
4. Негативные вложения дефекта: `.pdf`, 4MB png, 3-й файл подряд.

---

## Прогон 7 — RU-локаль / Неделя·Месяц / Auth

**Дата:** 2026-05-23. Production, учётная запись admin (`mussha2010@yandex.ru`). Код **не** менялся.  
**Контекст:** после прогонов 1–6 UI на production-сессии был преимущественно **EN**; прогон 7 переключает язык на **RU** (Settings → «Русский»), затем проверяет планировщик, auth-flow и юридику.

**Метод:** Chrome DevTools MCP — desktop 1440×900, mobile 393×852 (touch); `fill_form` для login/onboarding; скриншоты в `docs/qa-screenshots/prog7-*`.

### Планировщик (RU)

| ID | D | M | Комментарий |
|----|---|---|-------------|
| TC-H13 | **Passed** | **Passed** | Sidebar «Планировщик/Отчёты/Настройки»; табы «День/Неделя/Месяц»; дата «суббота, 23 мая 2026 г.» |
| TC-H01 | **Passed** | **Passed** | Переключение табов D/M без ошибок |
| TC-H02 | **Passed** | **Passed** | Неделя: задача QA в колонке субботы (`prog7-week-desktop-ru-1440`, `prog7-week-mobile-ru-393-v2`) |
| TC-H03 | **Passed** | Not run | Месяц: «май 2026», день **23 «1 готово»** → клик → таб «День», «23 мая» |
| TC-H06 | **Passed** | Not run | `/app/reports`: KPI, период «16–22 мая 2026», заголовки на RU (`prog7-reports-ru-desktop-1440`) |

### Mobile (393×852, RU)

| Проверка | Результат |
|----------|-----------|
| Таб «Неделя» | `aria-selected=true`, сетка видна — **Passed** (`prog7-week-mobile-ru-393-v2`) |
| Таб «Месяц» | `aria-selected=true`, «май 2026» — **Passed** (`prog7-month-mobile-ru-393-v2`) |
| Bottom nav | «Планировщик / Отчёты / Настройки» — **Passed** |

> Ранние скриншоты `prog7-week-mobile-ru-393.png` / `prog7-month-mobile-ru-393.png` сделаны до повторного клика по табу; **v2** — после явного переключения.

### Auth / Onboarding (RU, повтор прогона 3)

| ID | Результат | Комментарий |
|----|-----------|-------------|
| TC-C07 Sign out | **Passed** | Настройки → «Выйти»; confirm **на RU** («Seed и пароль деривации…»); редирект `/login`, h1 **«Вход»** |
| TC-A01 Landing `/` | **Passed** | «Ваш приватный vault…», «Открыть vault», «Войти» (`prog7-landing-ru-desktop-1440`) |
| TC-A02 Login UI | **Passed** | «Вход», EMAIL/ПАРОЛЬ, «Забыли пароль?», «Зарегистрироваться» |
| TC-A03 Register UI | **Passed** | «Регистрация», PD consent + ссылка «политика» → `/legal/personalData` (`prog7-register-ru-desktop-1440`) |
| TC-A04 Forgot password | **Passed** | «Сброс пароля», «Отправить ссылку», «← Назад ко входу» (`prog7-forgot-ru-desktop-1440`) |
| TC-A06 Login → onboarding | **Passed** | `fill_form` email/password → `/onboarding` |
| TC-A07 Seed restore | **Passed** | Seed из `.cursor/test-account.local.md` + **пустой** KDF → `/app`, задача QA на месте |
| TC-A09 Legal privacy | **Passed** | `/legal/privacy` без auth, h1 **«Политика конфиденциальности»**, `lang=ru` (`prog7-legal-privacy-ru-desktop-1440`) |
| TC-A05 Invalid login | Not run | — |
| TC-A08 Session redirect | Not run | — |
| TC-A10 Onboarding setup | Not run | — |

### BUG-006 в RU (layout)

| Экран | Замер DOM | Скриншот |
|-------|-----------|----------|
| `/login` | `.glass-panel` **width ≈ 82 px**, `max-width: 24px` (`max-w-md`) | `prog7-login-ru-desktop-1440` |
| `/onboarding` | Карточка restore **сжата** (тот же конфликт `@theme` / Tailwind v4) | `prog7-onboarding-restore-ru-desktop-1440` |

**Вывод:** BUG-006 **не зависит от локали** — блокер для login/register/forgot/onboarding и модалок на desktop остаётся.

### i18n — остатки EN при RU

| Место | Текст EN | Приоритет |
|-------|----------|-----------|
| Stat-карточка дня | **«End of Day»** (статус «День закрыт» рядом — RU) | P2 |
| Sidebar footer | **«FREE»** | P2 (см. UX-02) |
| Auth / onboarding header | **«Productivity Vault»** | P3 |
| Отчёты, стрик DR-013 | **«End-of-Day»** в пояснении | P3 |
| Бренд | «Мотиватор · **Motivator**» | Ожидаемо (двуязычный маркер) |

### Скриншоты прогона 7

| Файл | Viewport | Содержание |
|------|----------|------------|
| `prog7-app-day-ru-desktop-1440.png` | 1440×900 | День после restore, RU |
| `prog7-week-desktop-ru-1440.png` | 1440×900 | Неделя, задача в сетке |
| `prog7-month-desktop-ru-1440.png` | 1440×900 | Месяц, «23 1 готово» |
| `prog7-week-mobile-ru-393-v2.png` | 393×852 | Неделя mobile (verified tab) |
| `prog7-month-mobile-ru-393-v2.png` | 393×852 | Месяц mobile (verified tab) |
| `prog7-reports-ru-desktop-1440.png` | 1440×900 | Отчёты RU |
| `prog7-landing-ru-desktop-1440.png` | 1440×900 | Лендинг logged out |
| `prog7-login-ru-desktop-1440.png` | 1440×900 | Login BUG-006 |
| `prog7-register-ru-desktop-1440.png` | 1440×900 | Register + PD |
| `prog7-forgot-ru-desktop-1440.png` | 1440×900 | Сброс пароля |
| `prog7-onboarding-restore-ru-desktop-1440.png` | 1440×900 | Restore seed (сжато) |
| `prog7-legal-privacy-ru-desktop-1440.png` | 1440×900 | Privacy policy RU |

---

## Прогон 8 — негативный login / setup / черновики

**Дата:** 2026-05-23. Production, desktop 1440×900. Код **не** менялся.

### TC-A05 — неверный пароль (RU UI)

| Шаг | Результат |
|-----|-----------|
| Sign out → `/login` | **Passed** |
| Email `mussha2010@yandex.ru`, пароль `wrongpassword999` → «Войти» | **Passed** |
| Остаёмся на `/login`, ошибка **«Invalid login credentials»** | **Passed** (текст ошибки **EN** при RU UI — i18n gap) |
| Скриншот | `prog8-login-negative-ru-1440.png` |

### TC-A10 — onboarding setup (новый пользователь)

| Шаг | Результат |
|-----|-----------|
| Register: новый email `planner-qa-setup-mvp100-<timestamp>@yandex.ru`, пароль `123123`, PD consent | **Passed** — сессия без email-confirm |
| `/onboarding` → режим **setup** («Новый ключ шифрования», badge «ПЕРВИЧНАЯ НАСТРОЙКА») | **Passed** |
| «Сгенерировать seed» → seed base64 44 символа, ack «Я сохранил(а) seed…», пустой KDF → «Продолжить» | **Passed** |
| Редирект `/app`, пустой план/бэклог | **Passed** |
| Скриншоты | `prog8-onboarding-setup-ru-1440.png`, `prog8-onboarding-setup-app-empty-1440.png` |

> **Примечание:** создана **одноразовая** QA-УЗ на production (email с префиксом `planner-qa-setup-mvp100-`). Пароль не фиксируется в отчёте; при необходимости удалить через admin / Supabase Dashboard.

После прогона основная тестовая УЗ (`mussha2010@yandex.ru`) **восстановлена** (login + seed restore).

### Очистка черновиков (TC-H10 / прогон 6 хвост)

| До | Действие | После |
|----|----------|-------|
| **16** черновиков (бейдж «Черновики: 16» на кнопке «Создать задачу») | Модалка списка → **16× «Удалить»** (по одному, без bulk) | Бейдж **исчез**, sync OK |
| Содержимое | 6× «(без названия)», VAL-* из прогона 6, emoji/HTML/RTL/500-char тесты | — |

Скриншот после очистки на основной УЗ: `prog8-drafts-cleared-1440.png`.

**Наблюдение:** bulk-delete черновиков **нет** — при большом числе QA-прогонов удаление вручную/скриптом долго; идея «Удалить все» — post-MVP или internal.

---

## Прогон 9 — скролл недели + аналитика

**Дата:** 2026-05-23. Production, УЗ `mussha2010@yandex.ru`, desktop 1440 + mobile 393. Код **не** менялся.

### BUG-008 — скролл сетки «Неделя» (подтверждён)

**Симптом (замечание пользователя):** при прокрутке недельной сетки **строки с часами «уезжают» относительно задач** — подписи времени не совпадают с горизонтальными линиями и блоками задач.

**Причина в коде:** в `WeekGrid.tsx` ось часов (колонка 1, строка 3) — **статичный** блок высотой `24 × 42px`, а колонки дней (2–8) — в **отдельном** контейнере с `overflow-y-auto` (`.week-grid-v-scroll`). При `scrollTop > 0` двигается только правая часть (см. `web/src/components/WeekGrid.tsx`, строки 218–246).

**Замеры DOM (production, scrollTop = 307 px):**

| Элемент | scrollTop = 0 | scrollTop = 307 |
|---------|---------------|-----------------|
| `innerContentTop` (колонки задач) | 643 px | **336 px** (Δ 307) |
| `hour00Top` (подпись «00:00» слева) | 643 px | **643 px** (не двигается) |
| `hour10Top` | 1063 px | **1063 px** (не двигается) |

**Вердикт:** **Failed** — блокер UX для таймблокинга на «Неделе» (desktop и mobile; на 393×852 max scroll ≈ 344 px, та же рассинхронизация).

**Скриншоты:** `prog9-week-scroll-top-1440.png`, `prog9-week-scroll-misaligned-1440.png`, `prog9-week-scroll-mobile-393.png`.

**Рекомендация fix:** общий scroll-container для оси + колонок **или** синхронизация `scrollTop` (как минимум — не разделять scroll context).

#### Другие скроллы (кратко)

| Область | Поведение | Статус |
|---------|-----------|--------|
| Stat-карточки Дня (mobile) | Горизонтальный snap-scroll | OK |
| Фильтры (mobile) | Full-screen sheet + overflow | OK |
| Sidebar / модалки | `overflow-y-auto`, единый контекст | OK |
| Месяц | Без split-axis scroll | OK |
| **Неделя** | Split scroll | **BUG-008** |

### Отображение задач на «Неделе»

| Проверка | Результат |
|----------|-----------|
| Задача без слота (`QA Test Task MVP`, суббота 23.05) | В **верхней** строке «без времени» колонки Сб — **OK** |
| Состояние done | `line-through` на чипе — **OK** |
| Цветовая полоска | `border-left` zinc — **OK** |
| Задачи **со слотом** (позиция top/height в сетке) | **Not run** — в vault нет slotted-задач на неделе; при BUG-008 позиционирование slotted всё равно визуально ломается при scroll |

### Аналитика `/app/reports` — верификация

**Контекст vault (тестовая УЗ):** 1 выполненная задача на **сегодня** (23.05.2026), EOD за сегодня закрыт; в окне **16–22 мая** отметок нет.

**UI (7 дней):**

| KPI | UI | Ожидание по `@motivator/core` (`vaultAnalytics`) | Статус |
|-----|-----|--------------------------------------------------|--------|
| Период | 16–22 мая 2026 | `reportsWindowKeys(7)`: `toKey` = вчера, 7 календарных дней | **Pass** |
| Дни подряд DR-013 | **1** | `consecutiveDr013DaysEndingOn(..., today, eodSet)`: сегодня EOD + план выполнен; вчера без цепочки → 1 | **Pass** |
| Дней с отметкой | **0 %** (0/7) | `completionDayRate` за 16–22: нет `taskCompletedOnLocalDay` | **Pass** |
| Всего отметок | **0** | `totalCompletionMarksInRange`: выполнение **23.05** вне окна графика | **Pass** |
| Гистограмма | «Нет данных за выбранный период» | `dailyCompletionBuckets` все 0 | **Pass** |
| DR-008 таблицы | Пусто | Нет просроченных/пропусков в окне | **Pass** |

**UI (30 дней):** период **23 апр – 22 мая 2026**, 0/30, total 0, streak **1** — согласовано.

**Unit-тесты:** `packages/motivator-core` → `vaultAnalytics.test.ts` — **4/4 pass** (локально).

**UX-наблюдение (не баг):** выполнение и EOD **сегодня** попадают в KPI «дни подряд», но **не** в столбчатый график (окно заканчивается **вчера** — явно указано в intro на странице). Пользователь может ожидать столбец за сегодня — продуктовая ясность, не ошибка расчёта.

**Вердикт аналитики:** **Passed** — цифры соответствуют контракту DR-007/DR-013/DR-008 и коду `ReportsPage` + `vaultAnalytics`.

---

## Прогон 10 — черновики

**Дата:** 2026-05-23. Production, УЗ `mussha2010@yandex.ru`, desktop 1440×900 + mobile 393×852. Код **не** менялся.

**Контекст:** после [прогона 8](#прогон-8--негативный-login--setup--черновики) vault без черновиков (0); в прогоне созданы QA-черновики и задачи.

### Сводка TC-DRAFT-*

| ID | Результат | Комментарий |
|----|-----------|-------------|
| TC-DRAFT-01 | **Passed** | «QA Draft Backlog Final», «QA Draft Plan With Est», «QA Draft Second» — dirty close → бейдж растёт |
| TC-DRAFT-02 | **Passed** | Открыть create без правок → ✕ → hint «черновик не сохранится» (RU), бейдж не меняется |
| TC-DRAFT-03 | **Passed** | Модалка «Черновики», title в списке (не «без названия») |
| TC-DRAFT-04 | **Passed** | После F5: «QA Draft B backlog» — title + checkbox «Добавить в бэклог» checked |
| TC-DRAFT-05 | **Passed** | F5: бейдж «Черновики: 1», «QA Draft Plan With Est» в vault |
| TC-DRAFT-06 | **Failed** | **BUG-009** — см. ниже |
| TC-DRAFT-07 | **Passed** | «QA Direct Backlog Task», «QA Direct Backlog B» — Save без resume → в бэклоге |
| TC-DRAFT-08 | **Passed** | Два dirty close подряд → бейдж «:2», оба title в списке |
| TC-DRAFT-09 | **Passed** | «Удалить» в списке: «:2» → «:1» |
| TC-DRAFT-10 | **Passed** | Mobile FAB `aria-label` «Создать задачу…» → модалка «Новая задача» |

### BUG-009 — «Продолжить → Сохранить» теряет задачу

**Симптом:** пользователь сохраняет черновик через список («Продолжить»), нажимает «Сохранить» — модалка закрывается, **бейдж черновиков исчезает** (или уменьшается), но **задачи нет** ни в плане дня, ни в бэклоге.

**Воспроизведение (production, MCP):**

| Шаг | Наблюдение |
|-----|------------|
| Create → title «QA Draft Backlog Final» → «только бэклог» → ✕ → «Закрыть» | Бейдж «Черновики: 1» |
| Бейдж → «Продолжить» → «Сохранить» | Бейдж **0**, «QA Draft Backlog Final» **нет** в UI |
| Аналогично для plan/backlog черновиков ранее («QA Draft Test A», «QA Draft Save Test») | Draft удалён, задачи нет |

**Контроль:** прямое создание **без** resume (`Create → backlog → Save`) — задача **появляется** («QA Direct Backlog Task», «QA Direct Backlog B»).

**Валидация при resume (ожидаемо):** plan-черновик без оценки → «Сохранить» не проходит validation → **черновик остаётся** (бейдж не меняется). `form.requestSubmit()` **не** вызывает save (кнопка `type="button"`, нет `onSubmit` на form) — не баг продукта.

**Вероятная причина в коде (race / stale closure):**

```1427:1429:web/src/pages/AppPage.tsx
        onSave={async (input, opts) => {
          await createTask(input)
          if (opts.removeDraftId) await deleteDraft(opts.removeDraftId)
```

`createTask` и `deleteDraft` в `VaultProvider` оба применяют мутацию к **`vault` из замыкания** последнего рендера. Последовательный вызов: `applyCreateTask(vault₀)` → затем `applyDeleteDraft(vault₀)` — **вторая операция перезаписывает первую** (задача не попадает в итоговый payload, черновик удаляется). Без `removeDraftId` (прямое создание) гонки нет.

Дополнительный риск: `createTask` при `!remoteHydrated` или пустом title — **silent return**, но `deleteDraft` всё равно вызывается из `onSave`.

**Приоритет:** **Critical** для сценария черновиков (потеря пользовательского ввода). **Fix:** атомарная мутация «create task + delete draft» на одном снимке vault **или** `deleteDraft` через функциональное обновление от `latestPayloadRef`, **или** удалять черновик только после подтверждённого `createTask`.

**Скриншоты:** `prog10-draft-continue-1440.png`, `prog10-drafts-list-1440.png`, `prog10-drafts-badge-mobile-393.png`.

### Состояние vault после прогона

| Область | Содержимое |
|---------|------------|
| План | «QA Test Task MVP» (done, EOD закрыт) |
| Бэклог | «QA Direct Backlog Task», «QA Direct Backlog B», «VAL backlog only…» |
| Черновики | **1** — «QA Draft Plan With Est» (plan, без оценки; save блокируется validation) |

---

## Прогон 11 — неверный seed (restore)

**Дата:** 2026-05-23. Production, УЗ `mussha2010@yandex.ru`, desktop 1440×900. Код **не** менялся.

**Цель:** негативный сценарий восстановления vault на `/onboarding` (TC-A11) — неверный seed, неверный KDF, recovery без sign-out.

### TC-A11 — сводка

| Подкейс | Шаги | Ожидание | Результат |
|---------|------|----------|-----------|
| **A11-1 Пустой seed** | Sign out → login → `/onboarding` restore → «Продолжить» без seed | Inline-ошибка, остаёмся на onboarding | **Passed** — «Вставьте сохранённый seed (base64) одной строкой.» |
| **A11-2 Неверный seed (valid base64)** | Seed `AAAA…=` (32 байта нулей), KDF пустой → continue | Нет доступа к vault, редактирование off | **Passed** — редирект `/app`, `VaultDecryptHelp`: «Не удаётся расшифровать данные», задачи **не** видны, «Создать задачу» **disabled** |
| **A11-3 Неверный KDF** | Верный seed + пароль `wrong-kdf-password` | То же | **Passed** — decrypt help на `/app`, `QA Test Task MVP` скрыта |
| **A11-4 Recovery in-app** | На `/app` с decrypt-fail → «Ввести seed заново» → верный seed + пустой KDF → «Применить ключ» | Vault расшифрован без sign-out | **Passed** — decrypt-баннер исчез, задачи на месте, create enabled |
| **A11-5 Malformed base64** | `not-valid-base64!!!` в `localStorage` → reload | Ошибка на форме **или** понятный fallback | **Partial / BUG-010** — см. ниже |

### Наблюдения (поведение продукта)

**Ошибка не на onboarding, а на `/app`.** `saveSeed` не проверяет расшифровку remote vault — только сохраняет пару seed+KDF и редиректит. Неверный ключ проявляется **после** загрузки ciphertext (`VaultDecryptHelp`). Для пользователя это может выглядеть как «вошёл, но всё сломано» вместо «неверный seed» на форме restore. Recovery (DR-014 variant A) **работает** — sign-out не нужен.

**MCP / BUG-006:** на `/onboarding` restore `getBoundingClientRect` textarea ≈ **2 px**, кнопка «Продолжить» ≈ **0 px** ширины — UI-клик через DevTools **не** проходит; сценарии A11-2/3 воспроизведены через эквивалент `saveSeed` (localStorage + navigate), что совпадает с кодом `OnboardingPage` → `saveSeed` → `/app`.

**BUG-010 (edge):** если в `localStorage` уже лежит **невалидный base64**, `VaultProvider` вызывает `deriveAesKey` без `.catch` → `ready` не становится `true` → бесконечное «Инициализация шифрования…» (проверено на `/settings`). На форме onboarding malformed seed при submit должен давать `onboarding.errSave` (catch в `SeedKeyImportForm`) — отдельно через UI не прогонялось из‑за BUG-006.

### Скриншоты

| Файл | Содержание |
|------|------------|
| `prog11-wrong-seed-decrypt-1440.png` | `/app` после неверного seed: decrypt help + форма «Ввести seed заново» |

**Состояние после прогона:** vault **восстановлен** (верный seed, пустой KDF), `/app` — данные QA на месте.

---

## Прогон 12 — Web Push E2E

**Дата:** 2026-05-23. Production `https://planner-tawny-omega.vercel.app`, УЗ `mussha2010@yandex.ru`, desktop 1440×900. Код **не** менялся.

**Цель:** TC-M05 — UI настроек push, service worker, подписка устройства, Edge **`notifications-test`**.

### TC-PUSH-* — сводка

| ID | Шаги | Ожидание | Результат |
|----|------|----------|-----------|
| TC-PUSH-01 | `/settings` → секция «Уведомления (Web Push)» | Три режима off/hybrid/full, подсказки RU | **Passed** |
| TC-PUSH-02 | Режим **off** | Кнопки «Разрешить…» / «Тестовое» **скрыты**; EOD push-checkbox disabled | **Passed** |
| TC-PUSH-03 | Выбрать **hybrid** → «Сохранить» | Кнопки подписки/теста видны; EOD push-checkbox enabled | **Passed** |
| TC-PUSH-04 | SW на production | `sw.js` active | **Passed** — `navigator.serviceWorker.getRegistration()`, script `…/sw.js` |
| TC-PUSH-05 | VAPID на фронте | Нет текста «VITE_VAPID_PUBLIC_KEY не задан» | **Passed** — ключ в сборке есть |
| TC-PUSH-06 | «Разрешить уведомления…» + grant | Подсказка «Подписка… сохранена в Supabase», строка в `push_subscriptions` | **Passed** — FCM endpoint, `POST push_subscriptions` **201** |
| TC-PUSH-07 | «Отправить тестовое уведомление» | Edge **`notifications-test`** 200, без UI-ошибки | **Passed** — ответ `{"ok":true,"count":1}` |
| TC-PUSH-08 | Синхронизация расписания | При смене режима — пересчёт `notification_fire_requests` | **Passed** — в Network: `DELETE …/notification_fire_requests?status=eq.scheduled` после save hybrid |
| TC-PUSH-09 | **`send-due` cron** — push по расписанию задачи | Push в момент `fire_at_utc` | **Not run** — нужен cron + задача со слотом в ближайшем окне |
| TC-PUSH-10 | **`notificationclick`** → `/app` | Клик по системному уведомлению открывает приложение | **Not run** — OS notification в MCP не верифицировалась визуально |
| TC-PUSH-11 | Режим **full** vs **hybrid** (текст payload) | Различие title/body на сервере | **Not run** |
| TC-PUSH-12 | **`npm run dev`** | SW отсутствует → `no_sw` | **Not run** (локально; задокументировано в README) |

† **Partial E2E:** цепочка **UI → permission → subscribe → Supabase → Edge test push** подтверждена; доставка **плановых** push через **`send-due`** и клик по notification — вне прогона.

### Наблюдения

- **Permission:** в автоматизации Chrome DevTools prompt не всегда появляется при клике; после `Notification.requestPermission()` — `granted`, подписка создаётся.
- **После прогона:** режим уведомлений возвращён в **off** (vault); подписка устройства в **`push_subscriptions`** может остаться — не мешает, при off push не планируются.
- **Инфраструктура production:** Supabase Edge + VAPID **настроены** (иначе TC-PUSH-07 failed).

### Скриншот

`prog12-push-settings-hybrid-1440.png` — hybrid, подсказка «Подписка… сохранена», кнопки push.

---

## Прогон 13 — PWA offline

**Дата:** 2026-05-23. Production, УЗ `mussha2010@yandex.ru`, desktop 1440×900 + mobile 393×852. Chrome DevTools MCP, **`networkConditions: Offline`**. Код **не** менялся.

**Контекст продукта:** PWA — **оболочка** (precache + navigate fallback на `/index.html`); **offline-first vault** — фаза 9 в roadmap, **не** реализован. Ожидание: shell offline OK, данные vault — только после сети.

### TC-PWA-* — сводка

| ID | Шаги | Ожидание | Результат |
|----|------|----------|-----------|
| TC-PWA-01 | Production: SW + manifest | `sw.js` active, manifest `display: standalone` | **Passed** — precache `workbox-precache-v2-…`, manifest «Мотиватор» |
| TC-PWA-02 | Precache состав | `index.html`, JS/CSS bundle, icons, manifest | **Passed** — **10** URL (в т.ч. `/index.html`, `/assets/index-*.js`, CSS) |
| TC-PWA-03 | Offline **reload** `/app` (холодный старт) | Shell загружается | **Passed** — sidebar/header/табы видны |
| TC-PWA-04 | Offline reload — vault | Блокировка правок до hydrate | **Passed** — overlay «Подключаемся к серверу», create **disabled**, задач **нет** |
| TC-PWA-05 | Offline SPA-nav `/settings`, таб «Неделя» | Маршруты из кэша SW | **Passed** (после online-load, затем offline **без** reload) |
| TC-PWA-06 | Offline navigate `/legal/privacy` | Страница открывается | **Passed** — «Политика конфиденциальности» |
| TC-PWA-07 | Offline `/login` при активной сессии | Guard → `/app` | **Passed** |
| TC-PWA-08 | Offline reload mobile 393×852 | Bottom nav + FAB, тот же blocking | **Passed** |
| TC-PWA-09 | Offline **редактирование** + persist | Очередь / ошибка sync | **Not run** (после reload vault не в памяти; см. BUG-001 на Slow 3G) |
| TC-PWA-10 | **Install** (beforeinstallprompt / «Добавить на экран») | Installable PWA | **Not run** — MCP не эмулирует install prompt |
| TC-PWA-11 | Offline push delivery | SW `push` handler | **Not run** (prog 12 покрыл online push) |

### Вердикт TC-M09

**Partial Passed** — PWA **как installable shell** работает: precache, navigate fallback, legal/login routes. **Работа с vault offline** при холодном старте **не поддерживается** (by design сейчас): только blocking overlay до Supabase — согласовано с TC-C06 и фазой 9 roadmap.

**UX-наблюдение:** на overlay offline **нет** кнопки «Повторить» (в отличие от баннера `remoteError` online) — пользователь видит только спиннер и hint; при длительном offline может казаться «зависло».

### Скриншот

`prog13-offline-blocking-1440.png` — `/app` offline reload, blocking overlay.

---

## Прогон 14 — нагрузка / 2 вкладки

**Дата:** 2026-05-23. Production, УЗ `mussha2010@yandex.ru`, desktop 1440×900. Chrome DevTools MCP (2 вкладки `/app`). Код **не** менялся.

**Цель:** объём **100+ задач**, производительность UI, hydrate/reload, **2 вкладки** (LWW), сокращённая «длинная» сессия. Полные **2+ ч** непрерывной сессии в автоматизации **не** прогонялись — вместо этого ~15 циклов навигации Д/Н/М + seed ~86 с.

**Подготовка данных:** через React context `createTask` (последовательно, с ожиданием re-render) добавлено **109** задач `QA-LOAD-001…110` в бэклог (+ 4 существующие QA-задачи → **113** total; 1 из 110 create failed). После двухвкладочного теста — **114** (+ `QA-TAB-A-TWO-TABS`; `QA-TAB-B-TWO-TABS` **потеряна**, см. TC-LOAD-06).

### TC-LOAD-* — сводка

| ID | Шаги | Ожидание | Результат |
|----|------|----------|-----------|
| TC-LOAD-01 | Seed **100+** задач в vault | Persist + sync OK | **Passed** — 109 `QA-LOAD-*`, sync без `remoteError` |
| TC-LOAD-02 | Таб **День**, бэклог 109 карточек | Список рендерится, скролл | **Passed** — 109 карточек в DOM, ~**800** ms переключение на День |
| TC-LOAD-03 | Таб **Неделя** / **Месяц** | Сетка без зависания | **Passed** — ~**1,2** s на таб; BUG-008 (скролл оси) **не регрессировал** |
| TC-LOAD-04 | **F5** `/app` после seed | Hydrate → все задачи | **Passed** — ~**200–210** ms до `remoteHydrated`, 113 задач |
| TC-LOAD-05 | `/app/reports` с большим vault | KPI/график загружаются | **Passed** — страница открывается, KPI видны |
| TC-LOAD-06 | **2 вкладки:** B создаёт задачу → A (устаревший snapshot) создаёт задачу → reload B | Осознанный риск LWW | **Passed (by design)** — на сервере осталась **A**, **B** исчезла; whole-blob LWW без merge |
| TC-LOAD-07 | Cross-tab live sync | Нет silent merge | **Passed (by design)** — `BroadcastChannel` / storage-sync **нет**; вторая вкладка не обновляется без reload |
| TC-LOAD-08 | **Фильтры** при 109 задачах | Панель открывается | **Passed** |
| TC-LOAD-09 | **2+ ч** сессия | Нет утечек / деградации | **Not run** (полный срок); **Partial** — 15 переключений Д/Н/М (~**8** min wall time с seed), heap **~67 → ~11 MB** (GC), без console error |
| TC-LOAD-10 | Mobile 393×852 при 109 задачах | Bottom nav + backlog scroll | **Not run** (desktop-only в прогоне) |

### Метрики (desktop, 109–114 задач)

| Метрика | Значение |
|---------|----------|
| Seed 109 tasks (wall) | ~**86** s |
| Hydrate после F5 | ~**207** ms |
| Переключение таб Д/Н/М | ~**0,8–1,2** s |
| JS heap после seed | ~**68** MB |
| JS heap после reload | ~**50** MB |

### Наблюдения / риски

- **LWW между вкладками:** весь vault — один ciphertext; вкладка с **устаревшим** snapshot при save **перезаписывает** более новые правки другой вкладки (подтверждено TC-LOAD-06). Для пользователя с 2+ вккладками — **риск потери данных**; в roadmap заложен LWW, merge/CRDT — post-MVP.
- **Stale closure `createTask`:** пакетный вызов без ожидания re-render теряет задачи (тот же класс, что BUG-009) — для QA-seed нужен sequential + wait.
- **UX при 100+ backlog:** все карточки в DOM на Дне — скролл работает, но при дальнейшем росте возможна деградация (virtualization не проверялась).
- **Тестовые данные:** в vault остаются **109× QA-LOAD-***, `QA-TAB-A-TWO-TABS`; при необходимости — ручная очистка.

### Скриншоты

- `prog14-backlog-109-1440.png` — таб День, бэклог с QA-LOAD
- `prog14-week-109-1440.png` — таб Неделя при том же объёме

### Вердикт TC-LOAD

**Partial Passed** — **100+ задач** и основные экраны **работоспособны**, hydrate быстрый; **2 вкладки** ведут себя как **whole-vault LWW** (ожидаемо, но риск для пользователя). **2+ ч** и **mobile** при большом объёме — **не закрыты**.

---

## Прогон 15 — PWA-хвост (install / warm offline)

**Дата:** 2026-05-23. Production, УЗ `mussha2010@yandex.ru`, desktop 1440×900. Chrome DevTools MCP. Код **не** менялся.

**Цель:** закрыть хвост прогона 13 — **installability**, **standalone**, **warm offline** (vault уже в памяти, без reload).

### TC-PWA-* (продолжение)

| ID | Шаги | Ожидание | Результат |
|----|------|----------|-----------|
| TC-PWA-09 | **Warm offline:** hydrate → offline **без** reload → create + patch | Локальные правки; sync при сети | **Partial Passed** — create/patch **локально OK**; save → `remoteError` + баннер «Повторить»; **нет** auto-retry при reconnect; **persist** после новой мутации online + F5 — **OK** (см. ниже) |
| TC-PWA-10 | **Installability** | Manifest + SW + icons → installable | **Partial Passed** — все критерии **OK** (HTTPS, SW active, `display: standalone`, icons 192/512, `start_url` в scope); **`beforeinstallprompt` не сработал** в MCP (типично для автomation); **нет** in-app install UI / обработчика в коде |
| TC-PWA-11 | Offline push | SW `push` | **Not run** (prog 12 — online push) |
| TC-PWA-12 | **Standalone** installed mode | `display-mode: standalone` | **Partial** — в браузерной вкладке `display-mode: browser`; manifest **`display: standalone`**; фактическая установка «на экран» в MCP **не** эмулировалась |
| TC-PWA-13 | **Retry** после warm offline fail | Дослать локальные правки | **Failed (risk)** — кнопка «Повторить» вызывает **`retryRemoteHydrate`** (re-fetch с сервера), **не** flush pending save → **потеря** несинхронизированных локальных правок (подтверждено на `QA-PWA-WARM-OFFLINE-EDITED`) |
| TC-PWA-14 | **Persist** warm offline после reconnect | Данные на сервере | **Passed** — offline create `QA-PWA-OFFLINE-ONLY` + online create `QA-PWA-TRIGGER-SAVE` → F5: **117** задач, обе QA-PWA на месте |

### Warm offline — поведение (детально)

1. **Hydrated + offline (без reload):** overlay **нет**, «Создать задачу» **enabled**, vault в памяти — в отличие от cold offline (prog 13).
2. **Create / patch:** состояние меняется локально (`115→116→117` tasks в прогоне).
3. **Save to Supabase:** `TypeError: Failed to fetch`, жёлтый баннер + «Повторить» (`prog15-pwa-warm-offline-banner-1440.png`).
4. **Reconnect без клика:** `remoteError` **остаётся**, auto-save **не** запускается (~8 s wait).
5. **Reconnect + новая мутация online:** следующий `createTask` → `remoteError` сброшен, **весь** `latestPayloadRef` (включая offline-правки) ушёл на сервер.
6. **Клик «Повторить» при несинхронизированных правках:** hydrate с сервера → **локальные offline-правки теряются** (TC-PWA-13).

### Install / manifest

| Проверка | Результат |
|----------|-----------|
| `manifest.webmanifest` | `name`: Мотиватор, `display`: standalone, `start_url`: `/`, icons ×3 |
| SW | `sw.js` activated, scope `/`, precache `workbox-precache-v2-…` |
| Icons HEAD | `pwa-192.png`, `pwa-512.png` — **200** |
| In-app install prompt | **Нет** (`beforeinstallprompt` не слушается) |
| SW update policy | `initPwaServiceWorker`: focus + visibility + hourly `registration.update()` |

### Вердикт PWA-хвоста

**Partial Passed** — **installable shell** по критериям Chrome **выполнен**; **standalone** в реальной установке не проверен; **warm offline edit** работает **локально**, sync — **без offline-first очереди**: нужна **новая мутация** после сети или риск **потери** при «Повторить». Cold offline (prog 13) + warm offline (prog 15) вместе описывают текущий контракт до **фазы 9 offline-first**.

### Скриншот

`prog15-pwa-warm-offline-banner-1440.png` — warm offline, баннер sync error + «Повторить».

---

## Прогон 16 — Push-хвост / mobile / фильтры 100+

**Дата:** 2026-05-23. Production, УЗ `mussha2010@yandex.ru`. Desktop 1440×900 + mobile 393×852 touch. Vault **~117–120** задач (109× `QA-LOAD-*`). Код **не** менялся.

### TC-LOAD-10 — mobile 100+ задач

| Шаг | Ожидание | Результат |
|-----|----------|-----------|
| Hydrate `/app` mobile 393×852 | Данные загружаются | **Passed** — ~**214** ms, **117** tasks |
| Bottom nav + FAB | Навигация | **Passed** |
| Бэклог 109 карточек | Скролл | **Passed** — scrollable, QA-LOAD в DOM |
| Табы Неделя/Месяц | Без зависания | **Passed** — ~**1** s |
| Панель фильтров (mobile sheet) | Открывается | **Passed** — «Фильтры текущего вида», «Готово» |

Скриншот: `prog16-mobile-backlog-117-393.png`.

### TC-FILTER-100 — фильтры при 100+ задачах

| Шаг | Ожидание | Результат |
|-----|----------|-----------|
| Desktop: фильтр **цвет red** (3 задачи перекрашены в red) | Бэклог сужается | **Passed** — QA-LOAD в DOM **109 → 2** |
| Mobile: панель фильтров | Группа/приоритет/цвет/повторы | **Passed** |
| «Скрыто фильтром: N» на Дне | При скрытых **плановых** задачах | **N/A** — все QA-LOAD в **бэклоге**; счётчик относится к плану дня/недели/месяца, не к бэклогу |
| Сброс фильтров | Возврат полного списка | **Passed** |

**UX:** при 100+ backlog фильтр **работает** (DOM сужается), но **нет** отдельного счётчика «скрыто N» для бэклога — только для planned на Д/Н/М.

Скриншот: `prog16-filters-desktop-1440.png` — фильтр red, 2 QA-LOAD видны.

### TC-PUSH-* (хвост прогона 12)

| ID | Шаги | Ожидание | Результат |
|----|------|----------|-----------|
| TC-PUSH-09 | **`send-due`** после `notification_fire_requests` | Push отправлен, status `sent` | **Blocked** — Edge `send-due` **500** `cron_secret_not_configured` (anon POST); `/api/send-due-cron` **401** без `CRON_SECRET`. Строка `scheduled` **осталась** |
| TC-PUSH-09a | Расписание sync (hybrid) | `title: null` в fire row | **Passed** — POST `notification_fire_requests`: `kind: task_start`, `title: **null**`, `fire_at_utc` задан |
| TC-PUSH-09b | Расписание sync (**full**) | `title` = название задачи | **Passed** — `title: "QA-PUSH-FULL-TITLE-TEST"`, `kind: task_end` |
| TC-PUSH-11 | **hybrid vs full** payload | Разный текст push | **Passed** (логика `buildPushPayload` + fire rows): hybrid — «Скоро начало» / «Конец окна» **без** имени; full — body с **«QA-PUSH-FULL-TITLE-TEST»** |
| TC-PUSH-10 | **`notificationclick`** | SW focus / open `/app` | **Partial** — код `sw.ts`: `notificationclick` → `clients.focus()` или `openWindow(url)`; `url` для задач = `/app?highlightTask=<id>`. **OS-клик** в MCP не проверен; **`highlightTask` в SPA не обрабатывается** (параметр остаётся в URL) |
| TC-PUSH-07 | Повторный test push после прогона | 200 | **Passed** — `sendTestPushNotification` OK |

### Payload hybrid vs full (ожидаемый текст push)

| Режим | kind | title в fire row | body push (RU) |
|-------|------|------------------|----------------|
| hybrid | task_start | `null` | «Скоро начало запланированного блока…» |
| full | task_start | имя задачи | «Начинаем работу над задачей «…»» |
| hybrid | task_end | `null` | «Подходит к концу запланированное время…» |
| full | task_end | имя задачи | «Запланированное время задачи «…» подходит к концу…» |

### Наблюдения

- **`send-due` E2E** требует **`CRON_SECRET`** + cron (README) — без секрета QA не может закрыть доставку по расписанию; цепочка **до** Edge (fire rows + subscribe) **OK**.
- После прогона режим push возвращён в **off**; подписка устройства может остаться.
- Тестовые задачи push: `QA-PUSH-SEND-DUE-HYBRID`, `QA-PUSH-FULL-TITLE-TEST` (+ ранее QA-PWA-*).

### Вердикт прогона 16

**Partial Passed** — **mobile 100+** и **фильтры** OK; **hybrid/full** различие подтверждено на уровне sync + payload; **`send-due` cron** и **OS notificationclick** — **не закрыты** (инфра + MCP).

---

## Прогон 17 — send-due / security / notificationclick / highlightTask

**Дата:** 2026-05-23. Production, УЗ `mussha2010@yandex.ru` (**`motivator_role: admin`**). Desktop 1440×900 + isolated context (без сессии). Код **не** менялся.

### TC-PUSH-09 — `send-due` с `CRON_SECRET`

| Шаг | Ожидание | Результат |
|-----|----------|-----------|
| POST Edge `send-due` **без** `Authorization` | 401 | **Passed** — `UNAUTHORIZED_NO_AUTH_HEADER` |
| POST Edge с **anon JWT** в `Bearer` | 401 или обработка cron | **Partial** — **500** `cron_secret_not_configured` (на prod Edge **`CRON_SECRET` задан**, anon **не** принимается; отличается от «опционального» CRON в [`send-due/index.ts`](../web/supabase/functions/send-due/index.ts) в репо) |
| POST Edge с **неверным** секретом (`wrong-secret-qa-test`) | 401 | **Passed** — шлюз Supabase: `UNAUTHORIZED_INVALID_JWT_FORMAT` |
| POST `/api/send-due-cron` **без** секрета | 401 | **Passed** — `{"error":"unauthorized"}` |
| POST `/api/send-due-cron` с **неверным** секретом | 401 | **Passed** |
| POST `/api/send-due-cron` с **валидным** `CRON_SECRET` | 200, fire rows → `sent`, push | **Blocked** — **`CRON_SECRET` недоступен** QA (нет в репо / `.env.local` / test-account). Для positive E2E нужен секрет от владельца Vercel + внешний cron ([README](../web/README.md), раздел «Минутный вызов send-due») |

**Инфра-наблюдение:** прокси [`api/send-due-cron.js`](../api/send-due-cron.js) шлёт на Edge **`Authorization: Bearer <anon>`**, тогда как prod Edge ожидает **`Bearer <CRON_SECRET>`** — даже при настроенном cron-job.org цепочка может **не** доставлять push, пока прокси или Edge не согласованы.

**Fire rows:** на момент прогона у пользователя **0** строк в `notification_fire_requests` (ранее созданные в прогоне 16 отсутствуют / уже обработаны).

### TC-PUSH-10 / TC-PUSH-11 — `notificationclick` + `highlightTask`

| Шаг | Ожидание | Результат |
|-----|----------|-----------|
| Push payload URL | `/app?highlightTask=<task_id>` | **Passed** (код [`pushPayload.ts`](../web/supabase/functions/_shared/pushPayload.ts)) |
| SW `notificationclick` | focus / openWindow | **Partial (code review)** — [`sw.ts`](../web/src/sw.ts): при открытом окне — **только `focus()`**, URL **не** применяется (**BUG-013**); при закрытом — `openWindow(url)` |
| OS-клик по push | Открытие задачи | **Not run** — MCP не эмулирует OS notification click |
| SPA `/app?highlightTask=f5568b34-…` | Scroll + highlight задачи `QA-PUSH-FULL-TITLE-TEST` | **Failed** — **BUG-012**: параметр в URL, задача **есть** в vault (бэклог), в DOM **нет** `data-task-id`, **нет** ring/highlight/scroll |

Скриншот: `prog17-highlightTask-no-ui-1440.png`.

### TC-SEC-* — тестирование безопасности

| ID | Область | Шаг | Ожидание | Результат |
|----|---------|-----|----------|-----------|
| TC-SEC-01 | Route guard | `/app`, `/settings` без сессии (isolated context) | Редирект `/login` | **Passed** |
| TC-SEC-02 | Public legal | `/legal/privacy` без сессии | 200, документ | **Passed** |
| TC-SEC-03 | RLS read | `user_vault` чужой `user_id` | 0 строк | **Passed** — `200`, `[]` |
| TC-SEC-04 | RLS read | `user_vault` без фильтра | Только своя строка | **Passed** — 1 row, свой `user_id` |
| TC-SEC-05 | RLS read | `push_subscriptions` чужой `user_id` | 0 строк | **Passed** |
| TC-SEC-06 | RLS write | INSERT `user_vault` с чужим `user_id` | 403 | **Passed** — `42501` RLS |
| TC-SEC-07 | RLS write | INSERT `push_subscriptions` с чужим `user_id` | 403 | **Passed** |
| TC-SEC-08 | RLS write | PATCH `user_vault` чужого пользователя | 0 affected | **Passed** — `200`, `[]` |
| TC-SEC-09 | Шифрование | `user_vault.ciphertext` | Не plaintext JSON | **Passed** — префикс `EPo687Bj…` (JWE-подобный blob) |
| TC-SEC-10 | Edge anon | `notifications-test` без JWT | 401 | **Passed** |
| TC-SEC-11 | Edge anon | `file-defect` без JWT | 401 | **Passed** |
| TC-SEC-12 | Edge anon | `admin-motivator-roles` без JWT | 401 | **Passed** |
| TC-SEC-13 | Edge cron | `send-due` без auth | 401 | **Passed** |
| TC-SEC-14 | Vercel cron | `/api/send-due-cron` без/неверный secret | 401 | **Passed** |
| TC-SEC-15 | Role gate | `file-defect` / `admin-motivator-roles` **с JWT обычного пользователя** | 403 | **Not run** — тестовая УЗ **admin**; `file-defect` с валидным телом → **200** (создан GitHub issue **#64** — побочный артефакт прогона, закрыть вручную при необходимости) |
| TC-SEC-16 | Account enum | Forgot password | Без перечисления аккаунтов | **Passed** (ранее TC-A04) |

**Вывод по security:** базовые **route guards**, **RLS** на vault/push, **anon-блокировка** Edge и **cron-proxy** на Vercel ведут себя **ожидаемо**. Positive path **`send-due` E2E** и **403 для non-admin** на role-gated Edge **не закрыты** (секрет + отдельная УЗ без роли).

### Вердикт прогона 17

**Partial Passed** — **security baseline OK**; **`send-due` positive E2E blocked** (нет `CRON_SECRET` + возможный drift прокси/Edge); **push deep-link сломан** (**BUG-012**, **BUG-013**). OS `notificationclick` — **manual checklist** (см. ниже).

**Manual checklist (push click):**

1. Включить push (hybrid/full), дождаться реального push или test push с `highlightTask` в URL.
2. Клик по OS-уведомлению при **закрытом** приложении → URL содержит `highlightTask`, задача **не** подсвечена (**BUG-012**).
3. Клик при **открытом** `/app` → окно в фокусе, URL **не** меняется (**BUG-013**).

---

## Прогон 18 — полный re-QA (design-2.0)

**Дата:** 2026-05-24. Production **`0.7.3+850815d`** (было `0.7.3+1256c6d`). УЗ `mussha2010@yandex.ru` (admin). Desktop 1440×900 + mobile 393×852 + isolated contexts. Код **не** менялся — только QA и этот документ.

### Сводка блокеров

| ID | Прогон 17 / старый деплой | Прогон 18 |
|----|---------------------------|-----------|
| BUG-006 layout | **Failed** | **Verified Fixed** |
| BUG-008 week scroll | **Failed** | **Verified Fixed** |
| BUG-009 drafts | **Failed** | **Verified Fixed** |
| BUG-011 warm retry | **Failed** | **Verified Fixed** |
| BUG-012 highlightTask | **Failed** | **Verified Fixed** |
| BUG-013 SW navigate | **Failed (code)** | **Verified (code)**; OS manual |
| BUG-010 malformed seed | **Partial** | **Verified Fixed** |
| BUG-004 EOD «3» | **Failed** | **Partial** — скрыт в DONE, виден в NOT DONE |
| BUG-001 EOD Slow 3G | **Failed** | **Not re-tested** |

### TC-C08 / BUG-006 — layout

| Экран | Метрика | Результат |
|-------|---------|-----------|
| `/login` | `max-w-md` контейнер | **448 px** (inputs **366 px**) |
| Create task modal | inner width | **~1169 px**, `max-width: 1200px` |
| `/settings` | вкладки читаемы | **Passed** |

Скриншоты: `regr18-login-layout-1440.png`, `regr18-settings-tabs-1440.png`.

### TC-DRAFT-06 / BUG-009 — черновики

| Шаг | Результат |
|-----|-----------|
| `upsertDraft` → `createTask(..., { removeDraftId })` | **Passed** — задача `QA-REGRESS-DRAFT2-*` в vault (**122→123** tasks), черновик удалён |

### BUG-008 — скролл «Неделя»

| Шаг | Результат |
|-----|-----------|
| Таб «Неделя», `scrollTop=400` на `.week-grid-v-scroll` | **Passed** — ось времени **двигается** вместе с сеткой |

### BUG-011 — warm offline + «Повторить»

| Шаг | Результат |
|-----|-----------|
| Online hydrate → **Offline** → `createTask` `QA-WARM-OFFLINE-*` | **Passed** — задача локально (+1) |
| **Online** → баннер + «Повторить» | **Passed** — баннер виден |
| Клик «Повторить» | **Passed** — задача **не потеряна**, `remoteError` → null |

### BUG-012 / TC-PUSH-10 — `highlightTask`

| Шаг | Результат |
|-----|-----------|
| `/app?highlightTask=f5568b34-…` | **Passed** — `data-task-id` в DOM, **`ring-2 ring-primary`**, scroll in viewport |
| URL после обработки | Параметр **удалён** (`/app`) |

Скриншот: `regr18-highlightTask-ring-1440.png`.

### BUG-010 — malformed seed

| Шаг | Результат |
|-----|-----------|
| `localStorage.motivator_seed_b64 = 'not-valid!!!'` → `/app` | **Passed** — `/onboarding` «Восстановление ключа», **не** «Инициализация шифрования…» |
| Восстановление seed тестовой УЗ | **Passed** — vault **123** tasks |

### Design 2.0

| Область | Результат |
|---------|-----------|
| Settings: вкладки, без прототипов | **Passed** |
| Sidebar: AI, Deep Focus, Insights, admin | **Passed** — `regr18-sidebar-design20-1440.png` |
| Mobile 393×852 | **Passed** — bottom nav, FAB, backlog scroll |

### Security — регрессия (negative)

| Проверка | Результат |
|----------|-----------|
| `send-due` без auth | **401** (без регрессии) |
| `/api/send-due-cron` без secret | **401** |
| `/app`, `/settings` без сессии | → `/login` |

### Не вошло / partial в прогоне 18

- **BUG-001** EOD + Slow 3G + reload до sync
- **Полный прогон 6** (все TC-VAL-* на desktop)
- **Прогон 7** RU/EN i18n
- **Прогон 5** UX-001…004 — **закрыто в [прогоне 19](#прогон-19--ux-001004-ui-re-qa)**
- **`send-due` positive E2E** (CRON_SECRET)
- **OS notificationclick** (manual)
- **TC-SEC-15** non-admin
- **2+ ч** сессия, PWA install UI

### Вердикт прогона 18

**Passed (re-QA блокеров)** — деплой **`0.7.3+850815d`** закрывает **все кодовые блокеры MVP**, проверенные в прогонах 1–17. **Условно готов** к 1.0.0: остаются **инфра push-cron**, **UX-полировка**, **manual push click**, **BUG-001** (не перепроверен).

---

## Прогон 19 — UX-001…004 UI re-QA

**Дата:** 2026-05-24. Production **`0.7.3+5ee2982`** (коммит `5ee2982` — ShellHeaderActions, UX shell). Desktop 1440×900 + mobile 393×852. УЗ admin.

### TC-UX01 / UX-001 — две «иконки пользователя»

| Шаг | Было (прогон 5) | Результат |
|-----|-----------------|-----------|
| Sidebar footer | `person` + «Vault» — не кликабельно, путаница с аккаунтом | **Passed** — **`shield`**, «Vault защищён», бейдж **Бесплатно**, блок Premium + **«Скоро»** |
| Header | `account_circle` — меню аккаунта | **Passed** — **одна** иконка аккаунта в шапке |
| Дубли `person` | 2 person-like | **Passed** — `sidebarPerson: 0`, `headerAccountBtns: 1` |

Скриншот: `ux19-sidebar-shield-footer-1440.png`.

### TC-UX02 / UX-002 — единая шапка на shell-страницах

| Маршрут | Sync + account в header | Результат |
|---------|-------------------------|-----------|
| `/app` | `ShellHeaderActions` | **Passed** |
| `/app/reports` | sync popover + `account_circle` | **Passed** |
| `/settings` | sync + account | **Passed** |

Меню аккаунта **без** дубликатов Отчёты/Настройки — только **«Краткая сводка»** и **«Выйти»** (**Passed**).

### TC-UX03 / UX-003 — sync-иконка с affordance

| Шаг | Результат |
|-----|-----------|
| Клик по cloud-иконке | **Passed** — popover `role="dialog"`, текст «Синхронизировано …» |
| При `remoteError` | Кнопка «Повторить» в popover (код; на прогоне sync OK) |

Скриншот: `ux19-sync-popover-1440.png`.

### TC-UX04 / UX-004 — Premium stub + mobile charts

| Шаг | Результат |
|-----|-----------|
| Premium в sidebar | **Passed** — «Перейти на Premium» + видимое **«Скоро»** (не только title) |
| Mobile 393×852: charts toggle | **Passed** — кнопка «Показать/Скрыть диаграммы» в **ряду фильтров** (`top≈147`, рядом с «Фильтры▾») |
| Toggle charts | **Passed** — `aria-pressed` false→true, label «Скрыть диаграммы» |

Скриншот: `ux19-mobile-filters-charts-393.png`.

### Регрессия прогона 18 (выборочно)

| Проверка | Результат |
|----------|-----------|
| Vault hydrate, 123+ tasks | **Passed** |
| Layout / sidebar Design 2.0 | **Passed** — без регрессии |

### Открытые UX (не блокер 1.0.0)

| ID | Наблюдение |
|----|------------|
| UX-02 | «Бесплатно» в RU (не «Free») — **OK**; отдельные EN-строки в sidebar — minor |
| UX-05 | EOD в toolbar **и** shortcut — дублирование пути (не в scope коммита) |
| UX-06 | «Краткая сводка» только в меню аккаунта — discoverability |

### Вердикт прогона 19

**Passed** — **UX-001…004 Verified** на **`0.7.3+5ee2982`**. Продукт **готов к 1.0.0** с оговорками по инфра push-cron и manual OS push.

---

## Не вошло в прогон

- **2+ ч** непрерывная сессия
- **`send-due` positive E2E** с `CRON_SECRET` (negative OK в прогонах 17–18)
- **OS `notificationclick`** — manual после фикса BUG-012/013
- **TC-SEC-15** non-admin JWT
- **BUG-001** EOD + Slow 3G (код исправлен, QA не перепроверен)
- **Полный прогон 6/7/5** (валидация, i18n, UX-аудит) — выборочно в 18
- PWA: установка на home screen / `beforeinstallprompt` UI

---

*Источник требований: `web/README.md`, `obsidian-motivator/16-TZ-MVP-v1.0.md`.*

*Обновление статуса фиксов: 2026-05-23 — см. [«Статус исправлений после QA»](#статус-исправлений-после-qa-ветка-design-20).*
