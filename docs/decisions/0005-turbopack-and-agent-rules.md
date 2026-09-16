# ADR 0005: Turbopack как сборщик (+ `@serwist/turbopack`), `agentRules` оставлен включённым

## Контекст

Next.js 16 использует Turbopack по умолчанию для `next dev`/`next build`.
На первом проходе `@serwist/next` (Serwist-плагин для webpack) не работал
под Turbopack — при сборке появлялось предупреждение "You are using
'@serwist/next' with `next dev --turbopack`, but it doesn't support
Turbopack", а сама сборка падала с `This build is using Turbopack, with a
webpack config and no turbopack config`. Тогда `dev`/`build` были временно
форсированы на `--webpack` — рабочий, но нецелевой путь: Next.js 16
сделал Turbopack основным, и оставаться на webpack означает терять его
преимущества (быстрее dev-сервер, официальный вектор развития Next.js) и
плыть против течения экосистемы.

Отдельно: Next 16 сам генерирует `AGENTS.md`/`web/CLAUDE.md` при `next dev`
(опция `agentRules`, по умолчанию `true`) — на первом проходе это было
отключено (`agentRules: false`), чтобы не плодить второй, несинхронный с
корневым, `CLAUDE.md`.

## Варианты (сборщик)

1. **Остаться на webpack** (`next dev --webpack` / `next build --webpack`)
   — работает, но не то, для чего Next.js 16 создан "из коробки"; плагин
   Serwist для webpack (`@serwist/next`) в целом поддерживается, но это
   путь наименьшего сопротивления, а не осознанный выбор.
2. **Перейти на Turbopack + `@serwist/turbopack`** — целевая конфигурация
   Next.js 16, официально поддерживается Serwist (`docs/next/turbo`)
   через `withSerwist` в `next.config.ts`, `createSerwistRoute`
   (Route Handler) и `SerwistProvider` вместо файлового
   `swSrc`/`swDest`-конфига webpack-плагина.

## Решение (сборщик)

Перешли на вариант 2:
- `next.config.ts`: `withSerwist` из `@serwist/turbopack` (без флагов
  `--webpack` в `dev`/`build`).
- Сервис-воркер отдаётся через Route Handler
  `web/app/serwist/[path]/route.ts` (`createSerwistRoute`) — **обязательно
  под динамическим сегментом `[path]`**: сгенерированные типы
  `createSerwistRoute` (`GET`/`generateStaticParams`) ожидают параметр
  `path`, плоский `app/serwist/sw.js/route.ts` не проходит проверку типов
  на этапе `next build` (`Type ... does not satisfy the constraint
  RouteHandlerConfig<...>`). Сама логика воркера — в `src/app/sw.ts`
  (FSD-слой `app`), route handler — тонкая обёртка.
- `SerwistProvider` (`@serwist/turbopack/react`) регистрирует воркер в
  `src/app/layout/root-layout.tsx`, `swUrl="/serwist/sw.js"`.
- Отключение SW в dev — не через файловый `disable` (как было у
  webpack-плагина), а через проп `disable` самого `SerwistProvider`:
  `disable={process.env.NODE_ENV === "development"}`.
- `useNativeEsbuild: true` — нативный `esbuild` (родной дефолт Serwist на
  не-Windows), а не `esbuild-wasm`: пакет `esbuild` уже тянет платформенный
  бинарник через `optionalDependencies`, что одинаково работает и на хосте,
  и внутри `ops/local`-контейнера (каждый ставит свой бинарник).

## Варианты (agentRules)

1. Оставить `agentRules: false` — 1 источник правды (`CLAUDE.md` в
   корне), но идёт вразрез с рекомендацией Vercel: по их данным (см.
   `docs/next/guides/ai-agents.mdx`, ссылка на nextjs.org/evals) агенты
   работают лучше, когда читают версионированную документацию, которую
   генерирует `next dev`.
2. Оставить `agentRules` включённым (по умолчанию `true`).

## Решение (agentRules)

Убрали `agentRules: false` — оставили поведение по умолчанию. `next dev`
может (и будет) генерировать `web/AGENTS.md` и `web/CLAUDE.md` — это
ожидаемо, а не ошибка. Эти файлы — зона ответственности Next.js
(содержат версионированную документацию для агентов), а не место для
специфичных для проекта договорённостей: те остаются только в корневом
`CLAUDE.md`. Соответствующая пометка добавлена в корневой `CLAUDE.md`.

## Последствия

- `pnpm dev`/`pnpm build` больше не используют `--webpack`; в выводе
  сборки должно быть "Turbopack", не "webpack".
- Зависимости: `@serwist/next` удалён, добавлены `@serwist/turbopack`
  (runtime, т.к. `SerwistProvider` используется в дереве компонентов) и
  `esbuild` (devDependency, нужен `createSerwistRoute` для сборки
  воркера).
- `web/AGENTS.md` и `web/CLAUDE.md` могут появляться/обновляться при
  `next dev` — это управляемые Next.js файлы, не редактировать их вручную,
  не путать с корневым `CLAUDE.md`.
- Если Serwist или Next.js изменят типизацию `createSerwistRoute` (снимут
  требование динамического сегмента) — можно будет упростить путь роута,
  но проверять перед апгрейдом мажорных версий.
