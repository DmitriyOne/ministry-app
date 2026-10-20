# CLAUDE.md

Контекст для AI-агентов и людей, работающих в этом репозитории.

> **Внимание**: `web/CLAUDE.md` и `web/AGENTS.md` — это НЕ этот файл.
> Содержимое держит `web/AGENTS.md`: Next.js 16 (`next dev`) создаёт его
> (`agentRules`, включено по умолчанию — см. `docs/decisions/0005-*.md`)
> и держит там свой блок между маркерами
> `<!-- BEGIN:nextjs-agent-rules -->` и
> `<!-- END:nextjs-agent-rules -->`. `web/CLAUDE.md` — одна строка
> `@AGENTS.md`, то есть импорт соседа; маркеров в нём нет, и править в
> нём нечего. **Внутри маркеров не править**:
> `next dev` перепишет. Всё, что лежит за ними, перегенерацию переживает
> (проверено по `upsertAgentRulesBlock` в
> `node_modules/next/dist/server/lib/generate-agent-files.js`) — там и
> живёт наша приписка: отсылка к этому файлу и короткий список правил
> именно для `web/`. Договорённости и архитектура проекта фиксируются
> только здесь.
>
> Соседние документы в корне: [`DESIGN.md`](./DESIGN.md) — визуальный
> язык: токены, отступы, инвентарь компонентов и порядок поиска готового.
> **Читать до того, как писать разметку** — любой новый экран, карточка,
> строка списка или форма начинается там, а не с чистого файла;
> [`AGENTS.md`](./AGENTS.md) — короткий вход
> для агентов (ссылается сюда, ничего не дублирует);
> [`README.md`](./README.md) — как запустить, по-английски;
> [`CHANGELOG.md`](./CHANGELOG.md) — что добавила каждая версия.

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

**Коммиты делятся по смыслу, а не по моменту окончания работы.**
Граница — «рецензент мог бы отвергнуть это, приняв соседнее»: миграция,
фронтенд, документация и настройка CI идут разными коммитами, а
рефакторинг — отдельно от нового поведения. Один ком на всю задачу
заставляет человека либо принять всё, либо откатить всё, и `git log`
перестаёт отвечать, когда что появилось.

