# ministry-app

Монорепо: Next.js фронтенд (`web/`) + Supabase бэкенд (`backend/`).
Архитектура фронтенда — Feature-Sliced Design (подробности и договорённости
в [`CLAUDE.md`](./CLAUDE.md)).

## Требования

- Node.js ≥ 24 (LTS — см. `docs/decisions/0010-*.md`)
- [pnpm](https://pnpm.io/) 12.x (`corepack enable` подхватит точную версию
  из `package.json#packageManager` — см. `docs/decisions/0008-*.md`)
- Docker Desktop (или совместимый Docker-движок) — нужен Supabase CLI для
  локального стека (Postgres, Auth, Storage, Edge Functions, Studio);
  контейнерного запуска самого `web` в проекте нет — только `pnpm dev`
  (см. `docs/decisions/0009-*.md`)

## Первый запуск

1. Установить зависимости:

   ```bash
   pnpm install
   ```

2. Скопировать шаблоны переменных окружения и подставить реальные значения:

   ```bash
   cp envs/web.local.env.example envs/web.local.env
   cp envs/backend.local.env.example envs/backend.local.env
   ```

   После первого `pnpm db:start` выполните `pnpm --filter backend exec supabase status`
   (или посмотрите вывод самого `db:start`) и подставьте в
   `envs/web.local.env` актуальный `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   (поле `PUBLISHABLE_KEY` в выводе, **не** `ANON_KEY`) — при
   `supabase init`/`start` "с нуля" он детерминирован (демо-проект), но
   при регенерации JWT-секрета в `backend/supabase/config.toml` изменится.

3. Поднять всё и открыть Next.js:

   ```bash
   pnpm dev
   ```

   Скрипт сам поднимет Supabase, дождётся его готовности и запустит
   `next dev` (Turbopack). По умолчанию: `http://localhost:3000`
   (редиректит на `/day`) — экран `/day` показывает простой статус
   соединения с Supabase.

   Supabase Studio: `http://127.0.0.1:54323`.

## Команды

| Команда | Назначение |
|---|---|
| `pnpm dev` | Supabase → wait-on → `next dev` (Turbopack) |
| `pnpm db:start` | Поднять локальный Supabase |
| `pnpm db:stop` | Остановить локальный Supabase |
| `pnpm db:reset` | Пересоздать локальную БД (миграции + `seed.sql`) |
| `pnpm db:types` | Сгенерировать TS-типы БД в `web/src/shared/api/supabase/database.types.ts` |
| `pnpm lint` | ESLint + `steiger` (границы FSD) для `web/` |
| `pnpm typecheck` | `tsc --noEmit` для `web/` |
| `pnpm build` | Прод-сборка `web/` (Turbopack) |

Деплой в облачный Supabase (`db:login`/`db:link`/`db:push`/`functions:deploy`)
— отдельный раздел в [`CLAUDE.md`](./CLAUDE.md#деплой-миграций-в-облачный-supabase),
**обязательно прочитать предупреждения там перед использованием**.

## Структура

Подробная схема каталогов и правила FSD — в [`CLAUDE.md`](./CLAUDE.md).
Архитектурные решения и их обоснование — в [`docs/decisions/`](./docs/decisions).

## Известные ограничения на этом этапе

- Экраны (`web/src/pages/*`) — минимальные заглушки без бизнес-логики.
- В БД нет ни одной таблицы/миграции и, соответственно, RLS-политик — это
  следующий шаг.
- CI (`.github/workflows/`) — пока не настроен (только `.gitkeep`); деплой
  миграций/функций в облако пока выполняется вручную (см. предупреждение в
  `CLAUDE.md`).
