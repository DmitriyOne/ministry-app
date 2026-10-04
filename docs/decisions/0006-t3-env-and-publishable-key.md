# ADR 0006: `@t3-oss/env-nextjs` вместо самописного `env.ts`, publishable-ключ вместо anon-ключа

## Контекст

Изначальный `web/src/shared/config/env.ts` был самописной обёрткой над
`process.env` с ручной zod-валидацией и веткой `typeof window !== "undefined"`
для разделения публичных/серверных переменных. Рабочий, но:
- Ручная реализация client/server-разделения — источник ошибок (легко
  случайно "утечь" серверную переменную в клиентский бандл, забыв
  проверку).
- Supabase депрекейтит легаси-ключи `anon`/`service_role` в пользу
  `sb_publishable_...`/`sb_secret_...` (см. changelog Supabase, до конца
  2026 — `anon`/`service_role` перестанут работать).

## Варианты

1. **Оставить самописный `env.ts`** — работает, но дублирует то, что уже
   решено индустриальным стандартом (`@t3-oss/env-nextjs`, тот самый пакет
   из T3 Stack), без его гарантий на уровне типов (Proxy, бросающий
   исключение при обращении к серверной переменной из клиентского кода —
   а не просто `undefined` по ошибке).
2. **`@t3-oss/env-nextjs`** — `createEnv` с раздельными `client`/`server`
   схемами, автоматическая проверка обращения к серверным переменным с
   клиента, `emptyStringAsUndefined` для корректной обработки пустых
   `.env`-значений, встроенная поддержка Next.js edge/client-бандлов через
   `experimental__runtimeEnv`.

## Решение

Выбран `@t3-oss/env-nextjs` (0.13.11, zod 4). `web/src/shared/config/env.ts`
переписан на `createEnv`:
- `client`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `server`: `SUPABASE_INTERNAL_URL` (опциональный — см.
  `docs/decisions/0007-*.md`).
- `experimental__runtimeEnv` — только клиентские переменные явно
  перечислены (серверные попадают напрямую из `process.env`, это
  Next.js ≥ 13.4.4 поведение).
- `emptyStringAsUndefined: true`.
- `next.config.ts` импортирует `./src/shared/config/env` (относительный
  путь — алиас `@/*` не резолвится вне графа модулей
  webpack/turbopack), чтобы невалидные переменные валили сборку, а не
  всплывали только в рантайме.

Отдельное решение — переход на новые ключи Supabase API:
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) вместо
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` **удалён из `web` полностью** — из схемы
  `env.ts`, из `envs/web.local.env(.example)`. У фронтенда нет
  легитимного случая использовать секретный ключ (он обходит RLS); если
  такая необходимость появится — заводить отдельный ADR и явно
  изолированный server-only путь, а не тянуть его "про запас".

## Последствия

- `web/src/shared/api/supabase/{client,server}.ts` используют
  `env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` вместо anon-ключа; и
  `client.ts`, и `server.ts` — без секретного ключа (оба варианта клиента
  работают в рамках RLS, как и раньше с anon-ключом).
- Локальный Supabase (`supabase start`) выводит оба ключа одновременно
  (`ANON_KEY` и `PUBLISHABLE_KEY`) — CLI переходного периода поддерживает
  оба формата на Kong/GoTrue, при генерации `envs/web.local.env` нужно
  брать именно `PUBLISHABLE_KEY` из вывода `supabase status`.
- Если Supabase окончательно уберёт легаси-ключи — `web` уже готов, менять
  ничего не придётся.
- При добавлении новой переменной окружения — добавлять в `env.ts`
  (`client` или `server`), а не читать `process.env` напрямую.

## Обновление (ADR 0037): запрет сужен до своего настоящего смысла

Фраза «у фронтенда нет легитимного случая использовать секретный ключ» и
запрет на него в `web` целиком были написаны, когда у `web` не было ни
одного серверного пути записи. Настоящий смысл запрета — секретный ключ
**не должен попадать в браузер или в любой клиентский бандл**
(публичные клиенты, `NEXT_PUBLIC_*`, Client Components). Серверный модуль
(`server-only`) — доверенное окружение, и ему ключ использовать можно.
Такой модуль ровно один: `web/src/shared/api/supabase/admin.ts`
(`createAdminSupabaseClient`, `SUPABASE_SECRET_KEY` в серверном блоке
`env.ts`). Новые места использования ключа — только с отдельным ADR.
Подробности — `docs/decisions/0037-secret-key-on-the-trusted-server.md`.