**Сообщения коммитов, названия веток и описания PR — тоже по-английски.**
История git — часть кода, а не рабочая записка о проекте, и живёт по
правилам кода. По-русски в репозитории остаются ровно три вещи:
`docs/decisions/*`, этот файл и `CHANGELOG.md`. Записано после того, как
в `release/v2` уехали русские сообщения коммитов — правило ниже про ADR
к git-истории никогда не относилось, но и сказано этого не было.

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
│  ├─ proxy.ts                   Два щита подряд. Классифицирует
│  │                             User-Agent (ADR 0016) и перенаправляет
│  │                             (redirect 307, адрес МЕНЯЕТСЯ — ADR
│  │                             0017) заблокированные устройства на
│  │                             /access/*; затем читает сессию
│  │                             (getClaims, ADR 0044) и применяет
│  │                             resolveGate — /login, /day или /profile.
│  │                             Своих списков путей не держит: чего
│  │                             требует адрес, говорит ROUTE_POLICY
│  │                             (shared/config/route-policy.ts, ADR
│  │                             0050), и адрес без политики не трогает
│  │                             вовсе — чтобы /qwerty давал настоящий
│  │                             404. "Установлено ли приложение"
│  │                             (display-mode) решает клиент —
│  │                             LaunchGate (ADR 0017/0019/0028)
│  ├─ app/                       Next App Router — тонкие роуты,
│  │                             реэкспортирующие экраны из src/pages.
│  │                             Две route group'ы, обе только про
│  │                             layout (адреса не меняют):
│  │                             app/(with-bottom-nav)/ — /day,
│  │                             /calendar, /month, /year, /profile,
│  │                             /admin/users/new, его layout.tsx даёт
│  │                             BottomNav и резервирует место под
│  │                             панель; app/(with-footer)/ — только
│  │                             /soon и /install, его layout.tsx даёт
│  │                             ScreenFooter ("About", "Privacy &
│  │                             cookies") — группа сужена владельцем
│  │                             (ADR 0045, обновление). Вне групп: /
│  │                             (редирект на /day), /login,
│  │                             /forgot-password, /about (ADR 0029),
│  │                             /privacy (ADR 0031), /access/* —
│  │                             заглушки устройства (служебные витрины
│  │                             /styleguide и /components удалены — см.
│  │                             ADR 0011/0012); никакой логики доступа в
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
│  │  │                          обёртка: при отсутствии связи показывает
│  │  │                          OfflineScreen из pages/offline, во всех остальных
│  │  │                          состояниях — children. Экрана ожидания нет: пока
│  │  │                          идёт первая проба, приложение уже отрисовано
│  │  │                          (ADR 0055);
│  │  │                          рядом рисует NetworkReconnectFeedback — тост «связь
│  │  │                          вернулась»; подключён в обеих ветках root-layout, в том
│  │  │                          числе под DEV_MODE), sw.ts (логика воркера: кэш, fallback
│  │  │                          документов на /offline.html, обработчики push и
│  │  │                          notificationclick). Определение
│  │  │                          "запущено со значка или нет" уехало в
│  │  │                          features/launch-gate — ADR 0028
│  │  ├─ pages/                  FSD-слой "pages" (ADR 0016/0017/0018).
│  │  │                          Две ГРУППЫ слайсов (папка без своего
│  │  │                          index.ts — не слайс, а контейнер):
│  │  │                          access/ — три щита устройства
│  │  │                          (desktop-block, android-block,
│  │  │                          ios-browser-required, общий префикс
│  │  │                          /access/*), network/ — offline и
│  │  │                          service-unavailable (оба показывает
│  │  │                          NetworkGate). Группы завелись, когда
│  │  │                          слой перевалил за 20 слайсов и steiger
│  │  │                          потребовал сгруппировать: правило
│  │  │                          выполнено, не выключено — ADR 0055,
│  │  │                          обновление 2026-10-20. Остальные слайсы:
│  │  │                          day, install-app,
│  │  │                          coming-soon, about (ADR 0029 — тонкий
│  │  │                          экран, собирает ListRow/ListCard/
│  │  │                          PaceCard/SectionLabel из shared/ui и
│  │  │                          ScreenBackHeader из features/screen-back,
│  │  │                          ADR 0030), privacy (ADR 0031 — тот же
│  │  │                          тонкий-экран приём, собирает новые
│  │  │                          SectionIndex/NumberedSection/CookieTable
│  │  │                          из shared/ui и тот же ScreenBackHeader),
│  │  │                          network/offline (экран «нет связи», ему отдаёт
│  │  │                          управление NetworkGate; ui/ — только вёрстка,
│  │  │                          повтор проверки приходит пропом `onRetry`),
│  │  │                          network/service-unavailable (экран «сломалось
│  │  │                          у нас»: тот же гейт, но origin ответил не
│  │  │                          2xx — ADR 0055, обновление),
│  │  │                          not-found, server-error
│  │  │                          (styleguide,
│  │  │                          components удалены — ADR 0011/0012);
│  │  │                          v2: login (ADR 0043), forgot-password,
│  │  │                          calendar/month/year (заглушки с одним
│  │  │                          заголовком), profile (имя, роль, выход
│  │  │                          — ADR 0044), admin-new-user (создание
│  │  │                          аккаунта, только для роли admin)
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
│  │  │                          0029/0030/0031, обновление — сейчас не
│  │  │                          срабатывает ни на одном экране, см.
│  │  │                          раздел про группы маршрутов);
│  │  │                          bottom-nav (стеклянная панель, вариант N2
│  │  │                          «дуотон»: высота 68, радиус 32, 4px над
│  │  │                          safe-area, активный пункт — заливка самой
│  │  │                          иконки на 15% --primary, без подложки;
│  │  │                          BottomNav серверный,
│  │  │                          BottomNavItem — единственный клиентский
│  │  │                          лист, model/nav-items.ts — порядок
│  │  │                          пунктов, model/is-nav-item-current.ts —
│  │  │                          сравнение с тестами; ADR 0012,
│  │  │                          обновление). Формы v2 — тоже виджеты, по
│  │  │                          образцу waitlist-form: sign-in-form,
│  │  │                          password-reset-form, create-user-form —
│  │  │                          каждая связывает хук своей фичи с полями
│  │  │                          shared/ui и является единственным
│  │  │                          клиентским островом на своём экране
│  │  │                          (ADR 0049, обновление)
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
│  │  │                          useNetworkStatus, useRefreshOnReconnect и
│  │  │                          NetworkReconnectFeedback — сверять по index.ts), push-
│  │  │                          notifications (подписка на Web Push после записи в
│  │  │                          вайтлист: ui/EnableWaitlistNotifications, lib/
│  │  │                          subscribe-to-push.ts, Server Action
│  │  │                          api/register-push-subscription-action.ts со своим
│  │  │                          лимитером; зависимость `web-push`).
│  │  │                          v2: sign-in (схема, Server Action,
│  │  │                          классификация ошибок auth, лимитер — 3
│  │  │                          неверных пароля на IP за 15 минут),
│  │  │                          request-password-reset (пока пишет
│  │  │                          запрос в лог, ADR 0043), sign-out
│  │  │                          (Server Action + клиентская кнопка с
│  │  │                          диалогом подтверждения — без JS выход
│  │  │                          не работает), welcome-toast (приветствие по
│  │  │                          имени после входа), create-user
│  │  │                          gate-recheck (RecheckGateOnRestore —
│  │  │                          перезагрузка страницы при возврате из
│  │  │                          bfcache, чтобы proxy заново решил, где
│  │  │                          человеку быть; ADR 0054),
│  │  │                          create-user (создание аккаунта админским клиентом;
│  │  │                          действие само проверяет роль)
│  │  ├─ entities/                session (getSessionClaims — кто вошёл,
│  │  │                          для серверных компонентов; getClaims, а
│  │  │                          не getUser — ADR 0044),
│  │  │                          password-field (поле пароля с
│  │  │                          кнопкой-глазком на @shadcn/input-group —
│  │  │                          ADR 0049)
│  │  └─ shared/
│  │      ├─ ui/                 shadcn/ui компоненты, плюс TextLink
│  │      │                      (тихая ссылка, клиентская навигация как
│  │      │                      у LinkButton — ADR 0024/0029;
│  │      │                      ScreenFooter, который её использует,
│  │      │                      сам — в widgets/screen-footer, не
│  │      │                      здесь), ListRow/ListCard/PaceCard/
│  │      │                      SectionLabel (глупая вёрстка списков
│  │      │                      about-экрана, без домена — ADR 0029),
│  │      │                      CardTextField (текстовая строка карточки
│  │      │                      полей, тот же API, что у PasswordField —
│  │      │                      ADR 0013, обновление) и
│  │      │                      SectionIndex/NumberedSection/CookieTable
│  │      │                      (вёрстка numbered-document экрана
│  │      │                      privacy — чип-якоря, раздел с номером,
│  │      │                      таблица cookies с пилюлей статуса, без
│  │      │                      домена — ADR 0031); из реестра shadcn
│  │      │                      добавлены sonner (тосты — ADR 0046),
│  │      │                      alert (светлая плашка со знаком),
│  │      │                      input-group, radio-group — у всех
│  │      │                      вендорных файлов кольца фокуса/ошибки
│  │      │                      вырезаны в исходнике (ADR 0013)
│  │      ├─ lib/access/          classifyAccess + тесты (vitest) — ADR 0016
│  │      ├─ lib/auth/            parseSessionClaims (zod-разбор claims),
│  │      │                       hasRole, resolveGate (весь гейт v2 как
│  │      │                       чистая функция — ADR 0044/0045),
│  │      │                       createAccountPasswordSchema (правила
│  │      │                       пароля, общие для входа и создания
│  │      │                       аккаунта); всё с тестами
│  │      ├─ lib/display-name/    getInitials — буквы вместо аватара
│  │      │                       (+ тесты)
│  │      ├─ lib/forms/           useActionForm — механика формы, общая
│  │      │                       для всех: схема, перенос серверных
│  │      │                       ошибок в поля, отказ от второго
│  │      │                       сабмита, тост на недоступный бэкенд.
│  │      │                       Реакцию на успех не берёт — она у
│  │      │                       каждой формы своя (ADR 0013,
│  │      │                       обновление)
│  │      ├─ lib/action-failure/  reportActionFailure — что Server Action
│  │      │                       делает с неожиданным исключением:
│  │      │                       целиком в Sentry, строкой в лог без
│  │      │                       персональных данных. Отдельный сегмент,
│  │      │                       а не экспорт из lib/observability:
│  │      │                       модуль `server-only`, а тот бочонок
│  │      │                       тянет клиент (ADR 0046, обновление)
│  │      ├─ lib/welcome-flag/    одноразовый флаг «поздороваться после
│  │      │                       входа», читается и сразу стирается
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
│  │      ├─ lib/email/           createAccountEmailSchema — что в этом
│  │      │                       проекте считается адресом аккаунта
│  │      │                       (домен jw.fenko.dev, печатаемый ASCII),
│  │      │                       общая для формы входа и сброса пароля;
│  │      │                       isDisposableEmail — проверка домена на
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
│  │      │                       `/privacy`, `/login`,
│  │      │                       `/forgot-password`, `/calendar`,
│  │      │                       `/month`, `/year`, `/profile`,
│  │      │                       `/admin/users/new`, `/access/*`),
│  │      │                       `as const` + узкий тип `AppRoute` —
│  │      │                       ADR 0030/0031;
│  │      │                       route-policy.ts — чего каждый из этих
│  │      │                       адресов требует (щит устройства,
│  │      │                       сессия, роль, запуск со значка), одна
│  │      │                       карта `Record<AppRoute, RoutePolicy>`:
│  │      │                       новый маршрут не компилируется, пока
│  │      │                       не классифицирован, и всё под `/admin`
│  │      │                       закрыто по префиксу — ADR 0050;
│  │      │                       api-routes.ts — пути HTTP-эндпоинтов
│  │      │                       (WEB_API_ROUTES — собственные Route
│  │      │                       Handler'ы; SB_API_ROUTES удалён вместе
│  │      │                       с пробником на /day — его единственным
│  │      │                       потребителем); здесь, а не в
│  │      │                       shared/api, потому что у констант нет
│  │      │                       среды выполнения — ADR 0034
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
│  │                             migrations/: waitlist_signups + функция
│  │                             join_waitlist — ADR 0033 (таблица
│  │                             закрыта полностью: RLS включён, политик
│  │                             нет, grants отозваны, наружу выдан
│  │                             только execute на функцию роли anon);
│  │                             push_subscriptions носит колонку-владельца
│  │                             user_id (ADR 0051: одно устройство — одна
│  │                             строка, владельцем может быть запись
│  │                             вайтлиста, аккаунт или оба сразу);
│  │                             v2 — profiles + user_roles + триггер
│  │                             handle_new_user (ADR 0043),
│  │                             custom_access_token_hook (роль в токене
│  │                             — ADR 0044), deleted_at во всех
│  │                             таблицах (ADR 0047), явные deny-all
│  │                             политики (ADR 0048).
│  │                             tests/ (pgTAP, `pnpm db:test` — проверяют
│  │                             именно модель доступа: что anon может
│  │                             записаться через функцию и не может
│  │                             прочитать таблицу, что свой профиль
│  │                             читается, а чужой нет), functions/health,
│  │                             seed.sql — два тестовых аккаунта
│  │                             (admin@ и user@jw.fenko.dev, пароль
│  │                             TestPass1!), только для локальной БД
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
- **Группы слайсов.** Папка внутри слоя, у которой НЕТ своего
  `index.ts`, — не слайс, а контейнер слайсов; так в `pages` живут
  `access/` (три щита устройства) и `network/` (`offline`,
  `service-unavailable`). Группа завелась не из вкуса: `steiger`
  потребовал сгруппировать слой, перешагнувший 20 слайсов. Группировать
  по существующему признаку (общий префикс адреса, один и тот же
  вызывающий), а не ради счётчика, и не давать группе `index.ts` —
  иначе она сама становится слайсом.
- Строгое соответствие проверяется линтером `steiger`
  (`web/steiger.config.ts`, запускается через `pnpm lint`).
- **Правила FSD не отключаются под конкретную папку.** Единственное
  выключенное правило — `fsd/insignificant-slice`, и у него в конфиге
  записано решение владельца с причиной. Попытка выключить
  `fsd/excessive-slicing` для `pages` была отвергнута владельцем
  (2026-10-20): «так потом ещё где-то отключим, надо следовать их
  логике». Правило, которое мешает, либо выполняется (у
  `excessive-slicing` лекарство — группы, см. выше), либо отключается
  отдельным решением с ADR, а не строкой в конфиге по ходу дела.
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

**Пять иконок навигации и экрана «О приложении» — рисунки Tabler Icons**
(MIT): `calendar-week`, `calendar-month`, `chart-bar`, `user`, `plus`.
Скопированы из `icons/outline` **как компоненты**, а не подключены
пакетом: `@tabler/icons-react` — зависимость в бандле ради пяти файлов, а
правило «иконка это свой компонент с `size`/`className`/`currentColor`»
остаётся в силе. Геометрия сохранена как у источника (сетка 24, обводка
2), в каждом файле записано имя исходной иконки. Меню и `/about`
используют одно семейство: два набора, различающиеся только местом
применения, — это то, от чего ушли.

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
каждый в своём файле, без общего барреля (как `button.tsx`/`list-card.tsx`, а
не как `icons/` со своим `index.ts`). Полный инвентарь с параметрами —
ADR `docs/decisions/0012-component-library.md` (там же — когда и почему
удалена витрина `/components`).

**Готовые блоки форм и экранов, появившиеся на ревью релиза** (ADR 0012,
обновление 2026-10-14): `ActionForm` (сам `<form noValidate>` с
`preventDefault`), `SubmitButton` (кнопка отправки со всеми правилами
блокировки и крутилкой), `Notice` (светлая плашка с иконкой, тона
`positive`/`negative` — именованный вариант `@shadcn/alert`, который
проект и так использовал везде) и `ScreenIntro` (`AppMark` над
`TextBlock` — шапка `/login` и `/forgot-password`). Новая форма
собирается из них; `<form>` и кнопка отправки, написанные руками, —
повод посмотреть, чего не хватает в общем, а не копировать.

Единицы вроде `scroll-mt-screen-header` и `screen-header-sticky` —
утилиты Tailwind в `globals.css`, а не классы на месте: высота липкой
шапки и отступ якорей внутри `NumberedSection` связаны, и эту связь не
видят ни `tsc`, ни линтер.

**Полное описание визуального языка — [`DESIGN.md`](./DESIGN.md)**:
палитра и семантические токены, типографическая шкала, радиусы, тень,
устоявшиеся отступы, каркас экрана, инвентарь `shared/ui` с ответом
«когда что», список запретов и чеклист перед вёрсткой. Раздел ниже —
краткая выжимка; при расхождении верить коду, а затем `DESIGN.md`.

**Порядок поиска компонента при работе над экраном: сначала
`shared/ui` (готовый компонент проекта) → потом shadcn/ui
(`pnpm dlx shadcn@latest add ...`, если аналога в `shared/ui` нет) → и
только если ни того, ни другого нет или shadcn-аналог не подходит по
дизайну — свой компонент, с обоснованием в ADR.**

**Второй шаг обязателен и проверяется командой, а не памятью.** Прежде
чем писать новый компонент, надо убедиться поиском по реестру, что
готового нет:

```bash
npx shadcn@latest search @shadcn -c web -q "<имя>"   # есть ли такой
npx shadcn@latest view @shadcn/<имя> -c web          # что он тянет
```

`-c web` обязателен: без него команда падает с `monorepo_root`, потому
что запускается из корня воркспейса. `view` показывает `dependencies` и
`registryDependencies` — по ним и решается, подходит ли готовое: пункт
без новых npm-зависимостей почти всегда лучше своего кода, а пункт,
тянущий лишние пакеты, может и не подойти, но это должно быть
**записанным** решением, а не следствием того, что никто не посмотрел.

Искать надо по одному слову: многословный запрос (`"input group
field"`) ничего не находит, а `"input-group"` находит.

Так уже ошиблись дважды, и оба раза цена была реальной: свой тост
написан при существующем `@shadcn/sonner`, а кнопка-глазок в
`PasswordField` — при существующем `@shadcn/input-group` с
`InputGroupAddon align="inline-end"`, который не тянет ни одной новой
зависимости. Экраны собираются ИЗ
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
  списком над формой: `CardField` (строка внутри `FieldCard`) и
  `PasswordField` (`entities/password-field`) принимают проп
  `errors?: {message?: string}[]` (напрямую подходит
  `fieldState.error && [fieldState.error]` из `Controller`) и сами
  рендерят штатный shadcn `FieldError` (`shared/ui/field.tsx`: сворачивает
  несколько ошибок в `<ul className="list-disc">/<li>`) под контролом со
  своим `id` (`useId`), связанным через `aria-describedby`. `invalid`
  выводится из `errors` внутри компонента, отдельным пропом наружу не
  передаётся. **Колец нет нигде** — ни при фокусе, ни при ошибке:
  владелец их убрал, и они вырезаны в исходниках `input.tsx`,
  `input-group.tsx`, `radio-group.tsx`, а не перекрыты сверху (ADR 0013,
  обновление 2026-10-06). Ошибка внутри карточки полей видна красным
  текстом самого поля и сообщением под ним; вендорный файл из реестра
  shadcn — первое место, куда кольца возвращаются, при каждом
  `shadcn add` это надо проверять. Кнопка
  отправки — `isDisabled={Object.keys(formState.errors).length > 0}`
  (react-aria `isDisabled`, не `disabled`): до первого submit форма
  невалидирована, ошибок нет — кнопка активна; после первого submit
  блокируется, пока есть хоть одна ошибка.
- **Один `<form>` — один виджет.** Блок, связывающий хук фичи с полями
  `shared/ui`, живёт в `widgets/` (`waitlist-form`, `sign-in-form`,
  `password-reset-form`, `create-user-form`), а экран в `pages/` его
  только размещает и остаётся серверным компонентом с
  `getTranslations`. Разметка формы прямо в экране — повод перенести, а
  не дополнять (ADR 0049, обновление).
- **Механика формы — не в хуке фичи, а в `useActionForm`**
  (`shared/lib/forms`): схема (та же, что на сервере), перенос серверных
  ошибок полей в `react-hook-form`, отказ от второго сабмита, пока первый
  в полёте, и тост на недоступный бэкенд. `useActionState` остаётся на
  стороне вызова — одна строка, зато без приведения типов в общем куске
  (ADR 0013, обновление 2026-10-12). Реакция на успех у каждой формы
  своя и живёт в её хуке. Новый хук формы, который снова пишет эффект
  «залить серверные ошибки в поля», — повод посмотреть, чего ему не
  хватает в общем, а не копировать.
- **Второй сабмит отбивается в коде, а не блокировкой кнопки.** Кнопка
  `isDisabled` при `isPending` — этого мало: Enter в поле отправляет
  форму мимо кнопки. На входе два запроса списывались с одного бюджета в
  три попытки, то есть одно нажатие стоило двух. Сейчас проверка внутри
  `useActionForm`, у `PillForm` — своя, та же (ADR 0013, обновление).
- **Что показывать тостом, а что в форме.** На экране остаётся только
  то, с чем человеку надо что-то сделать: занятый адрес, превышение
  лимита, неверные креды. Недоступность бэкенда и успех — тосты
  (`showToast` из `shared/ui/sonner`), они ничего не требуют и уходят
  сами (ADR 0046).
- **Экран подстраивается под клавиатуру через `min-h-app`, не
  `min-h-dvh`** (ADR 0053). iOS не уменьшает layout viewport при открытии
  клавиатуры — `100dvh` до и после одно и то же число, и экран на
  `min-h-dvh` спокойно раскладывает форму туда, где уже клавиатура.
  `interactive-widget=resizes-content` и `env(keyboard-inset-height)` —
  только Chromium, так что высота **измеряется**: `KeyboardInsetSync`
  (`app/layout/`) пишет разницу `innerHeight − visualViewport.height` в
  `--keyboard-inset`, а `@utility min-h-app` её вычитает. Новый экран с
  полем ввода, который сам назначает себе высоту, берёт `min-h-app`;
  экран внутри route group высоту не назначает вовсе — её уже назначил
  layout. Нет `visualViewport` или нет JS — действует `0px`, то есть
  прежнее поведение.
- **Автозаполнение не красится браузером.** Одно правило в
  `globals.css` (`input:is(:autofill, :-webkit-autofill)`) закрывает
  браузерный фон внутренней тенью и задаёт `-webkit-text-fill-color` —
  переопределить `background-color`/`color` нельзя, они объявлены с
  `!important` в UA-таблице. Правило **намеренно вне `@layer`** (утилита
  `shadow-none` на полях иначе его выключит). Поле на нестандартной
  поверхности объявляет `--autofill-surface`/`--autofill-ink` само
  (пример — `PillForm`), новых правил на каждый экран не нужно.
  Подробности — ADR 0013, обновление 2026-10-07.
- **Заголовки** — один `h1` на экран/страницу, без пропуска уровней;
  компоненты с текстом заголовка (`TextBlock`, `HeroCard`, `ListRow`,
  `SectionLabel`) принимают `as`/`titleAs` для уровня.
- **Лендмарки** — ровно один `<main>` на экран, навигация — `<header>`.
  Каркас в `shared/ui` сейчас **один** — `CenteredState` (он и даёт
  `<main>`); `TopAndBottomState` и `ScrollState` числились здесь, но в
  `web/src/shared/ui/` их нет и никогда не было — все экраны собраны на
  `CenteredState`, при необходимости с `className`. Экран с шапкой
  (`/about`, `/privacy`, `/admin/users/new`) ставит `<header>` **рядом**
  с `<main>`, а не внутрь него, поэтому фон и высота экрана уезжают на
  обёртку, а `CenteredState` получает `fill`.
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

## Доступ v2 — iPhone в Safari, установленное приложение, сессия

Три щита подряд, в этом порядке, и каждый отвечает за своё. Порядок
несущий: устройство проверяется до сессии, поэтому с компьютера нельзя
даже увидеть экран входа.

1. **Устройство** — `web/proxy.ts`, чистая функция `classifyAccess()`
   по `User-Agent` (ADR 0016/0017). Все, кроме iPhone Safari, уходят на
   `/access/*`.
2. **Сессия** — тот же `proxy.ts`, чистая функция `resolveGate()`
   (`shared/lib/auth`, покрыта тестами). Читает claims из cookie через
   `getClaims()` (ADR 0044) — локальная проверка подписи, без обращения
   к auth-серверу.
3. **Запуск со значка** — только клиент, `LaunchGate` (ADR
   0017/0019/0028). Сервер `display-mode` не видит.

`LAUNCH_MODE` удалён (ADR 0045): переключателя «coming-soon / app»
больше нет, `/soon` стал публичным лендингом, а что показать на `/day`,
решает наличие сессии.

| Адрес | Экран | Кто видит |
|---|---|---|
| `/` | редирект на `/day` | — |
| `/day` | экран дня (пока заглушка с заголовком) | сессия есть |
| `/calendar`, `/month`, `/year` | заглушки с заголовком | сессия есть |
| `/profile` | имя, роль, ссылки, выход (ADR 0044) | сессия есть |
| `/whats-new` | что добавила каждая версия, для человека (ADR 0057) | сессия есть |
| `/admin/users/new` | создание аккаунта | сессия есть **и** роль `admin` |
| `/login` | вход по email и паролю (ADR 0043) | сессии нет; с сессией — редирект на `/day` |
| `/forgot-password` | запрос сброса пароля | то же, что `/login` |
| `/soon` | публичный лендинг с вайтлистом | кто угодно, в том числе в обычной вкладке |
| `/install` | установка — bottom sheet с каруселью из 5 шагов | iPhone Safari, обычный браузер |
| `/about` | об приложении (ADR 0029) | кто угодно на iPhone Safari, в том числе без сессии |
| `/privacy` | конфиденциальность и cookies (ADR 0031) | то же, что `/about` |
| `/access/ios-browser` | «Доступно только в Safari» | iPhone, не Safari |
| `/access/android` | «Приложение доступно только для iOS» | любой Android |
| `/access/desktop` | «Доступно только с телефона» | десктоп, ноутбук, любой планшет (включая iPad с UA macOS) |
| `DEV_MODE=true` | всё открыто, все адреса выше — напрямую | — |

**Чего требует каждый адрес — одна типизированная карта**
`ROUTE_POLICY` (`shared/config/route-policy.ts`, ADR 0050). У каждого
маршрута четыре признака: `deviceShield` (классифицирует ли proxy
User-Agent), `session` (`any`/`required`/`forbidden`), `adminOnly`,
`launchGate` (нужен ли запуск со значка). `proxy.ts`, `resolveGate` и
`useLaunchGate` своих списков больше не держат — каждый спрашивает
`resolveRoutePolicy`.

Тип `Record<AppRoute, RoutePolicy>` — это и есть защита от «забыли»:
новая запись в `routes.ts` **не компилируется**, пока её не
классифицировали. До этого на вопрос отвечали три независимых списка, и
каждый открывался наружу при ошибке — `/admin/users/new` вышел в
`release/v2` отсутствующим в списке LaunchGate и открывался в обычной
вкладке Safari.

Два правила карты, которые стоит знать до чтения кода:

- **всё под `/admin` требует роль `admin` по префиксу**, даже если такого
  пути ещё нет в `routes.ts`: экран, добавленный под `/admin`, закрыт с
  первого запроса, а не с того коммита, где про него вспомнили;
- у `/access/*` щит устройства **выключен** — щит ведёт именно туда, и
  включённый гонял бы заблокированное устройство по кругу.

Не-админ с сессией на админском пути уходит на `/profile`, а **не** на
`/login`: он аутентифицирован, и `/login` вернул бы его обратно своим же
правилом — получился бы цикл. Все сочетания закреплены тестами, включая
инварианты самой карты (`route-policy.test.ts`).

Адресу, которому не нужна ни сессия, ни её отсутствие (`/soon`,
`/install`, `/about`, `/privacy`, `/access/*`), proxy сессию **не
читает** вовсе: терять нечего — следующая закрытая навигация обновит
токен до отрисовки, — а на проекте с симметричной подписью это экономит
обращение к auth-серверу на каждой публичной странице.

**Роль не защищает сама по себе.** Гейт закрывает навигацию, но Server
Action — отдельная публичная ручка, доступная любому, кто умеет составить
запрос. Поэтому каждое действие, доступное только админу, проверяет роль
само (`features/create-user/api/create-user-action.ts` — образец), а
экран проверяет ещё раз перед отрисовкой. Три проверки, три разные вещи:
навигация, данные, бессмысленная форма.

**И токену админское действие не верит.** Токен живёт час (`jwt_expiry`)
и за этот час устаревает дважды: снятая роль в нём ещё старая, а после
бана он **продолжает работать против базы** — проверено на живой БД:
GoTrue отвечает 403, а PostgREST на тот же токен отдаёт 200, потому что
проверяет только подпись (ADR 0044/0047, обновления). Для навигации это
осознанная цена, для выдачи аккаунта — нет, поэтому создание аккаунта
спрашивает `getUser()` (жива ли сессия) и перечитывает `user_roles` (та
ли роль). Правило: **критичная мутация перечитывает источник истины,
навигация — нет.**

**Четвёртый щит — возврат страницы из кэша браузера** (ADR 0054).
Три щита выше работают на запросе, а восстановление документа из bfcache
запроса не делает вовсе: страница возвращается такой, какой была, вместе
с разметкой, отрисованной до того, как сессия изменилась. Поэтому экраны,
ответ для которых зависит от сессии, монтируют `RecheckGateOnRestore`
(`features/gate-recheck`): он слушает `pageshow` и при `event.persisted`
делает `window.location.reload()` — настоящий запрос, который снова
проходит через `proxy.ts`. Сейчас подключён на `/login`,
`/forgot-password` и в layout группы `(with-bottom-nav)`. **Правило:
маршрут с `session: "required"` или `session: "forbidden"` в
`ROUTE_POLICY` обязан его монтировать**; маршруту с `session: "any"` он
не нужен. Симптом, с которого всё началось: войти, свайпнуть назад — и
снова виден экран входа.

### Группы маршрутов и футер

Две route group'ы, обе только про layout — адреса не меняют:

- **`app/(with-bottom-nav)/`** — `/day`, `/calendar`, `/month`, `/year`,
  `/profile`, `/admin/users/new`. Layout подключает `BottomNav`
  (`widgets/bottom-nav`) и резервирует место под панель: она `fixed`,
  вне потока, и сама ничего подвинуть не может.
- **`app/(with-footer)/`** — только `/soon` и `/install`. Футер
  (`ScreenFooter`, `widgets/screen-footer/`) с двумя тихими ссылками,
  «About» и «Privacy & cookies». Раньше группа покрывала и `/`, `/day`,
  `/about`, `/privacy`; владелец её сузил (ADR 0045, обновление
  2026-10-08) до экранов, до которых человек доходит **до** входа. Внутри
  приложения те же ссылки — на `/profile`, а у `/about` и `/privacy` своя
  кнопка «назад».

`ScreenFooter` (серверный компонент) рендерит список из
`widgets/screen-footer/model/footer-links.ts`, а не хардкодит `<TextLink>`
под каждую ссылку — третья добавится правкой списка (ADR 0029/0031).
Подсветка активной ссылки (`FooterLink`, `usePathname`, `aria-current`)
сейчас не срабатывает ни на одном экране: `/about` и `/privacy` футера не
показывают. Код оставлен — он верен и понадобится, как только в футере
появится ссылка на экран, который футер показывает.

`AboutScreen`/`PrivacyScreen` вне обеих групп, поэтому высоту экрана
резервируют сами (`min-h-dvh` на корневом `<div>`, `flex-1` на `<main>`
внутри). Экран внутри группы, наоборот, `min-h-dvh` ставить **не должен**
— layout уже его поставил, и второй даёт лишнюю прокрутку ровно на
высоту панели.

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
2. Для iPhone Safari читает сессию и применяет `resolveGate()` —
   `redirect` 307 на `/login`, `/day` или `/profile`, смотря чего не
   хватает. Обновлённые cookie сессии переносятся и на редирект: иначе
   человека, которому только что обновили токен, выкинул бы тот самый
   редирект. Никаких `rewrite` здесь больше нет — связка
   `LAUNCH_MODE` + подмена `/day` ↔ `/soon` удалена вместе с самим
   `LAUNCH_MODE` (ADR 0045).
3. `/soon`, `/install`, `/about`, `/privacy`, `/access/*` — открываются
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
решает — на экранах приложения (признак `launchGate` в `ROUTE_POLICY`,
`shared/config/route-policy.ts`: `/`, `/day`, `/login`,
`/forgot-password`, `/calendar`, `/month`, `/year`, `/profile`,
`/admin/users/new`; `/soon` там больше нет — он публичный лендинг, ADR
0045; свой список путей хук держал до ADR 0050, и именно из него выпал
админский экран) без standalone уводит на `/install`
через `window.location.replace` (не `next/navigation`, полная навигация
нужна, чтобы хук смонтировался заново на странице назначения — App
Router иначе держит корневой layout, а с ним и этот же экземпляр
`LaunchGate`, смонтированным между маршрутами), на `/install` при
standalone — на `/day`, иначе переводит `phase` в `"exiting"` (или сразу
в `"ready"` при `prefers-reduced-motion: reduce`) — но не сразу, а
выдержав `--shell-splash-dwell` **от первой отрисовки**:
`resolveSplashDelay` (`features/launch-gate/model/`, чистая функция с
тестами). Отсчёт именно от отрисовки, а не от начала навигации
(`performance.now()`), — на этом был баг: от навигации выдержка на
телефоне выходила нулевой, и заставка уходила, не успев приехать (ADR
0019, обновление 2026-10-14). Редиректы выдержку не ждут. Экран загрузки
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

**Как выглядит заставка и почему там нет крутилки** (ADR 0019,
обновление 2026-10-13). `LaunchLoading` — это `AppMark size={88}
tone="solid" elevated` плюс название приложения, тот же знак, что на
`/install` и `/soon`. Крутилки нет намеренно: она означает «ждите», а
ждать нечего — решение принимается в микротаске, и крутилка успевала бы
мелькнуть, читаясь как сбой. **Вся раскадровка — пять переменных в одном блоке `:root` в
`globals.css`** (`--shell-splash-mark-duration`,
`--shell-splash-wordmark-delay`, `--shell-splash-wordmark-duration`,
`--shell-splash-dwell`, `--shell-transition-duration`); там же
комментарий с порядком событий. Второй копии в TypeScript нет — выдержку
хук читает из CSS через `getComputedStyle`. **Инвариант: выдержка должна
быть длиннее появления**, иначе заставка начинает уходить, не успев
приехать (так и было сломано). Появление знака и названия — чистый CSS
(`shell-mark-enter`/`shell-wordmark-enter`), потому что оверлей
отрисован сервером и анимация стартует с первой отрисовки, до
гидратации; по этой же причине `prefers-reduced-motion` для них —
настоящее правило, а не защита в глубину.

**Крутилки ожидания в приложении нет нигде** (ADR 0055). Состояние
«проверяю связь» раньше показывало `NetworkChecking` — крутилку вместо
содержимого; этот компонент удалён, а `NetworkGate` рисует приложение,
пока проба идёт. Причина: проба при `navigator.onLine === false`
отвечает немедленно, поэтому по-настоящему офлайновое устройство попадает
на `OfflineScreen` в пределах тика, а пятисекундный таймаут относится
только к редкому случаю «сеть есть, origin молчит» — держать ради него
всех перед пустым экраном было плохим разменом. Новый экран ожидания —
повод сначала перечитать ADR 0055, а не добавлять второй такой.

При `DEV_MODE=true` `LaunchGate` вообще не подключается — `root-layout.tsx`
(решение на сервере, `env.DEV_MODE`, `shared/config`) оборачивает
`children` только в `Providers` и `NetworkGate`: ни щита по
`display-mode`, ни экрана загрузки `LaunchGate`, ни его задержки.
`NetworkGate` же подключён **в обеих ветках**, в том числе под
`DEV_MODE`: если связи нет — показывает `OfflineScreen` (см. «Сеть и
офлайн» ниже), во всех остальных состояниях — приложение. Ожидания
пробы не видно: первая отрисовка — это сам экран. При
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

**`DEV_MODE`** (`envs/*.local.env`, схема — `shared/config/env.ts`,
булево, по умолчанию `false`) отключает **оба** щита сразу — и
серверный (`proxy.ts` целиком пропускает запрос) и клиентский
(`root-layout.tsx` не подключает `LaunchGate` вовсе, см. выше). Читается
на сервере — значение запекается в разметку на этапе сборки, поэтому
смена `DEV_MODE` требует пересборки (`pnpm build`), не только перезапуска
сервера с другим значением переменной окружения. Раньше здесь было
исключение: `/day` рендерился динамически и подхватывал значение сразу —
но только потому, что на нём висел пробник связи с `fetch`
(`cache: "no-store"`). Пробник удалён вместе с заглушкой экрана, и `/day`
теперь статический, как остальные. Динамическими остаются `/profile`
(читает cookies сессии) и Route Handler'ы.
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
**только** адреса, у которых в `ROUTE_POLICY` стоит `deviceShield`
(ADR 0050) — а остальные пропускает как есть. Поэтому
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
  (`features/network-status`): `checking` → `online`/`offline`/
  `unavailable`. **Три исхода, не два** (ADR 0055, обновление
  2026-10-16): «браузер никуда не дотянулся» (`offline` — выключенный
  радиомодуль, таймаут, отказ `fetch`) и «наш origin ответил, что он
  сломан» (`unavailable` — ответ не 2xx: 500/502/503/404) — разные факты,
  и человеку они говорят разное. Первый показывает `OfflineScreen`
  («проверьте Wi-Fi»), второй — `ServiceUnavailableScreen`
  (`pages/service-unavailable`, «сломалось у нас, не у вас»). Раньше при
  502 от собственного сервера человеку предлагали проверить Wi-Fi,
  который в полном порядке. Опрос раз в 10 с и `router.refresh()` при
  возврате работают в **обоих** нерабочих состояниях, а тост о возврате
  говорит ту строку, которая правда (`connectionRestored` или
  `serviceRestored`). **Решения вынесены из хуков** в
  `model/network-state.ts` (`statusForOutcome`, `isUsable`,
  `shouldPoll`, `hasRecovered`, `resolveReconnectToast`) и покрыты
  тестами, как `resolveGate` и `isNavItemCurrent`; у хуков остались
  таймеры, слушатели и состояние. Какой экран показать, `NetworkGate`
  берёт из полной карты `Record<NetworkStatus, …>`, а не цепочкой
  тернарников: новый статус не скомпилируется молча. Проба —
  `fetch` на `/api/v1/health` (`app/api/v1/health/route.ts`, ответ 204)
  **с cookie** (`credentials: "same-origin"` — ADR 0055, обновление):
  вопрос в том, дотягивается ли браузер до origin так, как он делает это
  всегда, а всё остальное в приложении ходит с cookie. Запрос без них на
  закрытом стенде Vercel получает 302 на SSO, `fetch` отклоняется
  межсайтовым редиректом, и приложение целиком подменялось экраном «нет
  связи» при живом сайте в той же вкладке;
  годится только ответ 2xx — `fetch` разрешается и на 500, и на 404, и на
  «captive portal» с 200, и сам по себе ничего не доказывает. Таймаут 5 с,
  повтор в офлайне раз в 10 с, тост «связь восстановлена» 3 с
  (`NETWORK_CONFIG`). Офлайн-экран — `pages/offline`.
  **Что эта проверка НЕ означает:** `/api/v1/health` намеренно не трогает
  ни Supabase, ни auth, поэтому «online» говорит только о том, что отдаёт
  сам origin. Supabase, упавший при живом origin, здесь не виден — об
  этом узнаёт первое же действие и показывает тост «не удаётся связаться
  с сервером» (ADR 0046). Опроса по таймеру в онлайне тоже нет: проба
  идёт на монтировании, на событии `online`, при возврате на вкладку и
  раз в 10 с — **пока офлайн**.
  Возврат связи (`offline → online`) дополнительно дёргает
  `router.refresh()` (`useRefreshOnReconnect`): простой, который стоит
  замечать, — это как раз простой длиннее часа, то есть длиннее жизни
  токена, и без этого человек продолжал бы смотреть на экран,
  отрисованный до аварии, пока не нажмёт что-нибудь. Перерисовка с
  сервера снова прогоняет proxy и чтение сессии, так что умершая сессия
  заканчивается редиректом на `/login`, а не неработающим экраном.
  Клиентское состояние (недонабранная форма) сохраняется — перезагрузка
  его бы потеряла. Отдельно от него
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
  (ADR 0033, обновление).
  **Вошедший человек включает уведомления переключателем на `/profile`**
  (`PushNotificationsToggle`, ADR 0051): состояние читается из браузера
  **без запроса разрешения** (`Notification.permission` +
  `pushManager.getSubscription()`) — запрос на iOS одноразовый, и тратить
  его на отрисовку переключателя нельзя; включение делает upsert по
  `endpoint` в ту же таблицу (одно устройство — одна строка, владельцем
  может быть запись вайтлиста, аккаунт или оба), выключение — настоящий
  `unsubscribe()` в браузере плюс `deleted_at`. Выход из аккаунта подписку
  **не** снимает: уведомления приходят независимо от того, вошёл человек
  сейчас или нет (решение владельца; на общем телефоне это значит, что
  выключить их можно только тем же переключателем или в настройках iOS).
  **При включении уходит тестовое уведомление** (`sendTestPush`): это
  единственное доказательство, которому можно верить — тост сказал бы
  лишь то, что и так видно по переключателю, а первое настоящее
  уведомление может прийти через неделю, когда связать его с этим
  нажатием уже нельзя. Ключи для отправки берутся из сохранённой строки,
  а не из запроса, и строка ищется по паре «этот человек + этот
  endpoint». При выключении не приходит ничего, поэтому там тост.
  Пара VAPID-ключей — `NEXT_PUBLIC_WEB_PUSH_VAPID_
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
- **Заголовки безопасности** — один блок `headers()` в `next.config.ts`
  на `source: "/(.*)"` (ADR 0056): `nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS и CSP **только** из
  `frame-ancestors`/`base-uri`/`form-action`. Полного CSP со `script-src`
  намеренно нет: он требует nonce через `proxy.ts`, а ошибка в такой
  схеме — белый экран на чьём-то телефоне и ничего в логах. До этого
  приложение не отдавало ни одного такого заголовка — нашли на ревью
  релиза. Проверять `curl -I` по развёрнутому адресу, не по коду: часть
  из них добавляет сама Vercel.
- **Лимиты частоты.** `shared/lib/rate-limit` (скользящее окно в памяти
  процесса, ADR 0026) используют `features/join-waitlist`,
  `features/push-notifications` и `features/sign-in` со своими числами.
  **Это препятствие, а не ограничение**, и считать иначе нельзя (ADR
  0026, обновление): счётчик свой у каждого инстанса Vercel и пропадает
  при переработке, за одним IP может сидеть весь мобильный оператор, а
  в IPv6 одному абоненту принадлежит целый /64. Подбор пароля на входе
  держит не он, а выключенная регистрация, правила пароля и собственные
  лимиты GoTrue в панели Supabase.

### Как посмотреть каждый экран локально

При `DEV_MODE=true` (`envs/web.local.env`) `proxy.ts` не участвует
вовсе — все адреса открываются напрямую, с любого устройства, без
подмены `User-Agent`/`display-mode`:

| Адрес | Что видно |
|---|---|
| `/day` | экран дня (заглушка с заголовком) |
| `/calendar`, `/month`, `/year` | заглушки с заголовком |
| `/profile` | имя, роль, ссылки, выход — **нужна сессия**, без неё уводит на `/login` |
| `/whats-new` | история версий для человека |
| `/admin/users/new` | создание аккаунта — **нужна сессия и роль admin**, иначе уводит на `/profile` |
| `/login` | вход по email и паролю |
| `/forgot-password` | запрос сброса пароля |
| `/soon` | Coming soon, публичный лендинг |
| `/install` | экран установки (bottom sheet) |
| `/about` | экран «О приложении» (ADR 0029) |
| `/privacy` | экран уведомления о конфиденциальности и cookies (ADR 0031) |
| `/access/desktop` | заглушка «только с телефона» |
| `/access/android` | заглушка «только iOS» |
| `/access/ios-browser` | заглушка «только Safari» |
| любой несуществующий адрес (например `/qwerty`), а также `/styleguide`, `/components` (удалены — ADR 0011/0012) | 404 |

**`DEV_MODE=true` снимает щит устройства и щит запуска со значка, но
НЕ сессию.** `proxy.ts` при нём пропускает всё, однако `/profile` и
`/admin/users/new` читают сессию сами и без неё уводят на `/login` — так
и задумано: экран, читающий личность, не должен зависеть от того, что
проверку выше не сломали. Чтобы посмотреть их локально, надо войти
по-настоящему: `pnpm db:reset` зальёт `seed.sql` с двумя аккаунтами
(`admin@jw.fenko.dev` и `user@jw.fenko.dev`, пароль `TestPass1!`).

Проверить отказ бэкенда: `pnpm db:stop` и попробовать войти — должен
появиться тост «Couldn't reach the server», а не ошибка поля и не экран
500. Готовая кнопка для того же — на `/sentry-example-error`, проба «6.
Backend unavailable».

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
`en-GB.json`). **Если `typecheck` ругается на ключ, который только что добавлен** —
удалите `web/tsconfig.tsbuildinfo` и повторите: типы берутся из
`typeof messages` (импорт JSON), и инкрементальный `tsc` не всегда
замечает правку этого файла. Стоило двух прогонов, прежде чем стало
понятно, что код верный.

Числа с разными формами — через ICU-плюрализацию
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
| `pnpm db:test` | pgTAP-тесты схемы (`supabase test db`) — модель доступа: `waitlist_signups` (ADR 0033), `profiles`/`user_roles` (ADR 0043), хук токена (ADR 0044), soft-delete (ADR 0047), фолбэки имени в `handle_new_user` (три ветки, две из них раньше валили создание аккаунта). Только локальная БД |
| `pnpm db:types` | Генерация TS-типов из локальной БД в `web/src/shared/api/supabase/database.types.ts` |
| `pnpm lint` | ESLint + `steiger` (проверка границ FSD) в `web/` |
| `pnpm typecheck` | `tsc --noEmit` в `web/` |
| `pnpm test` | `vitest run` в `web/` — чистые функции: `classifyAccess` (ADR 0016), `resolveGate`/`hasRole`/`parseSessionClaims` (ADR 0044/0045), инварианты `ROUTE_POLICY` (ADR 0050), схема входа, нейтральность ответа сброса пароля (ADR 0043), лимитер, `getInitials`, `buildRobots`/`buildSitemap`, `isDisposableEmail` и другие. Файлы лежат рядом с кодом (`*.test.ts` в `web/src`), число растёт — точный список даёт сам прогон |
| `pnpm build` | `next build` (Turbopack) в `web/` (с env из `envs/web.local.env`) |
| `pnpm db:login` / `db:link` / `db:push` / `functions:deploy` | Деплой в облачный Supabase — см. раздел ниже |
| `pnpm push:launch` | Рассылает уведомление о запуске всем подписчикам из `push_subscriptions`. Запускать только из корня: env лежит в `envs/backend.local.env`, а скрипт — в `backend/`, и связать их может лишь корневой `package.json` (как `wait:supabase`). Пара ключей VAPID в `envs/web.local.env` и `envs/backend.local.env` должна быть **одной и той же**, иначе push-служба отвергнет отправку |
| `pnpm push:version` | Объявляет новую версию владельцам аккаунтов (не вайтлисту), ссылка — `/whats-new`. **Без флагов ничего не отправляет**: печатает версию, число устройств и текст уведомления. Отправка — `pnpm push:version --send`. Версию берёт из корневого `package.json` и требует формы `x.y.z`. Листает подписки по ключу, поэтому не упирается в `max_rows`, в отличие от `push:launch` (ADR 0058; дефекты старого скрипта — ADR 0038). Идемпотентности нет — второй `--send` отправит второе уведомление, это записанный долг. `--only=<id>` шлёт одной строке: цифры — `push_subscriptions.id` (одно устройство), UUID — `user_id` (все устройства человека); названная строка отменяет фильтр «только аккаунты», но не `deleted_at`, а пустое совпадение — отказ, а не «ноль устройств». В экшене галочка подтверждения нужна **только** для рассылки всем: адресная отправка её не требует, иначе галочка превращается в ритуал и перестаёт охранять общую рассылку |

## Договорённости

- **Миграции Supabase — только через файлы в `backend/supabase/migrations/`.**
  Никаких ручных правок схемы через Supabase Studio без последующей
  миграции (`supabase db diff` / `supabase migration new`).
- **Таблица в схеме `public` закрывается полностью, доступ выдаётся
  функцией.** RLS включён, `revoke all ... from anon, authenticated`
  выполнен в той же миграции (grants выдаются новой таблице
  автоматически и политиками не отбираются), а наружу выдаётся
  `execute` на функцию с `set search_path = ''`. Плюс **одна явная
  deny-all политика** `for all to public using (false) with check
  (false)` с `comment on policy` (ADR 0048): она ничего не защищает —
  RLS с нулём политик уже запрещает всё, — но делает правило видимым в
  схеме и снимает предупреждение advisor'а «RLS enabled, no policy».
  Принимать её за замок нельзя: настоящий замок — отсутствие грантов и
  владение секретным ключом, а `service_role` и `postgres` обходят RLS
  целиком (`rolbypassrls`, проверено — ADR 0047). Исходный образец ADR
  0033 (`security definer` + `execute` для `anon`) заменён ADR 0037: для
  записей из доверенного сервера функции — `security invoker`, `execute`
  только у `service_role`, `anon` до них не дотягивается. Отступление
  от него — отдельное решение с отдельным ADR, не правка миграции
  «заодно». Модель доступа проверяется pgTAP-тестами
  (`backend/supabase/tests/`, `pnpm db:test`), а не на глаз.
- **`profiles` — осознанное исключение из правила выше (ADR 0043).**
  Это единственная таблица с настоящими RLS-политиками для
  `authenticated`: человек читает свою строку и правит в ней ровно
  `display_name`. Причина — у неё есть владелец, и `auth.uid()` его
  называет, тогда как у `waitlist_signups` владельца нет и «своих» строк
  там не бывает. Граница исключения: политики ограничивают строки, но не
  столбцы, поэтому право на запись сужено грантом
  `grant update (display_name)` — без него человек переписал бы себе
  `created_at` (проверено живой мутацией, ADR 0043). `user_roles` под
  исключение **не** попадает: роль не должна зависеть от того, кто её
  читает, таблица закрыта полностью, и наружу роль едет только в токене
  (ADR 0044).
- **Строки не удаляются: везде soft-delete (ADR 0047).** Каждая таблица
  получает `deleted_at timestamptz` (без значения по умолчанию — `null`
  означает «живая»). `delete` из приложения не делается: у `profiles`
  нет политики `delete`, у закрытых таблиц нет политик вовсе, а скрипты
  помечают строку удалённой, а не удаляют. **Уникальность объявляется
  частичным индексом** — `create unique index ... where deleted_at is
  null` вместо `unique`, иначе помеченная удалённой строка занимает
  значение навсегда. Если по такому индексу делается upsert, предикат
  надо повторить в `on conflict (col) where deleted_at is null`, иначе
  вставка падает с «no unique or exclusion constraint matching the ON
  CONFLICT specification». Фильтр `deleted_at is null` обязателен и в
  RLS-политиках, и в каждой RPC-функции, читающей таблицу без политик.
  «Удалить человека» = бан через Auth Admin API плюс `deleted_at` в
  `profiles`; строка в `auth.users` не удаляется никогда — она ссылочная
  цель для `profiles` и `user_roles` с `on delete cascade`.
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

## Версия продукта и экран «Что нового»

**Версия живёт в корневом `package.json`** (сейчас `2.0.0`) — продукт это
репозиторий, а `web/` и `backend/` лишь пакеты воркспейса. В сборку она
попадает через `next.config.ts` (`env: { APP_VERSION }`), код читает её
из `shared/config` (`APP_VERSION`), а не из `env.ts`: это факт о сборке,
а не настройка окружения (ADR 0057).

**Что делать при выпуске новой версии:**

1. Поднять версию в корневом `package.json`.
2. Дописать блок в `screens.whatsNew` (`en-GB.json`) и строки в
   `WhatsNewScreen` — иначе экран останется с прежней историей.
3. Заголовок в `CHANGELOG.md`.
4. После выката — объявить версию людям: workflow `version-push.yml`
   («Run workflow» или `gh workflow run version-push.yml`), сначала в
   режиме `dry-run`, затем `send` с галочкой и введённой версией (ADR
   0058). Порядок важен: уведомление ведёт на `/whats-new`, и до выката
   там ещё прежняя история.

   Локальные `pnpm push:version` / `--send` — **аварийный путь**, как и
   ручной `db:push`: они требуют продового секретного ключа в
   `envs/backend.local.env`, а он обходит RLS целиком.

Шаг 2 ничем не проверяется и держится на внимании — слабое место,
названное в ADR 0057.

**Точка «есть непрочитанное»** на строке `/whats-new` в профиле горит,
когда `profiles.whats_new_seen` не равна `APP_VERSION`. **Известный
дефект, принятый сознательно**: любой подъём версии зажигает её, даже
если рассказывать нечего. Починка и чего при этом делать нельзя — в ADR
0057, раздел «Известный дефект».

**Гасит её клиент, а не ревалидация, и за этим стоят два бага подряд.**
Навигация назад в Next 16 читает ранее отрисованный `/profile` из
клиентского BFCache **в обход проверки свежести** (в `readFromBFCache`
вместо текущего времени передаётся `-1`), поэтому точка оставалась
горящей при верной записи в базе — так её и нашёл владелец. Первая
правка выселяла эту запись `revalidatePath(routes.profile)`, и это
работало, но уход со страницы начал **мерцать**: выселение превращает
возврат назад в запрос к серверу, а `/whats-new` лежит вне группы
`(with-bottom-nav)`, так что в той же навигации пересобирается и layout
группы. Размен плохой — точка горела раз в релиз, мерцание было каждый
раз.

Сейчас: `MarkWhatsNewSeen` пишет `ministry.whats-new-seen` в
`localStorage` (до обращения к серверу и независимо от его исхода), а
точку рисует островок `WhatsNewUnreadDot`
(`features/whats-new`), читающий эту запись через
`useSyncExternalStore`. Горит ли точка, решает
`showsUnreadDot(serverSaysUnread, versionSeenOnThisDevice, current)` в
`shared/config/app-version.ts` — чистая функция с тестами на все шесть
случаев, включая тот самый баг и запись «из будущего» после отката
деплоя. Островок умеет только **убирать** точку, никогда не зажигать;
запись в `profiles.whats_new_seen` осталась — она для всех **остальных**
устройств человека. Отказ `localStorage` (приватное окно,
заблокированные данные сайта) уходит в Sentry на уровне `warning` с
`fingerprint`, а не проглатывается: иначе «точка гаснет только на полной
загрузке» не отличить от вернувшегося бага. Подробности, отменённый
запрет «не гасить клиентом» и чем он закрыт — ADR 0057, обновления
2026-10-16 и 2026-10-20.

**Правило: Server Action, после которого должен измениться ДРУГОЙ экран,
обязан его ревалидировать** — в силе; иначе человек увидит правду только
после полной перезагрузки. Это действие под него больше не попадает: оно
пишет строку, а экран, который её читает, узнаёт об этом сам. И вторая
половина того же правила, добытая мерцанием: **ревалидация маршрута
выселяет его клиентский кэш целиком**, поэтому её цена — пересборка того
экрана при следующем возврате назад. Там, где изменившееся есть чем
рассказать клиенту напрямую, это слишком дорогой инструмент.

## Ветки удаляются сразу после слияния

**Слили — удалили, в тот же момент, и локально, и на origin.** Не «когда
накопятся», не «потом разберу»: ветка, пережившая своё слияние, — это
приглашение однажды ответвиться от неё и воскресить код, который уже
переписан. На момент, когда это правило записывалось, в репозитории
лежало 42 слитых ветки, и отличить живую от мёртвой можно было только
командой.

```bash
# что уже влито в текущую релизную ветку и подлежит удалению
git branch --merged release/v2 | grep -vE '^\*|develop|master|release/'

# локально
git branch -d <ветка>

# на origin
git push origin --delete <ветка>
```

`-d` (не `-D`) — сознательно: он откажется удалять неслитое. Отказ `-d`
значит «проверь, прежде чем настаивать», и единственный случай, когда
уместен `-D`, — ветка, от которой осознанно отказались.

**Для PR это делает GitHub сам**, если включить в Settings → General →
Pull Requests → «Automatically delete head branches». Сейчас выключено
(`delete_branch_on_merge: false`). Включение закрывает только слияния
через PR; релизные ветки сливаются руками, и там удаление остаётся
ручным шагом.

### ⚠️ `master` и `develop` не удаляются НИКОГДА

Ни локально, ни на origin, ни «временно, пересоздам», ни в составе
команды, которая удаляет пачкой. То же относится к текущей релизной
ветке. Branch protection на этом тарифе GitHub включить нельзя (ADR
0052, раздел «Измерено»), то есть замка нет и единственная защита —
это правило.

Отсюда требование к любой массовой команде: **список удаляемого
фильтруется явно**, а не «всё, кроме той, на которой я стою».

```bash
git branch --merged release/v2 | grep -vE '^\*|develop|master|release/'
```

Три имени в `grep -v` — не украшение. Команда без них однажды выполнится
в момент, когда `develop` окажется слит в релизную ветку, и снесёт его.

Ещё не удаляется ветка, занятая рабочим деревом (`git worktree list`):
сначала убирается дерево (`git worktree remove <путь>`), иначе git
откажет — и это тот отказ, который стоит читать, а не обходить.

## CI: когда гоняются проверки

`ci.yml` (lint + typecheck + vitest) и `db-test.yml` (pgTAP + сверка
сгенерированных типов) запускаются **не на каждый коммит** — только на
слияниях, которые назвал владелец (ADR 0052; что именно эти проверки
проверяют — ADR 0039):

| База PR | Из какой ветки | Когда |
|---|---|---|
| ветка со словом `release` | любая | только при открытии/переоткрытии PR |
| `develop` | `release*` | открытие и каждый новый коммит |
| `master` | `develop`, `hotfix/*` | то же |
| всё остальное | — | не запускается |

Плюс `push` в `master` (проверяет **результат** слияния, а не ветку до
него) и `workflow_dispatch` — кнопка «Run workflow», которой
перепроверяют PR в релизную ветку после новых коммитов.

Условие стоит на job, а не в `on:`: `on:` не умеет разные типы событий
для разных базовых веток, а пропущенный по `if:` job раннер не занимает.

**Branch protection сейчас не включён и включить его нельзя:**
репозиторий приватный на бесплатном личном аккаунте, а GitHub отвечает
на запрос правил `403 Upgrade to GitHub Pro or make this repository
public`. Значит обязательность проверок — вопрос дисциплины, а не замка
(ADR 0052, раздел «Измерено»). Возвращаться к этому, когда появится
второй человек с правом записи.

**Ловушка, которую надо знать:** PR в релизную ветку проверяется один
раз, при открытии. Галочка на нём может быть устаревшей, поэтому эти
проверки сделаны обязательными в branch protection **только** для
`develop` и `master` — требовать её в релизной ветке значило бы иметь
замок, который выглядит закрытым и не закрыт. Сама настройка branch
protection живёт в Settings репозитория, а не в файлах — порядок и что
именно включать (и чего не включать) в ADR 0052, раздел «Что надо
включить руками в GitHub». Draft-PR не используются: черновик даёт
событие `opened`, то есть сжёг бы единственную проверку PR в релизную
ветку.

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

### Что в облаке надо включить руками (миграциями не ставится)

Два шага живут в настройках проекта Supabase, а не в SQL, и после
создания нового окружения их легко забыть — приложение тогда собирается
и даже работает, но ведёт себя не так, как задумано:

1. **Хук токена.** Authentication → Hooks → Customize Access Token
   (JWT) Claims → выбрать `public.custom_access_token_hook` и включить.
   Без него роль в токен не попадает, `parseSessionClaims` подставляет
   `user` всем (намеренно — наименьшие права, ADR 0044), и админские
   экраны не откроются даже админу.

   **Как это выглядит снаружи** (ловил владелец, 2026-10-16): роль
   меняется в UI Supabase на `admin`, человек выходит и входит заново —
   а в профиле по-прежнему `user`. В коде искать нечего. С 2026-10-16
   `getSessionClaims` пишет на такой токен
   `[session] token carries no user_role claim` с причиной
   `token-hook-disabled-or-no-role-row` — на каждый запрос, пока причина
   стоит, и в Sentry (`captureMessage`, `warning`) **один раз на инстанс**:
   это один факт о настройке проекта, а не тысяча исключений, и квота
   нужна настоящим ошибкам (ADR 0044, обновление). Причин три: хук не включён, у человека нет строки в
   `user_roles`, либо строка помечена `deleted_at` (хук её фильтрует —
   ADR 0047). Команды для проверки — ADR 0044, обновление 2026-10-16.
2. **Регистрация выключена.** Authentication → Sign In / Providers →
   Email → Allow new users to sign up: **выключить**. Аккаунты выдаёт
   владелец (решение D1); при включённой регистрации любой желающий
   заведёт себе аккаунт сам.

3. **Подпись токенов — асимметричная** (ES256 c `kid`). **Сделано** —
   проверено на продовом проекте 2026-10-14: `jwks.json` отдаёт один
   ключ `ES256`, легаси-ключи `anon`/`service_role` отключены (ADR 0044,
   обновление). Остался один шаг — **отозвать легаси-секрет**: он всё
   ещё принимается при проверке, то есть подписанный им токен (хоть с
   `role: service_role`) сейчас пройдёт. Ниже — зачем это вообще нужно
   было и как проверять, если окружение сменится.

   Это не «полезно знать», как было написано здесь раньше. `getClaims()` проверяет
   подпись локально **только** при асимметричной подписи; с
   легаси-секретом он ходит на auth-сервер, то есть каждая навигация
   внутри приложения упирается в его доступность и стоит round-trip.
   Приложение при этом работает, просто не так, как описано в ADR 0044 —
   и по коду этого не видно.

   Как проверить, что уже есть: `curl -s
   https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` — непустой
   `keys` с `"alg":"ES256"` означает, что всё уже как надо; пустой ответ
   — проект ещё на легаси-секрете. Локально (CLI ≥ 2.117) подпись уже
   асимметричная — проверено, токен приходит с
   `{"alg":"ES256","kid":…}`, то есть расходится только облако.

   Порядок перехода (Project Settings → JWT Keys, простоя нет):
   **Migrate JWT secret** — легаси-секрет импортируется в новую систему,
   рядом создаётся асимметричный ключ в состоянии *standby*; затем
   **Rotate keys** — новые токены подписываются им, а уже выданные
   продолжают приниматься, так что никого не выкидывает; и только
   **через `jwt_expiry` + запас** (час + 15 минут) легаси-секрет в
   разделе *Previously used* можно отозвать. Отзыв раньше выкинет тех,
   кто сейчас в приложении.

   Два предупреждения из документации, которые к этому проекту
   относятся: нигде нельзя проверять токен легаси-секретом вручную (у
   нас и не проверяется — только `getClaims()`), и ротация ломает Edge
   Functions с включённым «Verify JWT». Такая функция одна —
   `backend/supabase/functions/health`, в `config.toml` `verify_jwt` не
   задан, значит действует значение по умолчанию. Приложение её больше не
   вызывает (пробник удалён вместе с `SB_API_ROUTES`), так что сломать
   она может только себя — но проверить после ротации стоит.

Первый админ в проде заводится не через приложение: экран создания
аккаунтов сам требует роль `admin`. Порядок — в ADR 0044 (создать
пользователя в Studio, затем `update public.user_roles set role =
'admin' …`, затем выйти и войти заново, чтобы роль попала в новый
токен).

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
