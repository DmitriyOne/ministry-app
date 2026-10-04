# CLAUDE.md

Контекст для AI-агентов и людей, работающих в этом репозитории.

> **Внимание**: `web/CLAUDE.md` и `web/AGENTS.md`, если они появятся —
> это НЕ этот файл. Next.js 16 (`next dev`) сам генерирует их
> (`agentRules`, включено по умолчанию — см. `docs/decisions/0005-*.md`)
> как версионированную документацию для AI-агентов внутри `web/`. Не
> редактировать их вручную и не путать с этим, корневым, `CLAUDE.md` —
> договорённости и архитектура проекта фиксируются только здесь.

## ⚠️ Язык: код — по-английски, ADR и этот файл — по-русски

**Интерфейс приложения и комментарии в коде — британский английский**
(`en-GB`: `organise`, `behaviour`, `colour`, не американское `organize`/
`behavior`/`color`). Это касается словаря `next-intl`
(`web/src/shared/config/i18n/messages/en-GB.json`) и любых комментариев в
`.ts`/`.tsx`/`.mjs`/`.css` — см. ADR 0023 (обоснование смены языка с
русского на английский) и ADR 0014 (структура словаря, механика
next-intl). Новый комментарий или строка словаря по-русски — регрессия,
которую надо поймать до коммита.

