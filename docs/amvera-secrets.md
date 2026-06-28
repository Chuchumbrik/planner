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
| `CORS_ORIGINS` | planner-api | CSV origins web (HTTPS Amvera + localhost) | stage |
| `INTERNAL_CRON_SECRET` | *(alias)* | То же, что `CRON_SECRET`, если используется в коде | — |
| `VITE_API_URL` | planner-web build | База **planner-api** (HTTPS); **обязателен** для Amvera stage | stage/prod |
| `VITE_SUPABASE_URL` | planner-web build (legacy Vercel) | Supabase hybrid | только Vercel до cutover |
| `VITE_SUPABASE_ANON_KEY` | planner-web build (legacy) | Supabase hybrid | только Vercel |
| `VITE_VAPID_PUBLIC_KEY` | planner-web build | Подписка push в браузере | да |

## Чеклист stage (API-only)

- [ ] `planner-api`: yaml из `deploy/planner-api.amvera.yaml`; env `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`.
- [ ] `planner-db`: `npm run migrate -w @motivator/planner-api` (001_auth).
- [ ] `planner-api`: внешний HTTPS; тот же URL в `VITE_API_URL` при сборке web.
- [ ] `planner-web`: `build.additionalCommands` с `VITE_API_URL` (без Supabase).
- [ ] Smoke: `/health`, регистрация/вход на web.

## Гейт

Случайный секрет в diff ловит `scripts/check-gates/no-secrets-in-diff.mjs` (warn; block — `GATE_BLOCK=1`).
