# ADR 0030: `shared/config/routes.ts` — единственный источник путей приложения

## Контекст

Пути приложения (`/`, `/day`, `/soon`, `/install`, `/about`, три адреса
`/access/*`) были размазаны литералами минимум по шести местам:
`web/proxy.ts` (`APP_ROUTES`, `BLOCKED_SCREEN_PATH`, отдельные проверки
`"/day"`), `web/src/features/launch-gate/model/use-launch-gate.ts`
(`APP_SCREEN_PATHS`, `INSTALL_PATH`, `APP_ENTRY_PATH`),
`web/src/pages/not-found/ui/NotFoundScreen.tsx` и
`web/src/pages/server-error/ui/ServerErrorScreen.tsx` (`href="/day"`),
`web/app/(with-footer)/page.tsx` (`redirect("/day")`) и прежний
`web/src/pages/about/ui/about-header.tsx` (`const ROOT_PATH = "/"`).
Ничто не гарантировало, что при смене адреса (например, переименовании
`/install` во что-то другое) все места обновились бы разом — рассинхрон
нашёлся бы только в рантайме или руками, по `grep`.

## Решение

Заведён `web/src/shared/config/routes.ts`:

```ts
export const routes = {
  root: "/",
  day: "/day",
  soon: "/soon",
  install: "/install",
  about: "/about",
  accessDesktop: "/access/desktop",
  accessAndroid: "/access/android",
  accessIosBrowser: "/access/ios-browser",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
```

`as const` — чтобы `AppRoute` был узким union восьми литералов, не
широким `string`; пропы вроде `LinkButton`'s `href` или футерных ссылок
типизированы им, а не произвольной строкой.

Реэкспортирован из `web/src/shared/config/index.ts` рядом с `env`/
`locale` — тот же публичный API слоя `shared/config`, что уже был.
`shared/config` ничего не знает о слоях выше (`pages`/`widgets`/
`features`/`app`) — модуль экспортирует только строки путей, без
компонентов и навигационной логики; это не нарушает направление
импортов FSD.

Переведены на него:
- `web/proxy.ts` — `APP_ROUTES`, `BLOCKED_SCREEN_PATH`, сравнение
  `pathname !== routes.day`, `url.pathname = routes.soon`. `proxy.ts`
  лежит вне `src/` (в корне `web/`), но `tsconfig.json`'s `paths`
  (`"@/*": ["./src/*"]`) действует на весь проект `web/`, не только на
  `src/` — `proxy.ts` уже импортировал `@/shared/config` для `env` до
  этого ADR, так что алиас работал и добавление `routes` не потребовало
  отдельной настройки.
- `features/launch-gate/model/use-launch-gate.ts` — `APP_SCREEN_PATHS`,
  `INSTALL_PATH`, `APP_ENTRY_PATH`.
- `pages/not-found/ui/NotFoundScreen.tsx`,
  `pages/server-error/ui/ServerErrorScreen.tsx` — `href={routes.day}`
  вместо `href="/day"`.
- `app/(with-footer)/page.tsx` — `redirect(routes.day)`.
- `widgets/screen-footer/model/footer-links.ts` (новый, см. ADR 0029) —
  `href: routes.about`.
- `features/screen-back/model/use-screen-back.ts` (новый, см. ниже и
  обновление ADR 0029) — фолбэк `window.location.replace(routes.root)`.

## Последствия

- Смена любого из восьми адресов — правка одной строки в
  `routes.ts`; типы (`AppRoute`) сразу подсвечивают места, которые
  ожидали конкретный литерал.
- `pnpm typecheck`/`pnpm lint`/`pnpm test`/`pnpm build` — зелёные;
  карта маршрутов `pnpm build` не изменилась (`/`, `/day`, `/soon`,
  `/install`, `/about`, `/access/*`).
- См. также обновление ADR 0029 — в этом же заходе `pages/about/ui`
  разобран по слоям (глупая вёрстка → `shared/ui`, сценарий кнопки
  «назад» → `features/screen-back`) и убран механизм
  `sessionStorage`-флага в пользу `navigation.canGoBack`.
