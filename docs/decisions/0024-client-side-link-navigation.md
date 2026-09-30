# ADR 0024: внутренние переходы — через next/link, не обычная ссылка

## Контекст

Кнопка «Go to home screen» на экране 404 (`web/src/pages/not-found/ui/
NotFoundScreen.tsx`) и «Go to home screen»-подобная кнопка на экране 500
(`web/src/pages/server-error/ui/ServerErrorScreen.tsx`) — обе
`LinkButton href="/day"`. `LinkButton` — обёртка над `Link` из
`react-aria-components` (`web/src/shared/ui/button.tsx`), которая по
умолчанию рендерит обычный `<a href="...">`. Клик по такой ссылке —
полная перезагрузка документа: заново исполняется `ShellReadyScript`
(ADR 0017/0019) и заново проигрывается анимация ухода экрана загрузки
(`--shell-transition-duration`), хотя приложение уже открыто и вся эта
механика существует только для первого открытия/запуска со значка.

## Решение

`LinkButton` (`web/src/shared/ui/button.tsx`) делегирует навигацию
`next/link` через `render`-проп `Link` из `react-aria-components` —
задокументированный самим React Aria способ интеграции с
клиентским роутером (`react-aria.adobe.com/Link`, раздел «Client side
routing»: «By default, links with an href are handled by the browser as
regular page navigations. To integrate with a client side router, use
the render prop to delegate to your router's link component»):

```tsx
<LinkPrimitive
  href={href}
  render={
    isInternalHref(href)
      ? (linkProps) => ("href" in linkProps ? <NextLink {...linkProps} href={href} /> : <span {...linkProps} />)
      : undefined
  }
  {...props}
/>
```

- **Только для внутренних путей** (`href` начинается с `/`) —
  `isInternalHref()`. `next/link` рассчитан на маршрут приложения, не на
  произвольный/внешний адрес; для `mailto:`, `tel:`, внешних `https://...`
  `render` не передаётся вовсе, и `react-aria-components` использует свой
  дефолт — обычный `<a>`. В проекте сейчас нет внешних ссылок через
  `LinkButton` (обе живые ссылки — `/day`), но правило рассчитано на
  будущее использование компонента.
- **`"href" in linkProps` — проверка из документации типов
  `react-aria-components`** (`PossibleLinkDOMRenderProps`, JSDoc: «you can
  check if 'href' in props in order to tell whether to render an `<a>`
  element»): `Link` без `href` рендерится как `<span role="link">`
  (нужен только для `onPress`-обработчиков) — та же функция `render`
  обслуживает оба случая, TypeScript иначе не даёт передать
  `LinkPrimitiveProps["href"]` (может быть `undefined`) в обязательный
  `href` компонента `next/link`.
- **`isInternalHref`** — простая проверка `typeof href === "string" &&
  href.startsWith("/")`, не завязана на список конкретных маршрутов —
  любой новый внутренний путь получает клиентскую навигацию
  автоматически, без правки этого файла.

## Проверено на обоих экранах, не только на одном

Обе живые `LinkButton`-ссылки в проекте (404 → `/day`, 500 → `/day`)
используют один и тот же компонент `web/src/shared/ui/button.tsx` — фикс
общий, не точечный патч одного экрана. Других мест с обычной `<a
href>`/`next/link` на внутренние маршруты в `web/src` на момент фикса не
найдено (`grep -rn "href="` по `web/src/**/*.tsx`) — `LinkButton` пока
единственный способ сослаться на внутренний маршрут из UI.

## Доступность и вид кнопки — не пострадали

`react-aria-components`' `render`-проп подставляет **тот же набор
пропов** (`className`, `data-*`, `aria-*`, обработчики), что попал бы на
`<a>` по умолчанию — `NextLink` их принимает как обычные пропы `<a>` и
рендерит семантический `<a href>` с client-side перехватом клика
(`preventDefault` + `router.push`). Визуально и по ролям/атрибутам
доступности кнопка не отличается от прежней — `cva`-классы
(`buttonVariants`) как и раньше приходят через `className` на
`LinkPrimitive`, не через `NextLink`.

## Живая проверка

Playwright, прод-сборка (`next build` + `next start`, порт 3123,
`DEV_MODE=true` — чтобы открыть 404 с произвольного UA, см. таблицу «Как
посмотреть каждый экран локально» в `CLAUDE.md`): переход на
несуществующий адрес → клик по ссылке на главную → `window.__sentinel`
(значение, выставленное в `window` до клика) сохраняется после перехода
на `/day` — подтверждает, что это клиентский переход (SPA-навигация), а
не полная перезагрузка документа (которая обнулила бы состояние `window`
и заново вызвала бы `ShellReadyScript`/анимацию экрана загрузки).
`pnpm lint`/`typecheck`/`test`/`build` — чисто.