Проверка — `grep -rnP '[А-Яа-яЁё]' web/src web/app`, но она **не обязана
быть пустой**. Запрещена русская проза в коде и словаре; цитата
заголовка русского ADR внутри английского комментария — это ссылка, а не
проза, и разрешена. Сегодня совпадений четыре строки в трёх файлах, и все
они — цитаты заголовков ADR 0019 («Обновление: state вместо
CSS-оверлея» и раздела «Ловушка: `@layer` и специфичность»):
`web/src/app/styles/globals.css` (две строки),
`web/src/features/launch-gate/ui/launch-noscript-fallback.tsx` и
`web/src/features/launch-gate/model/use-launch-gate.ts`. Пятая такая
цитата — в `web/proxy.ts` («Обновление: redirect вместо rewrite для
/access/*», заголовок ADR 0017); этот файл лежит вне `web/src`/`web/app`,
поэтому указанная команда его не видит. Перед тем как разбираться в новом
совпадении, сверьтесь с этим списком: всё, чего в нём нет, — настоящая
регрессия.

**ADR (`docs/decisions/`) и сам этот файл (`CLAUDE.md`) — по-русски.**
Это рабочие записи пользователя о решениях по проекту, не часть продукта
— смена языка интерфейса их не касается. Не переключаться на английский
при работе с `docs/decisions/*.md` или этим файлом, даже если окружающий
код уже полностью на `en-GB`.

## Стек

- **Frontend**: Next.js (App Router, Turbopack) + TypeScript (strict) +
  Tailwind CSS + shadcn/ui + zod 4 + `@t3-oss/env-nextjs` + PWA
  (`@serwist/turbopack`)
- **Backend**: Supabase — локально через Supabase CLI (Docker), в проде —
  облачный Supabase
- **Пакетный менеджер**: pnpm workspaces, версия закреплена в
  `package.json#packageManager` (сейчас 12.4.1 — см.
  `docs/decisions/0002-*.md`, `0008-*.md`); настройки сборки зависимостей
  (`allowBuilds`, `strictDepBuilds`) — в `pnpm-workspace.yaml`, не в
  `package.json` (pnpm ≥ 11 поле `pnpm` в `package.json` не читает)
- **Версии зависимостей** — политика и обоснование выбора (почему
  TypeScript не 7.x, ESLint не 10.x, Node/`@types/node` — 24, а не 26 и
  т.п.) — `docs/decisions/0010-*.md`
- **Прод фронтенда**: Vercel

## Структура репозитория

```
ministry-app/
├─ web/                          Next.js
│  ├─ proxy.ts                   Классифицирует User-Agent (ADR 0016) и
│  │                             перенаправляет (redirect 307, адрес
│  │                             МЕНЯЕТСЯ — ADR 0017, раздел "redirect
│  │                             вместо rewrite") заблокированные
│  │                             устройства на /access/*; на /day
│  │                             переключает /day ↔ /soon по LAUNCH_MODE
│  │                             (там — по-прежнему rewrite, адрес не
│  │                             меняется). "Установлено ли приложение"
│  │                             (display-mode) решает клиент —
│  │                             LaunchGate (ADR 0017/0019/0028)
│  ├─ app/                       Next App Router — тонкие роуты,
│  │                             реэкспортирующие экраны из src/pages:
│  │                             /day (приложение), /soon (Coming soon),
│  │                             /install (установка), /about (об
│  │                             приложении — ADR 0029), /privacy
│  │                             (уведомление о конфиденциальности и
│  │                             cookies — ADR 0031), /access/* —
│  │                             заглушки устройства (служебные витрины
│  │                             /styleguide и /components удалены — см.
│  │                             ADR 0011/0012); app/(with-footer)/ —
│  │                             route group (адрес не меняется), общий
│  │                             layout.tsx добавляет ScreenFooter
│  │                             ("About", "Privacy & cookies") к /, /day,
│  │                             /soon, /install, /about, /privacy —
│  │                             все, кроме /access/* (ADR 0029/0031,
│  │                             обновление: /about и /privacy теперь
│  │                             внутри группы, их собственная ссылка в
│  │                             футере рендерится активной — жирной и
│  │                             подчёркнутой, с aria-current="page");
│  │                             /access/* — вне группы, без футера (на
│  │                             эти экраны всё равно никого не пускают,
│  │                             ADR 0016); никакой логики доступа в
│  │                             layout нет —
│  │                             всё решает proxy.ts; not-found.tsx/
│  │                             error.tsx/global-error.tsx — 404/500
│  │                             (ADR 0018, штатные Next.js-конвенции, не
│  │                             страницы по адресу); app/serwist/[path]/
│  │                             route.ts — Route Handler сервис-воркера;
│  │                             app/api/v1/health/route.ts — ответ 204
│  │                             без тела, `Cache-Control: no-store`, не
│  │                             трогает ни Supabase, ни auth: им
│  │                             features/network-status проверяет,
│  │                             достижим ли сам origin (путь —
│  │                             WEB_API_ROUTES.health);
│  │                             app/icon.svg + app/apple-icon.png —
│  │                             файловые иконки (AppMark на плитке
│  │                             --hero, путь скопирован из AppMarkIcon;
│  │                             apple-icon.png 180×180 без альфа-канала,
│  │                             сгенерирован из icon-512.png — ADR 0032),
│  │                             app/favicon.ico — 16/24/32/48/64,
│  │                             со знаком, из icon.svg скриптом
│  │                             web/scripts/generate-favicon.mjs (ADR
│  │                             0032, обновление; плейсхолдер
│  │                             create-next-app заменён, не просто
│  │                             удалён — /favicon.ico запрашивают по пути);
│  │                             app/robots.ts + app/sitemap.ts —
│  │                             генерируемые по DEV_MODE/SITE_URL (пусто
│  │                             и Disallow: / под DEV_MODE, иначе
│  │                             /about+/privacy — ADR 0032; щит
│  │                             User-Agent на /about и /privacy
│  │                             по-прежнему в силе, так что реальная
│  │                             индексация ждёт отдельного решения —
│  │                             см. ADR 0032, раздел «оговорка»)
│  ├─ pages/                     ПУСТАЯ (кроме README.md) — см.
│  │                             docs/decisions/0004-*.md: без неё Next.js
│  │                             принял бы src/pages за legacy Pages Router
│  ├─ src/
│  │  ├─ app/                    FSD-слой app: только инициализация —
│  │  │                          providers, root-layout (генерирует
│  │  │                          metadata и viewport, ADR 0020;
│  │  │                          подключает LaunchGate из features/,
│  │  │                          сам никакой логики доступа не несёт),
│  │  │                          config/launch-mode.ts, глобальные стили,
│  │  │                          layout/network-gate.tsx (NetworkGate — клиентская
│  │  │                          обёртка: пока идёт первая проверка связи, показывает
│  │  │                          переданный `checking` (LaunchLoading), при отсутствии
│  │  │                          связи — OfflineScreen из pages/offline, иначе children;
│  │  │                          рядом рисует NetworkReconnectFeedback — тост «связь
│  │  │                          вернулась»; подключён в обеих ветках root-layout, в том
│  │  │                          числе под DEV_MODE), sw.ts (логика воркера: кэш, fallback
│  │  │                          документов на /offline.html, обработчики push и
│  │  │                          notificationclick). Определение
│  │  │                          "запущено со значка или нет" уехало в
│  │  │                          features/launch-gate — ADR 0028
│  │  ├─ pages/                  FSD-слой "pages" (ADR 0016/0017/0018):
│  │  │                          day, desktop-block, android-block,
│  │  │                          ios-browser-required, install-app,
│  │  │                          coming-soon, about (ADR 0029 — тонкий
│  │  │                          экран, собирает ListRow/ListCard/
│  │  │                          PaceCard/SectionLabel из shared/ui и
│  │  │                          ScreenBackHeader из features/screen-back,
│  │  │                          ADR 0030), privacy (ADR 0031 — тот же
│  │  │                          тонкий-экран приём, собирает новые
│  │  │                          SectionIndex/NumberedSection/CookieTable
│  │  │                          из shared/ui и тот же ScreenBackHeader),
│  │  │                          offline (экран «нет связи», ему отдаёт управление
│  │  │                          NetworkGate; ui/ — только вёрстка, повтор проверки
│  │  │                          приходит пропом `onRetry`), not-found, server-error
│  │  │                          (styleguide,
│  │  │                          components удалены — ADR 0011/0012)
│  │  ├─ widgets/                install-sheet (панель установки),
│  │  │                          waitlist-form (форма вайтлиста) — ADR
│  │  │                          0018; screen-footer (ScreenFooter —
│  │  │                          серверный компонент, рендерит ссылки из
│  │  │                          model/footer-links.ts под /, /day,
│  │  │                          /soon, /install, /about, /privacy;
│  │  │                          сейчас там две ссылки — "About" и
│  │  │                          "Privacy & cookies"; ui/FooterLink.tsx —
│  │  │                          единственный клиентский лист внутри
│  │  │                          (usePathname, подсвечивает ссылку на
│  │  │                          текущую страницу активной — ADR
│  │  │                          0029/0030/0031, обновление). bottom-nav
│  │  │                          удалён в ADR 0016, вернётся с реальными
│  │  │                          экранами навигации
│  │  ├─ features/                launch-gate (сценарий "определить
│  │  │                          способ запуска и решить, куда отправить
│  │  │                          человека" — LaunchGate/LaunchLoading/
│  │  │                          LaunchNoscriptFallback, model/
│  │  │                          use-launch-gate.ts — ADR 0017/0019/0028,
│  │  │                          перенесено из app/), copy-link (кнопка
│  │  │                          "скопировать ссылку" — ADR 0025),
│  │  │                          install-sheet (драг-жест закрытия
│  │  │                          панели), install-carousel (шаги
│  │  │                          инструкции + их константы в model/),
│  │  │                          join-waitlist (схема + react-hook-form
│  │  │                          вайтлиста) — ADR 0018, screen-back
│  │  │                          (сценарий "вернуться по истории или
│  │  │                          уйти на / " — useScreenBack/
│  │  │                          ScreenBackHeader, Navigation API
│  │  │                          `navigation.canGoBack`, не завязан на
│  │  │                          конкретный экран — ADR 0029/0030), network-status
│  │  │                          (сценарий «есть ли связь с origin» — api/
│  │  │                          check-connectivity.ts опрашивает /api/v1/health и
│  │  │                          принимает только 2xx, model/use-network-status.ts и
│  │  │                          use-reconnect-feedback.ts, ui/ — NetworkReconnectFeedback
│  │  │                          и ConnectionRestoredToast, config/network-config.ts —
│  │  │                          таймаут 5 с, повтор раз в 10 с, тост 3 с; публичный API —
│  │  │                          useNetworkStatus и NetworkReconnectFeedback), push-
│  │  │                          notifications (подписка на Web Push после записи в
│  │  │                          вайтлист: ui/EnableWaitlistNotifications, lib/
│  │  │                          subscribe-to-push.ts, Server Action
│  │  │                          api/register-push-subscription-action.ts со своим
│  │  │                          лимитером; зависимость `web-push`)
│  │  ├─ entities/                пока пусто (.gitkeep)
│  │  └─ shared/
│  │      ├─ ui/                 shadcn/ui компоненты, плюс TextLink
│  │      │                      (тихая ссылка, клиентская навигация как
│  │      │                      у LinkButton — ADR 0024/0029;
│  │      │                      ScreenFooter, который её использует,
│  │      │                      сам — в widgets/screen-footer, не
│  │      │                      здесь), ListRow/ListCard/PaceCard/
│  │      │                      SectionLabel (глупая вёрстка списков
│  │      │                      about-экрана, без домена — ADR 0029) и
│  │      │                      SectionIndex/NumberedSection/CookieTable
│  │      │                      (вёрстка numbered-document экрана
│  │      │                      privacy — чип-якоря, раздел с номером,
│  │      │                      таблица cookies с пилюлей статуса, без
│  │      │                      домена — ADR 0031)
│  │      ├─ lib/access/          classifyAccess + тесты (vitest) — ADR 0016
│  │      ├─ lib/metadata/        buildPageMetadata — общий помощник
│  │      │                       generateMetadata экранов (title/
│  │      │                       description/openGraph/robots) и
│  │      │                       buildSocialMetadata (openGraph + twitter с
│  │      │                       og-image.jpg, единственное место
│  │      │                       объявления) — ADR 0032
│  │      ├─ lib/display-mode/    isStandaloneDisplayMode — запущена ли
│  │      │                       страница со значка (matchMedia standalone/
│  │      │                       fullscreen + navigator.standalone), только на
│  │      │                       клиенте; им пользуются LaunchGate и
│  │      │                       features/push-notifications
│  │      ├─ lib/email/           isDisposableEmail — проверка домена на
│  │      │                       одноразовую почту/зарезервированные домены (список
│  │      │                       в disposable-email-domains.ts), используется схемой
│  │      │                       вайтлиста + тест (vitest)
│  │      ├─ lib/rate-limit/      createSlidingWindowLimiter (в памяти
│  │      │                       процесса, ADR 0026) и getClientIp (Vercel-заголовки,
│  │      │                       server-only); числа и ключи — в features
│  │      ├─ lib/seo/             buildRobots/buildSitemap — чистые
│  │      │                       функции под app/robots.ts и
│  │      │                       app/sitemap.ts, + тесты (vitest) — ADR 0032
│  │      ├─ config/              env.ts — createEnv (@t3-oss/env-nextjs),
│  │      │                       getSiteUrl() (SITE_URL с фолбэком на
│  │      │                       VERCEL_PROJECT_PRODUCTION_URL — ADR 0032);
│  │      │                       routes.ts — единственный источник
│  │      │                       всех путей приложения (`/`, `/day`,
│  │      │                       `/soon`, `/install`, `/about`,
│  │      │                       `/privacy`, `/access/*`), `as const` +
│  │      │                       узкий тип `AppRoute` — ADR 0030/0031;
│  │      │                       api-routes.ts — пути HTTP-эндпоинтов
│  │      │                       (WEB_API_ROUTES — собственные Route
│  │      │                       Handler'ы, SB_API_ROUTES — Edge
│  │      │                       Functions); здесь, а не в shared/api,
│  │      │                       потому что у констант нет среды
│  │      │                       выполнения — ADR 0034
│  │      └─ api/supabase/        supabase клиенты: client.ts (браузер),
│  │                              server.ts (@supabase/ssr, cookies),
│  │                              admin.ts (секретный ключ, обходит RLS,
│  │                              ТОЛЬКО на сервере — ADR 0037; два
│  │                              последних с `import "server-only"`) +
│  │                              database.types.ts; баррель отдаёт все
│  │                              три — осознанная ловушка, ADR 0034
│  │                              (обновление)
│  └─ public/                    manifest.webmanifest (start_url — /day,
│                                 ADR 0019; icons — 192/512 "any" +
│                                 icon-maskable-640.png "maskable", ADR
│                                 0032), иконки, pwa/ios/*.png
│                                 (плейсхолдеры экрана установки, ADR 0016),
│                                 offline.html — самодостаточная страница
│                                 «нет связи» без внешних CSS/JS/шрифтов,
│                                 её отдаёт сервис-воркер как fallback для
│                                 документов, когда нет ни сети, ни кэша
│                                 (значения цветов держать в согласии с
│                                 globals.css вручную — токены оттуда не
│                                 подтянуть)
├─ backend/
│  ├─ supabase/                  Supabase CLI проект: config.toml,
│  │                             migrations/ (waitlist_signups + функция
│  │                             join_waitlist — ADR 0033; таблица закрыта
│  │                             полностью: RLS включён, политик нет,
│  │                             grants отозваны, наружу выдан только
│  │                             execute на функцию роли anon),
│  │                             tests/ (pgTAP, `pnpm db:test` — проверяют
│  │                             именно модель доступа: что anon может
│  │                             записаться через функцию и не может
│  │                             прочитать таблицу), functions/health,
│  │                             seed.sql
│  └─ package.json               supabase CLI как devDependency, скрипты db:*/functions:deploy
├─ envs/                         *.local.env.example — шаблоны переменных окружения
├─ docs/decisions/                ADR (см. ниже)
├─ package.json                  корневой, pnpm workspaces
└─ pnpm-workspace.yaml
```

> Контейнерного запуска `web` в проекте больше нет — `pnpm dev`
> (Next.js нативно на хосте + Supabase через CLI/Docker) полностью
> покрывает локальную разработку. История и причины — `docs/decisions/0009-*.md`
> (а сама реализация, если понадобится снова, — в ADR 0007).

## Правила Feature-Sliced Design

Слои сверху вниз: `app → pages → widgets → features → entities → shared`.

- **Импорты только "вниз"**: слой может импортировать только из слоёв
  строго ниже себя. `entities` не может импортировать из `features`,
  `features` не может импортировать из `widgets` и т.д.
- **Public API через `index.ts`**: каждый слайс/сегмент экспортирует наружу
  только то, что перечислено в его `index.ts`. Импорт напрямую во
  внутренний файл слайса в обход `index.ts` запрещён.
- **Слайсы независимы друг от друга** внутри одного слоя (без
  кросс-импортов между слайсами одного уровня, кроме `@x`-нотации для
  `entities`).
- Строгое соответствие проверяется линтером `steiger`
  (`web/steiger.config.ts`, запускается через `pnpm lint`).
- `web/pages/` (пустая, с `README.md`) — НЕ часть FSD, это технический
  щит от Next.js Pages Router. Реальный слой `pages` — `web/src/pages/`.
  Подробности — `docs/decisions/0004-fsd-pages-layer-named-pages.md`.

## Дизайн-система

Токены — в `web/src/app/styles/globals.css` (`:root` + `@theme inline`):
палитра (`--palette-*` → семантические `--background`/`--hero`/`--primary`/
`--negative`/`--positive-hero`/`--ink*`), типографическая шкала
(`text-display`/`text-totals`/`text-screen-title`/`text-day-title`/
`text-list-row`/`text-caption`/`text-eyebrow` + `font-540…640` +
`tracking-*`), радиусы (`rounded-xs…4xl` = 12/13/18/20/22/26/28/32px) и
тень (`shadow-card`). Токены shadcn/ui (`--primary`, `--destructive` и
т.д.) переписаны на эту же палитру — компоненты shadcn сразу в стиле
проекта. Тёмной темы нет (сознательно, `.dark` — пустая заглушка на
будущее). Шрифт — системный стек (`--font-sans`), без `next/font`.

**Правило: цвета, размеры шрифтов, радиусы и тени — только из токенов**
(utility-классами вроде `bg-hero`, `text-negative`, `text-display`,
`font-620`, `rounded-2xl`, `shadow-card`), никогда не хардкодить HEX/rgba
или магические px в разметке экранов. Исключения — сам `globals.css` и
иконки в `web/src/shared/ui/icons/` (используют `currentColor` +
сохраняют геометрию прототипа). Служебная витрина `/styleguide` (эталон
сверки с прототипом) удалена — см. ADR 0011.

Иконки — собственные SVG-компоненты в `web/src/shared/ui/icons/`
(один файл на иконку, API `size`/`className`/`...props`, цвет через
`currentColor`), не эмодзи и не иконный шрифт. `lucide-react` остаётся в
зависимостях только для служебных нужд shadcn/ui.

Подробности решений, таблица палитры/типографики и обоснования — ADR
`docs/decisions/0011-design-tokens.md` (там же — когда и почему удалена
витрина `/styleguide`).

**Объединение классов — только через `@/shared/lib/cn`, не через пакет
`cn` напрямую.** Пакет `cn` классифицирует классы по своему статичному
снимку стандартной палитры Tailwind и не видит наши кастомные имена в
`@theme inline` — нераспознанный суффикс после `text-`/`font-`/
`rounded-`/`shadow-` молча попадает не в ту группу конфликтов (например,
`text-list-row` конфликтовал с `text-hero-foreground` и вытеснял цвет —
баг был найден на кнопке заглушки-щита). `web/src/shared/lib/cn.ts`
регистрирует все кастомные токены (`--text-*`, `--font-weight-*`,
`--radius-mark-*`/`button`/`field-card`, `--shadow-*`) в нужных группах.
**Каждый новый именованный токен в `@theme inline` — сразу в
соответствующий список в `shared/lib/cn.ts`**, иначе риск повторить эту
ошибку. `web/components.json` → `aliases.utils` указывает на
`@/shared/lib/cn`, чтобы `shadcn add` сразу генерировал правильный
импорт. Подробности и как было обнаружено — ADR 0011 (раздел «Объединение
классов»).

### Библиотека компонентов

Готовые UI-блоки (каркасы экранов, навигация, знаки, текстовые роли,
кнопки/раскладки действий, поля ввода, карточки) — в `web/src/shared/ui/`,
каждый в своём файле, без общего барреля (как `button.tsx`/`card.tsx`, а
не как `icons/` со своим `index.ts`). Полный инвентарь с параметрами —
ADR `docs/decisions/0012-component-library.md` (там же — когда и почему
удалена витрина `/components`).

**Порядок поиска компонента при работе над экраном: сначала
`shared/ui` (готовый компонент проекта) → потом shadcn/ui
(`pnpm dlx shadcn@latest add ...`, если аналога в `shared/ui` нет) → и
только если ни того, ни другого нет или shadcn-аналог не подходит по
дизайну — свой компонент, с обоснованием в ADR.** Экраны собираются ИЗ
компонентов `shared/ui`, не копируют их разметку. Пиксель-в-пиксель
совпадение с макетом не требуется — важнее переиспользование готового.

**`LinkButton` (`shared/ui/button.tsx`) на внутренние пути (`href`,
начинающийся с `/`) всегда переходит клиентски, через `next/link`** (React
Aria `Link`'s `render`-проп) — не обычной перезагрузкой документа.
Внешние/`mailto:`/`tel:` ссылки — обычный `<a>` (дефолт компонента, без
изменений). Не только стиль — полная перезагрузка заново прогоняет
`LaunchGate` и анимацию экрана загрузки (ADR 0017/0019/0028), хотя
приложение уже открыто. Подробности — ADR
`docs/decisions/0024-client-side-link-navigation.md`.

### Формы, доступность, граница `shared/ui`

Подробности и обоснования — ADR `docs/decisions/0013-forms-and-accessibility.md`.

Стек компонентов — вариант shadcn `aria-nova` поверх
`react-aria-components` (не `@base-ui/react`, см. ADR 0012/0013). Из
этого следуют два практических правила:
- **API событий react-aria, не DOM.** Компоненты `shared/ui`, написанные
  поверх `react-aria-components` (`Button`/`LinkButton`, `Input`,
  `Label`, `Separator`, `Item`), используют `onPress` вместо `onClick`,
  `isDisabled` вместо `disabled` и т.д. Нативные HTML-элементы внутри
  `shared/ui` (например, toggle-кнопка `PasswordField`) — обычный
  `onClick`, они не react-aria-примитивы. Не смешивать `onClick` с
  `onPress` на одном и том же react-aria-компоненте.
- **`"use client"`:** обязателен на каждом файле, который сам
  импортирует `react-aria-components` или использует хуки
  (`useState`/`useId` и т.п.). Компонент может оставаться серверным,
  даже если он рендерит клиентский примитив как дочерний/проброшенный
  проп (пример — `ScreenHeader`: сам без хуков, `onBack` уходит в
  клиентский `Button` через `onPress`) — это безопасно, пока вызывающая
  сторона уже клиентская; из настоящего Server Component передать
  такому компоненту функцию-проп нельзя (React не сериализует функции
  через границу RSC).

- **Формы** — `react-hook-form` + `zod` (`zodResolver`), через
  `Controller`, не `register` (наши поля — не голый `<input>`). Схема,
  `useForm` и тексты ошибок конкретной формы — в слайсе экрана/фичи, не в
  `shared/ui`. Ошибки — **пер-полевые**, под каждым контролом, не общим
  списком над формой: `FieldRow`/`PasswordField` принимают проп
  `errors?: {message?: string}[]` (напрямую подходит
  `fieldState.error && [fieldState.error]` из `Controller`) и сами
  рендерят штатный shadcn `FieldError` (`shared/ui/field.tsx`: сворачивает
  несколько ошибок в `<ul className="list-disc">/<li>`) под контролом со
  своим `id` (`useId`), связанным через `aria-describedby`. `invalid`
  выводится из `errors` внутри компонента, отдельным пропом наружу не
  передаётся. Состояние ошибки визуально — рамка **и** кольцо
  (`data-invalid` + токены `--negative`/`--ring`, см. ADR 0013) в одном
  месте (обёртка контрола), не дублируется на самом `<input>`. Кнопка
  отправки — `isDisabled={Object.keys(formState.errors).length > 0}`
  (react-aria `isDisabled`, не `disabled`): до первого submit форма
  невалидирована, ошибок нет — кнопка активна; после первого submit
  блокируется, пока есть хоть одна ошибка.
- **Заголовки** — один `h1` на экран/страницу, без пропуска уровней;
  компоненты с текстом заголовка (`TextBlock`, `HeroCard`, `ListRow`,
  `SectionLabel`) принимают `as`/`titleAs` для уровня.
- **Лендмарки** — ровно один `<main>` на экран (его даёт каркас —
  `CenteredState`/`TopAndBottomState`/`ScrollState`), навигация — `<header>`.
- **Декоративные иконки и знаки** — `aria-hidden="true"` по умолчанию
  (`AppMark`, иконки строк списка), если рядом есть видимый текст с тем
  же смыслом.
- **Граница `shared/ui`:** можно — локальное состояние самого элемента
  (открыт/показан, `useId`, проброс обработчиков наружу), как у
  shadcn `Dialog`/`Accordion`. Нельзя — бизнес-сценарии, запросы к API,
  доменные zod-схемы, захардкоженные доменные тексты. Как только у
  компонента `shared/ui` появляется сценарий с данными — сценарий уезжает
  в `features`, `shared/ui` остаётся «глупой» вёрсткой.
- **Стиль кода (весь проект, включая вендорные файлы `shadcn add`):**
  функции и компоненты — только стрелочные (`export const X = () => `),
  `function X(...)` не используется нигде, кроме мест, где TS требует
  `interface`/декларации для аугментации сторонних глобальных типов
  (`declare global { interface ... }`, например в `src/app/sw.ts`).
  Пропсы — именованный `type` рядом с компонентом (`type XProps = ...`),
  даже если проп один; `interface` не используется. Без `import * as
  React` и без обращений `React.*` (импортировать конкретные типы/хуки
  именованно). Эти правила применяются и к файлам, установленным через
  `shadcn add` — при следующем `shadcn add --overwrite` их нужно будет
  повторить вручную; вендорный файл проверяется как обычный код
  (`pnpm lint`/`pnpm typecheck`), не построчным diff'ом с апстримом.

## Доступ v1 — только iPhone в Safari, экраны — маршруты

ADR 0016 (заменяет ADR 0015) + ADR 0017 (уточняет 0016 — экраны стали
настоящими маршрутами вместо компонента в layout). Восемь состояний, у
каждого свой адрес:

| Адрес | Экран | Кто видит |
|---|---|---|
| `/day` | приложение | установленное приложение, `LAUNCH_MODE === "app"` |
| `/soon` | Coming soon | установленное приложение, `LAUNCH_MODE === "coming-soon"` |
| `/install` | установка — bottom sheet с каруселью из 5 шагов | iPhone Safari, обычный браузер |
| `/about` | об приложении — экраны и возможности (ADR 0029) | iPhone Safari, и с установленным приложением (ссылка из футера), и без него — через `APP_ROUTES` в `proxy.ts`, но НЕ через `LaunchGate` (не требует запуска со значка) |
| `/privacy` | уведомление о конфиденциальности и cookies (ADR 0031) | то же, что `/about` — iPhone Safari, и с установленным приложением (ссылка из футера), и без него — через `APP_ROUTES` в `proxy.ts`, но НЕ через `LaunchGate` |
| `/access/ios-browser` | «Доступно только в Safari» (+ «Скопировать ссылку», если доступен Clipboard API) | iPhone, не Safari (Chrome/Firefox/Edge/Opera/Яндекс на iOS, встроенные браузеры мессенджеров) |
| `/access/android` | «Приложение доступно только для iOS» | любой Android |
| `/access/desktop` | «Доступно только с телефона» | десктоп, ноутбук, любой планшет (включая iPad, в т.ч. с UA macOS) |
| `DEV_MODE=true` | всё открыто, все адреса выше — напрямую | — |

Футер (`ScreenFooter`, `widgets/screen-footer/`) показан на всех семи
экранах внутри `app/(with-footer)/` — `/`, `/day`, `/soon`, `/install`,
`/about`, `/privacy` — с двумя тихими ссылками, «About» и «Privacy &
cookies», добавлен общим `layout.tsx` route group `app/(with-footer)/`
(адрес не меняется), отдельно только от `/access/*` (ADR 0029/0031;
обновление ADR 0029 — изначально `/about`/`/privacy` были вне группы
именно потому, что футер со ссылкой на страницу, на которой человек уже
находится, казался странным; пользователь это решение отменил — теперь
ссылка на текущую страницу показывается, но оформлена как активная:
жирная и подчёркнутая, с `aria-current="page"`, не скрыта). `ScreenFooter`
(серверный компонент) рендерит список ссылок из `widgets/screen-footer/
model/footer-links.ts` (`href` — из `shared/config/routes`, ADR 0030), а
не хардкодит `<TextLink>` под каждую ссылку — третья ссылка добавится
правкой этого списка, без изменений в разметке (ADR 0029, обновление;
ADR 0031 — пример второй такой правки). Активная ссылка определяется на
клиенте — `widgets/screen-footer/ui/FooterLink.tsx`, единственный
клиентский лист внутри (`usePathname` из `next/navigation`, точное
сравнение с `href`, не по префиксу), передаёт результат в `TextLink`
(`shared/ui/`) двумя независимыми пропами: презентационный `isCurrent`
(просто добавляет `font-600 text-ink` поверх обычного `font-500
text-ink-faint` — `TextLink` не знает и не должен знать, что делает
ссылку активной) и `aria-current="page"` (обычный HTML-атрибут, никакой
специальной обработки). Ссылка в состоянии покоя теперь подчёркнута
всегда, не только на hover/focus — иначе активной ссылке не с чем было
бы контрастировать; фокус обозначен отдельно, `focus-visible:ring-2`.
Этот же `layout.tsx`, а не каждый экран по отдельности, резервирует
`min-h-dvh`, чтобы футер помещался в первый экран вместе с содержимым
без прокрутки — `CenteredState` (`shared/ui/`) на экранах внутри группы
получает проп `fill`, растягиваясь только на место, оставшееся над
футером (ADR 0029); `AboutScreen`/`PrivacyScreen` не используют
`CenteredState` (у них своя разметка), поэтому их корневой `<div>`
применяет тот же принцип вручную — `flex-1` вместо `min-h-dvh` — так,
чтобы на длинном содержимом обоих документов (весь текст — один скролл
документа) колонка росла вместе с контентом и футер оказывался после
него, в конце страницы, а не перекрывал его и не плавал (ADR 0029,
обновление).

Кнопка «назад» на `/about`, `/privacy` (и на любом другом экране,
который её подключит) — `ScreenBackHeader` из `features/screen-back` (ADR
0029/0030): если `window.navigation?.canGoBack === true` (Navigation
API — не iOS Safari до версии 26.2,
https://caniuse.com/mdn-api_navigation_cangoback), `router.back()`
(`next/navigation`) возвращает клиентски, без перезагрузки и без
повторного прогона `LaunchGate`; иначе — запасной путь,
`window.location.replace(routes.root)`, откуда `LaunchGate` сам решает
`/day` это или `/install`. Никакого `sessionStorage`-флага для этого
больше нет — был удалён в пользу прямой проверки истории браузера (ADR
0029).

Решение, какой адрес показать, принимает **только `web/proxy.ts`** —
никакого компонента-переключателя в layout больше нет. Два разных
механизма для двух разных случаев (ADR 0017, раздел «Обновление:
`redirect` вместо `rewrite` для `/access/*`»):

1. Классифицирует `User-Agent` через чистую функцию `classifyAccess()`
   (`web/src/shared/lib/access/`, покрыта тестами — `pnpm test`, vitest)
   и для всех, кроме iPhone Safari, делает `redirect` (307, **адрес в
   строке браузера меняется**) на `/access/desktop`, `/access/android`
   или `/access/ios-browser` — не `rewrite`: скрытая подмена содержимого
   без смены адреса когда-то была намеренным выбором (см. «Контекст»/
   «Решение» в ADR 0017 — историческая часть), но конфликтовала с
   `LaunchGate` (ниже), который решает по `window.location.pathname`, а
   не знает ни о какой подмене на сервере — подробности и почему именно
   `307`, не `301`/`308` (класс устройства выводится из `User-Agent`
   каждого конкретного запроса, не постоянное свойство адреса — иначе
   человек, однажды зашедший с компьютера, рисковал бы не попасть в
   приложение с телефона из-за закэшированного постоянного редиректа) —
   в том же разделе ADR 0017. На iPhone решает не чёрный список токенов
   браузеров (был до обновления ADR 0016, удалён целиком), а один белый
   список — побайтовое совпадение UA с формой настоящего Safari
   (`IOS_SAFARI_UA_PATTERN` в `classify-access.ts`); не совпало —
   `ios-not-safari`, без выяснения, какой это браузер.
2. Для iPhone Safari на пути `/day` — переключение `/day` ↔ `/soon` по
   `LAUNCH_MODE` (см. ниже), по-прежнему через `rewrite` (адрес
   остаётся `/day`) — это безопасно именно для этой пары адресов,
   потому что `LaunchGate` реагирует на `/day` и `/soon` одинаково (обе
   есть в списке "экраны приложения"), так что подмена содержимого под
   неизменным адресом не создаёт того рассинхрона, что был с
   `/access/*`. Это единственное серверное решение на этом шаге —
   "запущено со значка или нет" сервер больше не определяет.
3. `/soon`, `/install`, `/access/*` — обычные страницы, открываются
   напрямую чем угодно, что до них дошло (ничего чувствительного,
   гейтить нечем). Служебные витрины `/styleguide` и `/components`
   удалены (см. ADR 0011/0012).

**"Запущено со значка на домашнем экране или нет" (`display-mode`)
решает только клиент** — `LaunchGate` (`web/src/features/launch-gate/`,
слайс `features`, ADR 0017/0019/0028 — перенесён из `app/layout/` в
0028, потому что это сценарий "определить способ запуска и решить, куда
отправить человека", а не инициализация приложения; логика вынесена в
`model/use-launch-gate.ts`, рендер — в `ui/launch-gate.tsx`; заменил
связку `ShellReadyScript`/`data-shell`-атрибута/cookie-механики —
история всех трёх итераций и почему каждая сменила следующую — ADR
0019). Плоское React-состояние (`phase: "loading" | "exiting" |
"ready"`), не CSS-атрибут: `phase` стартует как `"loading"` одинаково на
сервере и на клиенте (расхождения при гидратации нет), и только после
монтирования, в эффекте, `useLaunchGate` читает
`matchMedia("(display-mode: standalone)")`/`navigator.standalone`,
решает — на `/`, `/day`, `/soon` без standalone уводит на `/install`
через `window.location.replace` (не `next/navigation`, полная навигация
нужна, чтобы хук смонтировался заново на странице назначения — App
Router иначе держит корневой layout, а с ним и этот же экземпляр
`LaunchGate`, смонтированным между маршрутами), на `/install` при
standalone — на `/day`, иначе переводит `phase` в `"exiting"` (или сразу
в `"ready"` при `prefers-reduced-motion: reduce`). Экран загрузки
(`LaunchLoading`) и контент приложения — не два вечно существующих
div'а, переключаемых атрибутом, а то, что `LaunchGate` **рендерит или не
рендерит** в зависимости от `phase`: пока `phase !== "ready"`, оверлей
загрузки физически есть в дереве; как только его CSS-переход
(`transitionend`, --shell-transition-duration в globals.css)
завершается, `LaunchGate` убирает его из дерева совсем — не прячет
прозрачностью/видимостью. Это и есть исправление настоящего бага на
живом iPhone Safari (кнопки не нажимались) — подробности и почему
именно эта форма мешала тапам, не предыдущая cookie/CSS-атрибутная —
ADR 0019.

При `DEV_MODE=true` `LaunchGate` вообще не подключается — `root-layout.tsx`
(решение на сервере, `env.DEV_MODE`, `shared/config`) оборачивает
`children` только в `Providers` и `NetworkGate`: ни щита по
`display-mode`, ни экрана загрузки `LaunchGate`, ни его задержки.
`NetworkGate` же подключён **в обеих ветках**, в том числе под
`DEV_MODE`: на время первой проверки связи он показывает `LaunchLoading`
(проп `checking`), а если связи нет — `OfflineScreen` (см. «Сеть и
офлайн» ниже). Так что и при `DEV_MODE=true` короткий экран загрузки
возможен, пока `/api/v1/health` не ответил. При
`DEV_MODE=false` `LaunchGate` подключён всегда, логика выше отрабатывает
на каждой странице заново (полная навигация между `/day`/`/install`
гарантирует это). **Отказ эффекта не оставляет приложение
неработоспособным**: `try/catch` вокруг всей логики определения
(переводит `phase` сразу в `"ready"`), таймер-страховка на сам переход
оверлея (если `transitionend` почему-то не пришёл — не тождественно
старому CSS-таймеру ADR 0019, это JS `setTimeout` внутри
`useLaunchGate`, не самостоятельный CSS-механизм) и `<noscript>`-сообщение
(`LaunchNoscriptFallback`, `features/launch-gate/ui/
launch-noscript-fallback.tsx`) для отключённого JavaScript — но здесь
честная оговорка: без JavaScript `LaunchGate` (клиентский компонент)
никогда не переходит за пределы серверного `phase="loading"` — контент
не просто скрыт, а действительно не отрисован, посетитель без JS видит
только текст «нужен JavaScript», не приложение (регрессия против
предыдущей cookie/`<noscript>`-CSS-схемы, которая могла показать
статически отрисованный контент немедленно без JS, — осознанно принято,
подробности в ADR 0019).

**`LAUNCH_MODE`** (`web/src/app/config/launch-mode.ts`,
`"coming-soon" | "app"`) — единственное место переключения на реальное
приложение; читает его `web/proxy.ts` (вычисляет `INSTALLED_APP_PATH`
при импорте). Смена — одна строка. `DEV_MODE=true` обходит `proxy.ts`
целиком (`if (env.DEV_MODE) return NextResponse.next()`) и показывает
`/day` напрямую, что бы ни стояло в `LAUNCH_MODE`.

**`DEV_MODE`** (`envs/*.local.env`, схема — `shared/config/env.ts`,
булево, по умолчанию `false`) отключает **оба** щита сразу — и
серверный (`proxy.ts` целиком пропускает запрос) и клиентский
(`root-layout.tsx` не подключает `LaunchGate` вовсе, см. выше). Читается
на сервере — для статически сгенерированных маршрутов (`/soon`,
`/install`, `/access/*`) значение запекается в разметку на этапе сборки,
поэтому смена `DEV_MODE` требует пересборки (`pnpm build`), не только
перезапуска сервера с другим значением переменной окружения; `/day`
рендерится динамически на каждый запрос и подхватывает значение сразу.
**Никогда не задавать `DEV_MODE=true` в Production на Vercel** — это
открывает приложение всем; при таком сочетании с `NODE_ENV=production`
сервер бросает ошибку при старте и не запускается (`shared/config/env.ts`).

Известный компромисс: iPhone с включённым «Запросить настольный сайт» в
Safari шлёт UA Macintosh и получит «Доступно только с телефона» — та же
природа, что iPad, маскирующийся под Mac. Зафиксировано тестом.

Подробности, форма UA настоящего Safari и почему решает она, а не
список токенов конкретных браузеров, обоснование двухступенчатой схемы,
почему Android временно заблокирован — ADR
`docs/decisions/0016-v1-ios-safari-only-access.md`. Переход от
layout-компонента к маршрутам и (позже) от `rewrite` к `redirect` для
`/access/*` — ADR
`docs/decisions/0017-routes-not-layout-for-access-screens.md`. Экран
загрузки, его эволюция от cookie к `ShellReadyScript`/CSS-атрибуту и
затем к чисто состоянию React (`ShellGate`, тогда ещё в `app/`) — ADR
`docs/decisions/0019-shell-loading-indicator.md`. Перенос `ShellGate` из
`app/` в `features/launch-gate` (переименован в `LaunchGate`) — ADR
`docs/decisions/0028-launch-gate-feature-slice.md`.

### 404 и 500

`app/not-found.tsx` и `app/error.tsx`/`app/global-error.tsx` (ADR 0018)
— штатные Next.js-конвенции, не страницы по произвольному адресу.
`app/not-found.tsx` рендерится для любого несовпавшего маршрута;
`app/error.tsx` — для необработанного исключения при рендере сегмента
(должен быть Client Component по контракту Next.js — `pages/
server-error` использует `useTranslations`, не `getTranslations`);
`app/global-error.tsx` — только если падает сам корневой `layout.tsx`
(единственный файл в проекте с текстом не из словаря — осознанное
исключение, см. ADR 0018, `NextIntlClientProvider` мог быть причиной
падения). Заблокированные устройства (десктоп/Android/iPhone не-Safari)
эти экраны видят только там, где `proxy.ts` их не трогает: он
классифицирует и уводит на `/access/*` (redirect 307, не rewrite)
**только** пути из `APP_ROUTES` — `/`, `/day`, `/soon`, `/install`,
`/about`, `/privacy` — а остальные пропускает как есть. Поэтому
несуществующий адрес (`/qwerty`) на любом устройстве даёт настоящий 404,
а не заглушку устройства; так сделано намеренно (комментарий в
`proxy.ts`: иначе несуществующие адреса получали бы заглушку устройства
вместо настоящего 404).

### Сеть, офлайн, пуши, email

Короткие записи о частях, у которых пока нет собственного ADR (кроме
отмеченных); подробности — в коде, комментарии там поясняют причины.

- **Проверка связи и офлайн-экран.** `NetworkGate`
  (`web/src/app/layout/network-gate.tsx`) оборачивает приложение в обеих
  ветках `root-layout.tsx`. Состояние берёт у `useNetworkStatus`
  (`features/network-status`): `checking` → `online`/`offline`. Проба —
  `fetch` на `/api/v1/health` (`app/api/v1/health/route.ts`, ответ 204);
  годится только ответ 2xx — `fetch` разрешается и на 500, и на 404, и на
  «captive portal» с 200, и сам по себе ничего не доказывает. Таймаут 5 с,
  повтор в офлайне раз в 10 с, тост «связь восстановлена» 3 с
  (`NETWORK_CONFIG`). Офлайн-экран — `pages/offline`. Отдельно от него
  `public/offline.html` — статичная страница, которую сервис-воркер
  (`app/sw.ts`) отдаёт вместо документа, когда нет ни сети, ни кэша; на
  `/api/v1/health` воркер кэш не применяет (`NetworkOnly`).
  `SerwistProvider` в `root-layout.tsx` создан с `reloadOnOnline={false}`:
  по умолчанию Serwist перезагружает документ при каждом событии
  `online`, что гонялось бы с `NetworkGate` и стирало клиентское
  состояние, в том числе одноразовый токен подписки на пуши.
- **Пуш-уведомления вайтлиста.** `features/push-notifications` и
  зависимость `web-push` (`web/package.json`; она же — в
  `backend/package.json` для рассылочного скрипта). После записи в
  вайтлист `join_waitlist` выдаёт одноразовый токен (`push_enrollment_
  token`), `EnableWaitlistNotifications` на экране успеха предлагает
  включить уведомления **только в установленном приложении**
  (`isStandaloneDisplayMode`), `registerPushSubscription` (Server Action)
  меняет токен на запись в `push_subscriptions` через
  `register_waitlist_push_subscription` и секретный ключ (ADR 0037).
  Токен живёт 30 минут и гасится при первом обращении после этого
  (ADR 0033, обновление). Пара VAPID-ключей — `NEXT_PUBLIC_WEB_PUSH_VAPID_
  PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT` в
  `envs/web.local.env`; для рассылки те же значения — в
  `envs/backend.local.env`. Отдельного ADR на сам выбор Web Push пока нет.
- **Разовая рассылка о запуске** — `backend/scripts/send-waitlist-launch-
  push.mjs`, `pnpm push:launch`. **Содержит известные дефекты и
  намеренно не исправлен до запуска** (не листает больше 1000
  подписчиков и молча сообщает об успехе, не идемпотентен, нет
  dry-run) — условия, при которых её можно запускать, перечислены в ADR
  `docs/decisions/0038-launch-push-delivery-limits.md`. Не запускать на
  настоящей аудитории, пока они не выполнены.
- **Email.** `shared/lib/email` — `isDisposableEmail`, используется
  схемой вайтлиста (`features/join-waitlist/model/schema.ts`): отсекает
  одноразовые провайдеры и зарезервированные домены (`example.com`,
  `.test` и т.п.). Не бросает: адрес без домена считается «не
  одноразовым», формат проверяет сама схема. Список доменов — вручную
  поддерживаемый файл, а не сервис, и неполон по природе.
- **Лимиты частоты.** `shared/lib/rate-limit` (скользящее окно в памяти
  процесса, ADR 0026) используют `features/join-waitlist` и
  `features/push-notifications` со своими числами.

### Как посмотреть каждый экран локально

При `DEV_MODE=true` (`envs/web.local.env`) `proxy.ts` не участвует
вовсе — все адреса открываются напрямую, с любого устройства, без
подмены `User-Agent`/`display-mode`:

| Адрес | Что видно |
|---|---|
| `/day` | экран приложения |
| `/soon` | Coming soon |
| `/install` | экран установки (bottom sheet) |
| `/about` | экран «О приложении» (ADR 0029) |
| `/privacy` | экран уведомления о конфиденциальности и cookies (ADR 0031) |
| `/access/desktop` | заглушка «только с телефона» |
| `/access/android` | заглушка «только iOS» |
| `/access/ios-browser` | заглушка «только Safari» |
| любой несуществующий адрес (например `/qwerty`), а также `/styleguide`, `/components` (удалены — ADR 0011/0012) | 404 |

500 напрямую адресом не открыть (это не страница, а обработчик реальной
ошибки рендера) — проверяется временно брошенным исключением в коде
экрана на время отладки, либо в проде — реальной ошибкой.

`/day`/`/soon`/`/install`/`/about`/`/privacy`/`/access/*` при `DEV_MODE=false` продолжают
работать по правилам таблицы выше — только уже по-настоящему, через
классификацию `User-Agent` и клиентскую проверку `display-mode`
(`LaunchGate`). Эмуляции `display-mode` не умеет CDP/Chromium (см.
ADR 0015/0016) — сценарий «запуск со значка» проверяется вживую, на
реальном iPhone.

## Словарь текстов (i18n)

`next-intl`, один язык (**`en-GB`**, без сегмента в URL/переключателя — см.
ADR 0014, смена языка на английский — ADR 0023), один файл словаря —
`web/src/shared/config/i18n/messages/en-GB.json`. Конфиг —
`web/src/shared/config/i18n/` (`locale.ts`/`request.ts`/`types.ts`),
подключён плагином в `next.config.ts`.

**Правило: ни одной строки в разметке.** Видимый JSX-текст и атрибуты
`aria-label`/`aria-labelledby`/`title`/`alt`/`placeholder` — только через
`t("...")` (`useTranslations` в клиентских компонентах, `getTranslations` в
серверных), не строковые литералы. Соблюдение проверяет
`eslint-plugin-i18next` (`i18next/no-literal-string`, `pnpm lint`).

**Как добавить ключ**: дописать в `en-GB.json` (вложенно, по месту
использования — `screens.<slug>.*` для экранов, `common`/`a11y` — только
для дефолтных доступных подписей самих компонентов `shared/ui`, см. ADR
0013), вызвать `t("new.key")`. Несуществующий ключ ломает `pnpm typecheck`
(типизация — через `declare module "next-intl"` в `types.ts`, по структуре
`en-GB.json`). Числа с разными формами — через ICU-плюрализацию
(`{count, plural, one {...} other {...}}`), не склейкой строк. Подробности
и обоснование — ADR `docs/decisions/0014-i18n-dictionary.md` (структура
словаря, выбор next-intl) и `docs/decisions/0023-locale-en-gb.md` (смена
языка на британский английский).

## Команды

Все — из корня репозитория.

| Команда | Что делает |
|---|---|
| `pnpm dev` | Поднимает Supabase (`db:start`), ждёт готовности (`wait-on` на health Supabase), затем `next dev` (Turbopack) с env из `envs/web.local.env` |
| `pnpm db:start` / `db:stop` / `db:reset` | Обёртки над `supabase start/stop/db reset` в `backend/` |
| `pnpm db:test` | pgTAP-тесты схемы (`supabase test db`) — модель доступа к `waitlist_signups` (ADR 0033). Только локальная БД |
| `pnpm db:types` | Генерация TS-типов из локальной БД в `web/src/shared/api/supabase/database.types.ts` |
| `pnpm lint` | ESLint + `steiger` (проверка границ FSD) в `web/` |
| `pnpm typecheck` | `tsc --noEmit` в `web/` |
| `pnpm test` | `vitest run` в `web/` — `classifyAccess` (ADR 0016), `buildRobots`/`buildSitemap` (ADR 0032), `mapJoinWaitlistRow` (ADR 0033), `isDisposableEmail` (`shared/lib/email`) — пять файлов `*.test.ts` в `web/src` |
| `pnpm build` | `next build` (Turbopack) в `web/` (с env из `envs/web.local.env`) |
| `pnpm db:login` / `db:link` / `db:push` / `functions:deploy` | Деплой в облачный Supabase — см. раздел ниже |
| `pnpm push:launch` | Рассылает уведомление о запуске всем подписчикам из `push_subscriptions`. Запускать только из корня: env лежит в `envs/backend.local.env`, а скрипт — в `backend/`, и связать их может лишь корневой `package.json` (как `wait:supabase`). Пара ключей VAPID в `envs/web.local.env` и `envs/backend.local.env` должна быть **одной и той же**, иначе push-служба отвергнет отправку |

## Договорённости

- **Миграции Supabase — только через файлы в `backend/supabase/migrations/`.**
  Никаких ручных правок схемы через Supabase Studio без последующей
  миграции (`supabase db diff` / `supabase migration new`).
- **Таблица в схеме `public` закрывается полностью, доступ выдаётся
  функцией.** RLS включён, политик нет, `revoke all ... from anon,
  authenticated` выполнен в той же миграции (grants выдаются новой
  таблице автоматически и политиками не отбираются), а наружу выдаётся
  `execute` на функцию с `set search_path = ''`. Исходный образец ADR
  0033 (`security definer` + `execute` для `anon`) заменён ADR 0037: для
  записей из доверенного сервера функции — `security invoker`, `execute`
  только у `service_role`, `anon` до них не дотягивается. Отступление
  от него — отдельное решение с отдельным ADR, не правка миграции
  «заодно». Модель доступа проверяется pgTAP-тестами
  (`backend/supabase/tests/`, `pnpm db:test`), а не на глаз.
- **Переменные окружения — только через `envs/*.local.env`**, никогда не
  хардкодить и не коммитить реальные значения. В git — только
  `envs/*.local.env.example` с плейсхолдерами; реальные `*.local.env`
  добавлены в `.gitignore`.
- Доступ к env в коде — только через `web/src/shared/config/env.ts`
  (`@t3-oss/env-nextjs` + zod, fail-fast, с автоматическим разделением
  client/server), не через `process.env` напрямую по всему коду.
- **Открыть dev-сервер с телефона** (по локальной Wi-Fi-сети) —
  `DEV_ALLOWED_ORIGIN` в `envs/web.local.env` (свой LAN IP, пример и как
  его узнать — в `envs/web.local.env.example`), прокидывается в
  `allowedDevOrigins` (`web/next.config.ts`) через `env.ts`. Принимает
  **список через запятую** (несколько сетей — например домашний Wi-Fi и
  мобильная точка доступа): каждое значение обрезается от пробелов,
  пустые отбрасываются, `env.ts` превращает строку в `string[]`. Не
  задан — ограничение просто отсутствует, сборка не падает. Личный
  IP-адрес не хардкодится и не коммитится — по тому же правилу, что и
  остальные env.
- **Абсолютный базовый URL для метаданных** (`robots.txt`'s
  `Sitemap:`, `sitemap.xml`, `metadataBase` — ADR 0032) — `SITE_URL`
  (опциональный, `envs/web.local.env.example`) с фолбэком на
  платформенную `VERCEL_PROJECT_PRODUCTION_URL` (читается напрямую из
  `process.env`, не через `env.ts`/zod — её задаёт сама платформа
  Vercel, не этот проект). Доступ — только через `getSiteUrl()`
  (`shared/config`), не через `env.SITE_URL` напрямую: функция, не
  константа, по той же причине, что `DEV_MODE`-проверка выше в
  `env.ts`, — серверный ключ не должен читаться в клиентском бандле,
  который тянет `shared/config` только ради `locale`. Ни одна из двух
  переменных не задана — `robots.ts`/`sitemap.ts` деградируют
  безопасно (пустой `sitemap.xml`, `robots.txt` без строки
  `Sitemap:`), сборка не падает. Домен продакшена пока не подтверждён
  пользователем — ничего не захардкожено.
- **Браузерный и серверный Supabase-клиенты используют один и тот же
  `NEXT_PUBLIC_SUPABASE_URL`** — никакого отдельного "серверного" URL. Это
  важно не только для простоты, но и потому что имя auth-cookie
  `@supabase/ssr` по умолчанию выводится из хоста этого URL — если
  браузер и сервер резолвят Supabase по-разному, они получат разные имена
  cookie и не увидят сессию друг друга (было и снова не актуально — см.
  `docs/decisions/0009-*.md`).
- Ключи Supabase — **publishable** (`sb_publishable_...`), не легаси
  `anon`. Секретный (`sb_secret_...`) ключ не должен попадать в браузер
  или в любой клиентский бандл — никогда не `NEXT_PUBLIC_*` (ADR 0006,
  сужено ADR 0037). Его использует ровно один серверный модуль,
  `web/src/shared/api/supabase/admin.ts` (`import "server-only"`,
  `createAdminSupabaseClient`, `SUPABASE_SECRET_KEY` в серверном блоке
  `env.ts`): он обходит RLS, поэтому его нельзя реэкспортировать туда,
  куда дотянется Client Component, и любой вызов через него сам отвечает
  за авторизацию. Через него Server Actions вызывают
  `join_waitlist`/`register_waitlist_push_subscription` — у `anon` на эти
  функции `execute` отозван (ADR 0037).

## Деплой миграций в облачный Supabase

> ⚠️ **`supabase db reset --linked` (и вообще `db reset` на удалённом
> проекте) УНИЧТОЖАЕТ данные в облачной базе.** Выполнять только на
> локальной БД (без `--linked`). Перед любой операцией, затрагивающей
> `--linked`/prod-проект, убедиться, что это осознанное действие, а не
> копипаста локальной команды.

> ⚠️ Команды ниже — **аварийный путь**. Штатный способ выложить миграции
> и функции в прод — workflow `supabase-deploy.yml` (ADR 0042): он
> запускается только руками (`workflow_dispatch`, кнопка «Run workflow»
> или `gh workflow run supabase-deploy.yml`), требует галочки
> подтверждения, прогоняет pgTAP перед записью в прод и берёт секреты из
> окружения `production`. Запуск с машины разработчика ничего этого не
> проверяет, поэтому к нему прибегать только если CI недоступен.

1. `pnpm db:login` — интерактивный вход в Supabase CLI (один раз на
   машину/аккаунт).
2. `pnpm db:link` — привязка локального проекта к облачному. Требует
   `SUPABASE_PROJECT_REF` в окружении: `SUPABASE_PROJECT_REF=abcxyzproj pnpm db:link`.
3. `pnpm db:push` — применяет локальные файлы из
   `backend/supabase/migrations/` к привязанному облачному проекту.
4. `pnpm functions:deploy` — деплоит `backend/supabase/functions/*`
   (включая `health`) в облачный проект.

---

> ## ⚠️ ВАЖНОЕ ПРАВИЛО: фиксируйте решения в ADR
>
> **Каждое архитектурное или техническое решение по этому проекту** — выбор
> структуры репозитория, библиотеки, подхода к реализации, способа запуска
> и т.п. — **должно фиксироваться в `docs/decisions/` в формате ADR**
> (контекст → варианты → решение → последствия), а не оставаться только в
> истории переписки с пользователем или в голове того, кто это решение
> принял.
>
> Формат имени файла: `NNNN-краткое-описание.md` (см. существующие ADR в
> `docs/decisions/` как образец). Пишите по-русски, кратко, по делу.

---
