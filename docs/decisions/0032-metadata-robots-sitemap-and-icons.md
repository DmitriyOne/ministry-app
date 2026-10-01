# ADR 0032: пер-страничные metadata, robots.ts/sitemap.ts и настоящая иконка

## Контекст

До этого ADR весь SEO-слой приложения сводился к одному общему
`generateMetadata` в `web/src/app/layout/root-layout.tsx` — один
`title`/`description` на всё приложение, без Open Graph, без
`robots.txt`/`sitemap.xml`, и фавиконкой оставался нетронутый плейсхолдер
`create-next-app` (`web/app/favicon.ico`, 25 931 байт — та самая
стандартная иконка Next.js, видимая во вкладке браузера с самого начала
проекта). Нужно было: дать каждому маршруту свой `title`/`description`,
добавить `robots.ts`/`sitemap.ts` с учётом `DEV_MODE`, заменить иконку на
собственный знак приложения (`AppMarkIcon`) и сделать это без
хардкода домена — продакшен-домен пользователем ещё не подтверждён.

Перед написанием кода проверены версионированные доки Next.js, вшитые в
`node_modules` именно этой версии (16.3.5) — `web/AGENTS.md` прямо
требует не полагаться на обучающие данные для этой версии:
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
01-metadata/{app-icons,robots,sitemap}.md` и
`.../04-functions/generate-metadata.md`. Подтверждено оттуда, не из
памяти:

- Файловые иконки (`app/icon.svg`, `app/apple-icon.png`) — специальные
  Route Handlers; **файловая конвенция имеет более высокий приоритет и
  перекрывает `metadata.icons`/`generateMetadata`** ("File-based
  metadata has the higher priority and will override the metadata
  object and generateMetadata function").
- `favicon` можно задать только в корне `app/` и только `.ico`; `icon`
  принимает `.ico/.jpg/.jpeg/.png/.svg`, для `.svg` Next.js сам
  проставляет `sizes="any"`.
- `apple-icon` — `.jpg/.jpeg/.png`, рендерится как
  `<link rel="apple-touch-icon">`.
- `metadata.openGraph`, как и любой другой вложенный объект
  `metadata`, при **merging** между сегментами не домешивается, а
  **полностью заменяется** тем сегментом, который его переопределяет
  ("Duplicate keys are replaced based on their ordering... openGraph
  fields... are overwritten by the last segment to define them") — это
  прямо определило архитектуру `buildPageMetadata` ниже.
- `robots.ts`/`sitemap.ts` — файловые конвенции `app/`, default-экспорт
  функции, возвращающей `MetadataRoute.Robots`/`MetadataRoute.Sitemap`.
  `MetadataRoute.Robots.rules` принимает один объект или массив по
  user-agent; `sitemap` — опциональное поле со ссылкой на
  `sitemap.xml`.
- `metadataBase` — `URL`, задаётся обычно в корневом layout, покрывает
  все нижестоящие сегменты; без него relative URL в полях, которым
  нужен абсолютный адрес, — ошибка сборки (у нас таких полей сейчас
  нет, поэтому отсутствие `metadataBase` не ломает билд — см. решение
  ниже).

## Варианты

### Как тащить `title`/`description`/OG через 9+ страниц, не теряя поля при merge

1. **Каждая страница пишет собственный `generateMetadata` с нуля.**
   Просто, но при вложенном `openGraph` merge-поведение Next.js значит,
   что любая страница, задающая `openGraph.title` без
   `type`/`locale`/`siteName`, молча теряет их — унаследованные из
   layout поля отбрасываются целиком, не домешиваются. Риск тихой
   регрессии при любой будущей правке одной страницы.
2. **Общий помощник `buildPageMetadata({title, description, robots?})`**
   в `shared/lib/metadata/`, который сам строит полный `openGraph`
   (`type: "website"`, `locale`, `siteName` — siteName берётся из
   словаря, не хардкодится) и опционально кладёт `robots`. Каждая
   страница вызывает его с двумя-тремя значениями из словаря. **Выбран
   этот вариант** — ровно один источник правды для формы `openGraph`,
   новая страница не может забыть одно из полей.

### Где жить `generateMetadata` каждой страницы

Корневой layout уже показывал паттерн: `generateMetadata` определён в
`web/src/app/layout/root-layout.tsx` (слой `app`), а
`web/app/layout.tsx` — тонкий файл, который его реэкспортирует вместе с
дефолтным компонентом (`export { RootLayout as default, generateMetadata,
viewport } from "@/app"`). Тот же приём применён к каждому слайсу
`pages/*`: новый файл `ui/generate-metadata.ts` (sibling экрана, тот же
сегмент `ui`, что и сам компонент — отдельного `model/`-сегмента под это
не заводилось, так как у функции нет состояния, только `getTranslations`
+ вызов `buildPageMetadata`), реэкспортирован через `index.ts` слайса, и
`web/app/.../page.tsx` реэкспортирует `generateMetadata` рядом с
`default` — например:

```ts
// web/app/(with-footer)/about/page.tsx
export { AboutScreen as default, generateMetadata } from "@/pages/about";
```

Альтернатива — положить `generateMetadata` прямо в `app/.../page.tsx`
(минуя `pages/`-слайс) — отклонена: тогда текст/переводы для метаданных
жили бы вне FSD-слайса экрана, а `pages/about` перестал бы быть
самодостаточным (разработчик, открывший `pages/about/`, не увидел бы,
что у экрана вообще есть собственные metadata).

### Какие страницы — `noindex`

Бриф явно требовал `robots: { index: false, follow: false }` для
`/access/*` и `/day`/`/soon`/`/install`. К этому списку добавлен и 404
(`web/app/not-found.tsx` → `pages/not-found`) — не по прямому
требованию, а по общей практике: Next.js и так отдаёт `/_not-found` со
статусом 404 (ADR 0018), но явный `noindex` защищает от случая, когда
поисковик проиндексировал адрес до того, как тот стал 404-м.
`/about`/`/privacy` остались индексируемыми (`index`/`follow` по
умолчанию, без переопределения) — единственные два настоящих публичных
документа приложения.

### `metadataBase`/базовый URL для `robots.ts`/`sitemap.ts`

Нужен абсолютный адрес и для `metadataBase` (root layout), и для
`Sitemap:`-строки в `robots.txt`, и для `<loc>` в `sitemap.xml`.
Домен продакшена пользователем ещё не подтверждён — хардкодить что-либо
нельзя. Рассмотрено:

1. **Жёстко прописать плейсхолдерный домен** (`example.com` и т.п.) в
   коде, с комментарием "заменить потом". Отклонено — именно то, что
   бриф запрещает: "the configuration must not bake one in".
2. **Переменная окружения `SITE_URL`** (новая, в `web/src/shared/config/
   env.ts`, `server.SITE_URL: z.url().optional()`), с фолбэком на
   `VERCEL_PROJECT_PRODUCTION_URL` — платформенную переменную Vercel
   (без протокола, присутствует на любой сборке на Vercel после линковки
   проекта, без ручной настройки). **Выбран этот вариант.**

Обёрнуто в `getSiteUrl(): string | undefined`, не в вычисляемую на
уровне модуля константу — та же причина, что у уже существующей проверки
`DEV_MODE`+`NODE_ENV=production` чуть выше в `env.ts`: `env.SITE_URL` —
серверный ключ `createEnv`, а `env.ts` реэкспортируется из общего
барреля `shared/config` вместе с клиентским `locale` — клиентский бандл,
которому нужен только `locale`, не должен попутно читать `env.SITE_URL`
и падать. `getSiteUrl()` начинается с `if (typeof window !== "undefined")
return undefined` — тот же приём, что уже был у проверки `DEV_MODE` (её
`typeof window === "undefined" && env.DEV_MODE && ...` работает за счёт
короткого замыкания `&&` на клиенте).

`VERCEL_PROJECT_PRODUCTION_URL` читается напрямую из `process.env`, не
через `createEnv`/zod — это не значение, которое задаёт или
валидирует этот проект, а штатная переменная самой платформы Vercel
(их список — не в `envs/*.local.env.example`, а в документации Vercel),
поэтому пропуск через `@t3-oss/env-nextjs` был бы лишним слоем, не
добавляющим проверки, которую мы сами же не контролируем.

Ни `SITE_URL`, ни `VERCEL_PROJECT_PRODUCTION_URL` не заданы (локальная
разработка, сборка до линковки Vercel-проекта) — `getSiteUrl()`
возвращает `undefined`, и три места, которые её используют, **деградируют
безопасно, не падая**:

- `metadataBase` в root layout — просто не выставляется
  (`siteUrl ? new URL(siteUrl) : undefined`); это не ломает сборку,
  потому что ни одно поле `metadata`, использующее сейчас
  `metadataBase`, не задано относительным путём, требующим абсолютного
  адреса (OG-изображений нет — см. ниже).
- `shared/lib/seo/build-robots.ts` — не добавляет строку `Sitemap:`.
- `shared/lib/seo/build-sitemap.ts` — возвращает `[]` (пустой
  `sitemap.xml`, валидный пустой `<urlset>`).

`envs/web.local.env.example` получил новую закомментированную строку
`SITE_URL=https://example.com` с пояснением, когда её вообще нужно
задавать (не для локальной разработки — там и так всё работает через
фолбэк/деградацию, а для явного переопределения, если потребуется
домен, который Vercel не знает). `envs/web.local.env` (реальный,
игнорируемый гитом файл) не тронут вообще — инструкция задачи это прямо
запрещала.

### Генерация `robots.ts`/`sitemap.ts`: чистые функции + тонкие Route Handler'ы

Вся ветвящаяся по `DEV_MODE`/наличию `siteUrl` логика вынесена в два
чистых файла без зависимости от Next.js-рантайма:
`web/src/shared/lib/seo/build-robots.ts` и `build-sitemap.ts` (только
типы `MetadataRoute.*` из `next`, импорт типов не тянет рантайм).
`web/app/robots.ts`/`web/app/sitemap.ts` — однострочные обёртки,
подставляющие `env.DEV_MODE`/`getSiteUrl()`. Ровно та же причина, что у
`shared/lib/access/classify-access.ts` (ADR 0016) — чистую функцию можно
покрыть `vitest` без поднятия Next.js, и именно так она покрыта:
`build-robots.test.ts`/`build-sitemap.test.ts` (4 + 3 теста, все
проходят, см. "Проверка" ниже) — явно проверяют DEV_MODE-ветку, которую
иначе пришлось бы гонять через `NODE_ENV=production`-сборку (а она при
`DEV_MODE=true` вообще отказывается стартовать, см. ниже).

## Иконка: `favicon.ico` → `icon.svg` + `apple-icon.png` + maskable PNG

`web/app/favicon.ico` (256×256, подтверждено `sips`) — нетронутый
дефолт `create-next-app`, никогда не содержавший знак приложения.
Заменён на:

- **`web/app/icon.svg`** — зелёная плитка (`#1E4A40`, тот же `--hero`,
  что в `globals.css`/`theme_color` манифеста) с центрированным
  `AppMarkIcon`. Путь `<path>` скопирован дословно из
  `shared/ui/icons/app-mark-icon.tsx` (не передорисован на глаз).
  Пропорции — не свои, а взяты из `shared/ui/app-mark.tsx`'s
  `SIZE[44]` (единственный источник правды для того, как `AppMark`
  вообще масштабирует знак внутри плитки в остальном приложении):
  `radius/box = 14/44 ≈ 0.318` → на канвасе 64×64 это `rx="20.36"`;
  `icon/box = 24/44 ≈ 0.545` → знак шириной `34.91` (высота `28.36`,
  исходная пропорция `viewBox="0 0 32 26"` сохранена), отцентрован
  `translate(14.55 17.82) scale(1.0909)`. `favicon.ico` удалён
  (`rm`, не git-операция — обычное удаление файла).
- **`web/app/apple-icon.png`**, 180×180 (подтверждено `sips -g
  pixelWidth -g pixelHeight`) — размер, который сам Apple ожидает от
  `apple-touch-icon` (манифест предлагает только 192/512, а старый
  `metadata.icons.apple` указывал на `icon-192.png` — временная замена,
  явно помеченная как таковая в ADR 0020 "когда появятся настоящие
  иконки продукта — заменить на выделенный файл apple-touch-icon.png
  180×180"). Получен ресэмплом `web/public/icons/icon-512.png`
  (`sips -z 180 180`), без новой отрисовки.
  **Без альфа-канала** (Apple-гайдлайн, тот же, что уже
  цитировался в ADR 0020): `icon-512.png` хранит скруглённые углы как
  прозрачность (`sips -g hasAlpha` → `yes`, проверено по пикселю
  `(0,0)` → `(0,0,0,0)`), а простой ресайз эту прозрачность бы
  унаследовал. Устранено в два шага: `sips -p 514 514 --padColor
  1E4A40` на исходном 512×512 (паддинг даже на 2 px больше исходника
  заставляет `sips` реально закрасить прозрачные пиксели заданным
  цветом, а не просто дописать рамку — проверено напрямую: паддинг до
  **того же** размера 180×180 ничего не красил, прозрачный угол
  оставался прозрачным; только настоящий рост канваса triggers
  перерисовку) → ресайз в 180×180 → финальная конвертация в чистый RGB
  через Pillow (`Image.convert("RGB")`, отбрасывает альфа-канал
  целиком). Итог подтверждён: `sips -g hasAlpha apple-icon.png` → `no`.
- **Maskable-иконка**, `web/public/icons/icon-maskable-640.png`
  (640×640, `hasAlpha: no`, подтверждено). Требование брифа — не
  переклеивать ярлык `"any maskable"` на существующий 512-файл: у
  Android-маски (круг/squircle) должен быть "safe zone" — знак должен
  умещаться в ~80% канваса, а `icon-512.png`, хоть сам знак внутри него
  и укладывается с запасом (измерено: ширина знака с учётом
  полупрозрачных боковых фигур ≈ 58.8% ширины канваса, высота ≈ 38.1%
  — оба числа посчитаны построчным сканированием пикселей Pillow,
  порог — отличие цвета пикселя от фонового `#1E4A40` больше чем на 40
  по сумме каналов), хранит скруглённые углы как **прозрачность**, а не
  закрашенный фон, — замаскированный под произвольную форму ОС этот
  файл показал бы просвечивающий фон лаунчера в районе непрокрашенных
  углов, а не ровную плитку. Сгенерирован добавочным паддингом:
  `sips -p 640 640 --padColor 1E4A40 icon-512.png` — как показало
  предыдущее исследование, `sips -p` с ростом канваса заодно закрашивает
  исходную прозрачность тем же `padColor` (не только рамку снаружи), так
  что результат — честная непрозрачная плитка 640×640 с исходным знаком
  по центру, занимающим ровно `512/640 = 80%` канваса по каждой стороне
  — безопасная зона выдержана математически точно, не на глаз. Снова
  приведён к чистому RGB через Pillow (`hasAlpha: no`, подтверждено).
  Добавлен в `web/public/manifest.webmanifest` третьей записью:
  `{"src": "/icons/icon-maskable-640.png", "sizes": "640x640", "type":
  "image/png", "purpose": "maskable"}` — две прежние записи дополнены
  `"purpose": "any"` (были без `purpose` вовсе, что по спеке
  Web App Manifest равнозначно `"any"`, но раз уже появилась третья
  запись с explicit `purpose`, две другие тоже получили его explicit
  — не оставлять одну запись из трёх выделяющейся по форме).
- **`metadata.icons.apple` убран** из `generateMetadata`
  (`root-layout.tsx`) — файловая конвенция (`app/apple-icon.png`)
  имеет более высокий приоритет и полностью его перекрывает (см.
  "Контекст" выше), держать оба было избыточно, не аддитивно.
  Подтверждено по собранному HTML (`pnpm build`, см. "Проверка"):
  единственный `<link rel="apple-touch-icon">` — тот, что сгенерирован
  из файла, с `sizes="180x180"`.

**Известный вынесенный вопрос, не в рамках этого ADR:** полноценного
OG-изображения (`opengraph-image.png`/`.tsx`) по-прежнему нет —
расшаренная ссылка покажет текстовый превью без картинки. Явно оставлено
как последующий шаг, см. бриф задачи ("Do not build an OG image — that
is out of scope for this task").

## Решение (сводка)

- **Шаблон заголовка.** Корневой layout —
  `title: { default: t("title"), template: \`%s — ${t("title")}\` }`
  (т.е. `"%s — MinistryApp"`, но не как строковый литерал в коде — имя
  продукта подставляется из существующего ключа словаря
  `metadata.title`, чтобы не заводить второй источник правды для него).
  Каждая страница ниже отдаёт короткий `title` через `buildPageMetadata`
  — шаблон добавляет суффикс один раз, централизованно.
- **Текст** — весь в `web/src/shared/config/i18n/messages/en-GB.json`,
  новый вложенный ключ `metadata: {title, description}` под каждым
  существующим `screens.<slug>`
  (`day`/`comingSoon`/`installApp`/`about`/`privacy`/`notFound`/
  `access.{desktop,android,iosBrowser}`), ничего не хардкожено в
  `.tsx`. Описания — 117–133 символа (в рамках брифа 120–160, кроме
  одного уточнения: `day`/`access.desktop` изначально вышли чуть короче
  120, текст удлинён на одну смысловую деталь, не наполнителем).
- **`buildPageMetadata`** (`web/src/shared/lib/metadata/
  build-page-metadata.ts`) — общий помощник, строит `title`,
  `description`, полный `openGraph` (`type: "website"`, `locale`
  — `en_GB`, выведено из `shared/config`'s `locale` заменой дефиса на
  подчёркивание, не второй литерал; `siteName` — из словаря) и
  опциональный `robots`.
- **`generateMetadata` по слайсам** — `pages/*/ui/generate-metadata.ts`
  + реэкспорт через `index.ts` слайса + реэкспорт рядом с `default` в
  `web/app/.../page.tsx` (см. "Варианты" выше). Корень `/` — не
  получил собственной metadata: экран ничего не рендерит (мгновенный
  `redirect(routes.day)`), наследует `title.default`/`description`
  layout'а как есть — именно то, что бриф описывает фразой "the root
  itself keeps an absolute title".
- **`noindex`** — `/day`, `/soon`, `/install`, все три `/access/*` и
  404 — `robots: { index: false, follow: false }`. `/about`/`/privacy`
  — без переопределения (индексируемы по умолчанию).
- **`metadataBase`** — `getSiteUrl() ? new URL(...) : undefined` в
  `generateMetadata` корневого layout.
- **`web/src/shared/config/env.ts`** — новое серверное поле
  `SITE_URL: z.url().optional()` + функция `getSiteUrl()` (фолбэк на
  `VERCEL_PROJECT_PRODUCTION_URL`, `typeof window`-гвард, см.
  "Варианты"). Реэкспортирована из `shared/config/index.ts`.
  `envs/web.local.env.example` — новая закомментированная строка
  `SITE_URL=https://example.com` с пояснением. `envs/web.local.env` не
  тронут.
- **`web/app/robots.ts`/`web/app/sitemap.ts`** — тонкие обёртки над
  чистыми `shared/lib/seo/{build-robots,build-sitemap}.ts`
  (юнит-тесты — `build-robots.test.ts`/`build-sitemap.test.ts`).
  `DEV_MODE=true` → `robots` целиком `Disallow: /` без `Sitemap:`,
  `sitemap` → `[]`. `DEV_MODE=false` → `robots` разрешает
  `/about`/`/privacy`, запрещает `/day`/`/soon`/`/install`/`/access/*`,
  ссылается на `{siteUrl}/sitemap.xml`, если `siteUrl` известен;
  `sitemap` перечисляет `/about` (priority 0.8) и `/privacy`
  (priority 0.5) как абсолютные URL, или `[]`, если `siteUrl`
  неизвестен (протокол Sitemaps требует абсолютный `<loc>` — выдавать
  относительный было бы некорректно, не "деградацией", а багом).
- **Иконка** — `icon.svg` + `apple-icon.png` + maskable PNG + запись в
  манифесте, `favicon.ico` удалён. Детали — раздел выше.

## Важная оговорка: щит User-Agent и реальная индексация

**Решение пользователя оставить щит User-Agent (ADR 0016/0017,
`web/proxy.ts`) на `/about` и `/privacy` в силе означает, что весь этот
ADR технически корректен, но не даёт индексации, пока щит стоит.**
`classifyAccess()` разрешает полный доступ только устройствам,
классифицированным как `ios-safari` (побайтовое совпадение UA с
настоящим Safari на iPhone) — Googlebot представляется как Android,
Bingbot чаще как десктоп, большинство ботов превью мессенджеров не
попадают ни в один белый список реального Safari. Любой из них,
дойдя до `/about` или `/privacy`, получит `307` на `/access/android`
или `/access/desktop` (`ios-not-safari` тоже возможен для part UA
ботов, маскирующихся под iPhone) — не ту страницу с правильными
metadata, которую строит этот ADR, а заглушку с собственными
`noindex`-metadata.

Это не ошибка данного ADR и не повод откладывать его — `robots.txt`/
`sitemap.xml`/пер-страничные `title`/`description`/OG технически верны
и готовы к моменту, когда щит снимут или сузят. Однострочное изменение,
которое включило бы реальную индексацию: убрать `routes.about` и
`routes.privacy` из `APP_ROUTES` в `web/proxy.ts` (строка 27–34) — тогда
эти два маршрута перестанут проходить через `classifyAccess()` и
откроются любому User-Agent, включая ботов, как и было бы для
по-настоящему публичного документа. Эта правка **не входит в этот
ADR** — пользователь прямо попросил не трогать щит ("Do not change the
shield").

## Проверка

Через `node_modules/next/dist/docs/` подтверждено (не из памяти модели,
см. "Контекст"): приоритет файловых иконок над `metadata.icons`,
формат `favicon`/`icon`/`apple-icon`, формат `Robots`/`Sitemap`
объектов, поведение `metadataBase`/URL composition, shallow-merge
`openGraph` между сегментами.

- `pnpm lint` (ESLint + `steiger`) — `✔ No problems found!`.
- `pnpm typecheck` — чисто, без вывода (успех).
- `pnpm test` — `3 passed (3 files) / 40 passed (40 tests)`, включая 7
  новых (`build-robots.test.ts` ×4, `build-sitemap.test.ts` ×3).
- `grep -rn '[А-Яа-яЁё]' web/src web/app` — только 4 исходных совпадения
  (`globals.css` ×2, `use-launch-gate.ts`, `launch-noscript-fallback.tsx`
  — все предшествовали этому ADR, ссылаются на ADR 0019), новых
  совпадений не добавлено.
- `pnpm build` (через копию `envs/web.local.env` с `DEV_MODE=false`, не
  сам файл) — маршруты `/robots.txt`/`/sitemap.xml`/`/icon.svg`/
  `/apple-icon.png` присутствуют в карте маршрутов. Без `SITE_URL`:
  `sitemap.xml` — пустой `<urlset>`, `robots.txt` — без строки
  `Sitemap:`. С `SITE_URL=https://jw.fenko.dev` (только в копии для
  сборки, не в репозитории) — `robots.txt` разрешает `/about`/
  `/privacy`, запрещает остальное и ссылается на
  `https://jw.fenko.dev/sitemap.xml`; `sitemap.xml` перечисляет оба
  адреса абсолютными URL с верными `priority`. `about.html`/
  `privacy.html` — `<title>About — MinistryApp</title>`/`<title>Privacy
  &amp; cookies — MinistryApp</title>`, корректные
  `<meta name="description">`, полный набор `og:*`
  (`title`/`description`/`site_name`/`locale`/`type`), без
  `<meta name="robots">` (index/follow по умолчанию); `<link
  rel="icon" href="/icon.svg?..." sizes="any" type="image/svg+xml">` и
  `<link rel="apple-touch-icon" href="/apple-icon.png?..."
  sizes="180x180" type="image/png">`. `/access/desktop`, `/soon`,
  `/install`, `/_not-found` — каждый несёт `<meta name="robots"
  content="noindex, nofollow">`.
- Попытка собрать с `DEV_MODE=true` и `NODE_ENV=production`
  (эмулируется самим `next build`) **отказала**, как и было до этого
  ADR: `env.ts`'s существующая проверка бросает исключение до того, как
  дело доходит до `robots.ts`/`sitemap.ts` — поэтому DEV_MODE-ветка
  `robots.ts`/`sitemap.ts` подтверждена не этой сборкой (она физически
  недостижима в `NODE_ENV=production`), а напрямую юнит-тестами
  `build-robots.test.ts`/`build-sitemap.test.ts`.
- Размеры сгенерированных изображений (`sips -g pixelWidth -g
  pixelHeight -g hasAlpha`):
  `web/app/apple-icon.png` — 180×180, `hasAlpha: no`;
  `web/public/icons/icon-maskable-640.png` — 640×640, `hasAlpha: no`.

## Последствия

- Новые файлы: `web/app/{icon.svg,apple-icon.png,robots.ts,sitemap.ts}`,
  `web/public/icons/icon-maskable-640.png`,
  `web/src/shared/lib/metadata/{build-page-metadata.ts,index.ts}`,
  `web/src/shared/lib/seo/{build-robots.ts,build-sitemap.ts,
  build-robots.test.ts,build-sitemap.test.ts,index.ts}`,
  `web/src/pages/*/ui/generate-metadata.ts` (9 слайсов:
  `day`/`coming-soon`/`install-app`/`about`/`privacy`/`desktop-block`/
  `android-block`/`ios-browser-required`/`not-found`).
- Удалён: `web/app/favicon.ico`.
- Изменены: `web/src/app/layout/root-layout.tsx` (шаблон заголовка,
  `metadataBase`, `openGraph`, `icons.apple` убран),
  `web/src/shared/config/env.ts` (`SITE_URL` + `getSiteUrl()`),
  `web/src/shared/config/index.ts` (реэкспорт `getSiteUrl`),
  `envs/web.local.env.example` (новая строка),
  `web/src/shared/config/i18n/messages/en-GB.json` (`metadata` под
  девятью `screens.*`), `web/public/manifest.webmanifest` (третья
  иконка + explicit `purpose` у всех трёх), девять `pages/*/index.ts`
  (реэкспорт `generateMetadata`), девять `web/app/.../page.tsx` +
  `web/app/not-found.tsx` (реэкспорт `generateMetadata` рядом с
  `default`).
- `web/proxy.ts` — **не менялся**, щит остаётся в силе (см. раздел
  выше про оговорку).
- Открытый вопрос на будущее (не блокирует этот ADR): OG-изображение
  отсутствует; продакшен-домен ещё не подтверждён (`SITE_URL`/
  `VERCEL_PROJECT_PRODUCTION_URL` оба не заданы локально — деградация
  работает, но реальный `sitemap.xml` останется пустым до линковки
  Vercel-проекта или явной установки `SITE_URL`).
