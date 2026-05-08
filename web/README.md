# Мотиватор — фронтенд (V1)

Минимальная сборка для деплоя на **Vercel**: React (Vite), Tailwind, Supabase Auth, клиентское шифрование vault (AES-GCM + PBKDF2 по seed из журнала решений).

Подробная спецификация V1: папка [`obsidian-motivator/14-V1-минимальный-запуск-Vercel.md`](../obsidian-motivator/14-V1-минимальный-запуск-Vercel.md).

## Локально

```bash
cp .env.example .env.local
# заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Supabase

1. Создайте проект в [Supabase](https://supabase.com/).
2. В SQL Editor выполните миграцию [`supabase/migrations/001_user_vault.sql`](./supabase/migrations/001_user_vault.sql).
3. Authentication → включите Email / пароль (если ещё не включено для вашего проекта).

## Vercel

1. Импортируйте репозиторий, **Root Directory** → `web`.
2. Environment Variables: те же `VITE_SUPABASE_*`, что в `.env.local`.
3. Build: `npm run build`, Output: `dist` (по умолчанию для Vite).

Файл [`vercel.json`](./vercel.json) отправляет все пути на `index.html` для SPA.

## Сборка

```bash
npm run build
npm run preview   # проверка prod-бандла
```
