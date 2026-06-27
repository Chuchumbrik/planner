# Amvera — секреты и переменные (шаблон)

> **Не хранить значения в git.** Только имена, назначение и где задавать.
> Подробности — `.cursor/skills/amvera-secrets-and-env/SKILL.md`, план — `obsidian-motivator/22-План-миграции-Amvera.md`.

## Где задавать

| Контекст | Где | Когда доступны |
|----------|-----|----------------|
| **VITE_*** (публичные) | Amvera → override `build.additionalCommands` | Только **фаза сборки** web |
| **Runtime API** | Amvera LK → env проекта `planner-api` | Запуск Node Server |
| **Runtime web** | Обычно не нужны (SPA) | — |
| **Cron** | `planner-jobs` + заголовок `CRON_SECRET` | Вызов `/internal/*` |
| **Локально** | `.env.local` (gitignore) | dev |

Шаблон сборки: `amvera.build.commands.example.txt`, проверка — `scripts/build-amvera.mjs`.

## Таблица секретов (заполнить значения в LK / password manager)

| Имя | Проект | Назначение | Prod отдельно? |
|-----|--------|------------|----------------|
| `DATABASE_URL` | planner-api | Postgres Amvera (internal host) | да |
| `JWT_SECRET` | planner-api | Подпись access/refresh | да |
| `SMTP_*` / `SMTP_URL` | planner-api | Письма auth (reset, confirm) | да |
| `VAPID_PUBLIC_KEY` | build + API | Web Push (public в VITE_*) | да |
| `VAPID_PRIVATE_KEY` | planner-api | Web Push sign | да |
| `VAPID_SUBJECT` | planner-api | mailto:… для VAPID | да |
| `GROQ_API_KEY` | planner-api | AI chat/transcribe | да |
| `GITHUB_TOKEN` | planner-api | file-defect issues | да |
| `GITHUB_DEFECT_REPO` | planner-api | owner/repo | нет |
| `CRON_SECRET` | planner-api + planner-jobs | Защита `/internal/cron/*` | да |
| `INTERNAL_CRON_SECRET` | *(alias)* | То же, если используется в коде | — |
| `VITE_SUPABASE_URL` | planner-web build | Legacy hybrid (до cutover) | stage |
| `VITE_SUPABASE_ANON_KEY` | planner-web build | Legacy hybrid | stage |
| `VITE_API_URL` | planner-web build | База API после миграции клиента | stage/prod |
| `VITE_VAPID_PUBLIC_KEY` | planner-web build | Подписка push в браузере | да |

## Чеклист stage

- [ ] Все секреты API заведены в LK `planner-api` (без значений в репо).
- [ ] `VITE_*` прописаны в override `build.additionalCommands` для `planner-web`.
- [ ] Cron job шлёт `Authorization: Bearer <CRON_SECRET>` на internal URL.
- [ ] SMTP: тестовое письмо доходит.
- [ ] Экспорт пользователей Supabase Auth — **вне git** (план миграции §0.4.3).

## Гейт

Случайный секрет в diff ловит `scripts/check-gates/no-secrets-in-diff.mjs` (warn; block — `GATE_BLOCK=1`).
