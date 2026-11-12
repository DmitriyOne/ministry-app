# 0073. Обновление зависимостей по `pnpm audit`: Next.js 16.4.6, `shadcn` в devDependencies, overrides

Дата: 2026-11-12
Статус: принято

## Контекст

`pnpm audit --prod` на `develop` (2.10.0) показал **53** находки: 4
critical, 20 high, 24 moderate, 5 low.

- **`next` закреплён на 16.3.5**, и под него подпадали три critical:
  удалённое выполнение кода в Image Optimization при SVG, в `use cache` с
  типизированными массивами и в `next/og` `ImageResponse`, плюс DoS в
  Server Actions. Исправлено в 16.4.1.
- **37 из 53 приходили через `shadcn`**, который лежал в `dependencies`,
  хотя это CLI для генерации компонентов и в рантайме приложению не нужен.
- Остальное — транзитивные зависимости `@serwist/turbopack`,
  `@sentry/nextjs`, `next-intl`, `@hookform/resolvers`.

Достижимость проверена по коду, а не по заголовкам: `ImageResponse` и
`use cache` в проекте не используются, `next/image` встречается в одном
месте (`InstallCarousel`), `dangerouslyAllowSVG` не включён. Прямой
эксплуатации не видно, но Server Actions у нас есть (форма waitlist), так
что DoS-находка относится к нам.

## Варианты

1. **Не трогать.** Отвергнуто: версии со знанием о критических RCE в
   рабочем приложении — это долг, который растёт, а не стоит на месте.
2. **Обновить только `next`.** Закрывает critical, оставляет 40+ находок
   от `shadcn` и транзитивных.
3. **Обновить прямые зависимости, вынести `shadcn` в devDependencies,
   добавить точечные `overrides`.** Выбрано.

## Решение

- `next` и `eslint-config-next` — **16.4.6** (шагают вместе); `zod`
  4.6.7; `serwist` и `@serwist/turbopack` 9.5.13; `@sentry/nextjs`
  ^11.12.0; `next-intl` ^4.15.0.
- `shadcn` переехал в `devDependencies` (^4.23.0). Команда
  `npx shadcn@latest ...` из `AGENTS.md` от этого не меняется.
- В `pnpm-workspace.yaml` добавлены `overrides` **только на патч-обновления
  в пределах мажора**: `fast-uri`, `joi`, `source-map-js`, `vite`,
  `brace-expansion`, вложенный `zod`.
- `@hookform/resolvers` оставлен на ^5: версия 7 — мажорный прыжок, и
  ради одной транзитивной находки её брать не стали.

## Последствия

- `pnpm audit --prod`: **53 → 2** находки (moderate, `glob` и `minimatch`
  через `@serwist/turbopack`; лечатся мажорным подъёмом, который задаёт
  сам serwist, а они нужны только при сборке service worker).
- `overrides` — временные: убрать, когда родительские пакеты сами
  потянут исправленные версии. Проверять при каждом обновлении
  `@hookform/resolvers`, `@serwist/turbopack`, `@sentry/nextjs`.
- Проверено: `pnpm lint` (те же 3 предупреждения `exhaustive-deps`, что и
  на `develop`), `pnpm typecheck`, `pnpm test` (579 тестов), `pnpm build`.
  **`pnpm db:test` не гонялся**: обновление затрагивает только JS-пакеты и
  не касается схемы; в CI он идёт по общему правилу (ADR 0052).
- Не сделано: автоматическое слежение (Dependabot/Renovate). Без него
  такой разбор придётся повторять руками.
