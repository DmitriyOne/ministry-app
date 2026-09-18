# CLAUDE.md

Контекст для AI-агентов и людей, работающих в этом репозитории.

> **Внимание**: `web/CLAUDE.md` и `web/AGENTS.md`, если они появятся —
> это НЕ этот файл. Next.js 16 (`next dev`) сам генерирует их
> (`agentRules`, включено по умолчанию — см. `docs/decisions/0005-*.md`)
> как версионированную документацию для AI-агентов внутри `web/`. Не
> редактировать их вручную и не путать с этим, корневым, `CLAUDE.md` —
> договорённости и архитектура проекта фиксируются только здесь.

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
│  ├─ app/                       Next App Router — тонкие роуты,
│  │                             реэкспортирующие экраны из src/pages;
│  │                             app/serwist/[path]/route.ts — Route
│  │                             Handler для сервис-воркера (Turbopack)
│  ├─ pages/                     ПУСТАЯ (кроме README.md) — см.
│  │                             docs/decisions/0004-*.md: без неё Next.js
│  │                             принял бы src/pages за legacy Pages Router
│  ├─ src/
│  │  ├─ app/                    FSD-слой app: providers, root-layout,
│  │  │                          глобальные стили, sw.ts (логика воркера)
│  │  ├─ pages/                  FSD-слой "pages": login, day, cal, month,
│  │  │                          year, status, over
│  │  ├─ widgets/                bottom-nav и т.п.
│  │  ├─ features/                пока пусто (.gitkeep)
│  │  ├─ entities/                пока пусто (.gitkeep)
│  │  └─ shared/
│  │      ├─ ui/                 shadcn/ui компоненты
│  │      ├─ config/              env.ts — createEnv (@t3-oss/env-nextjs)
│  │      └─ api/supabase/        supabase клиенты (client.ts / server.ts) + database.types.ts
│  └─ public/                    manifest.webmanifest, иконки
├─ backend/
│  ├─ supabase/                  Supabase CLI проект: config.toml, migrations/, functions/health, seed.sql
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
или магические px в разметке экранов. Исключения — сам `globals.css`,
иконки в `web/src/shared/ui/icons/` (используют `currentColor` +
сохраняют геометрию прототипа) и служебная страница `web/src/pages/
styleguide/` (эталон сверки с прототипом).

Иконки — собственные SVG-компоненты в `web/src/shared/ui/icons/`
(один файл на иконку, API `size`/`className`/`...props`, цвет через
`currentColor`), не эмодзи и не иконный шрифт. `lucide-react` остаётся в
зависимостях только для служебных нужд shadcn/ui.

Подробности решений, таблица палитры/типографики и обоснования — ADR
`docs/decisions/0011-design-tokens.md`. Живой пример всех токенов —
`/styleguide` (не экран приложения, только для визуальной сверки).

### Библиотека компонентов

Готовые UI-блоки (каркасы экранов, навигация, знаки, текстовые роли,
кнопки/раскладки действий, поля ввода, карточки) — в `web/src/shared/ui/`,
каждый в своём файле, без общего барреля (как `button.tsx`/`card.tsx`, а
не как `icons/` со своим `index.ts`). Полный инвентарь с параметрами и
живыми примерами — витрина `/components`
(`web/src/pages/components`, тоже внутренняя, не экран приложения) и ADR
`docs/decisions/0012-component-library.md`.

**Порядок поиска компонента при работе над экраном: сначала
`shared/ui` (готовый компонент проекта) → потом shadcn/ui
(`pnpm dlx shadcn@latest add ...`, если аналога в `shared/ui` нет) → и
только если ни того, ни другого нет или shadcn-аналог не подходит по
дизайну — свой компонент, с обоснованием в ADR.** Экраны собираются ИЗ
компонентов `shared/ui`, не копируют их разметку. Пиксель-в-пиксель
совпадение с макетом не требуется — важнее переиспользование готового.

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

## Команды

Все — из корня репозитория.

| Команда | Что делает |
|---|---|
| `pnpm dev` | Поднимает Supabase (`db:start`), ждёт готовности (`wait-on` на health Supabase), затем `next dev` (Turbopack) с env из `envs/web.local.env` |
| `pnpm db:start` / `db:stop` / `db:reset` | Обёртки над `supabase start/stop/db reset` в `backend/` |
| `pnpm db:types` | Генерация TS-типов из локальной БД в `web/src/shared/api/supabase/database.types.ts` |
| `pnpm lint` | ESLint + `steiger` (проверка границ FSD) в `web/` |
| `pnpm typecheck` | `tsc --noEmit` в `web/` |
| `pnpm build` | `next build` (Turbopack) в `web/` (с env из `envs/web.local.env`) |
| `pnpm db:login` / `db:link` / `db:push` / `functions:deploy` | Деплой в облачный Supabase — см. раздел ниже |

## Договорённости

- **Миграции Supabase — только через файлы в `backend/supabase/migrations/`.**
  Никаких ручных правок схемы через Supabase Studio без последующей
  миграции (`supabase db diff` / `supabase migration new`).
- **Переменные окружения — только через `envs/*.local.env`**, никогда не
  хардкодить и не коммитить реальные значения. В git — только
  `envs/*.local.env.example` с плейсхолдерами; реальные `*.local.env`
  добавлены в `.gitignore`.
- Доступ к env в коде — только через `web/src/shared/config/env.ts`
  (`@t3-oss/env-nextjs` + zod, fail-fast, с автоматическим разделением
  client/server), не через `process.env` напрямую по всему коду.
- **Браузерный и серверный Supabase-клиенты используют один и тот же
  `NEXT_PUBLIC_SUPABASE_URL`** — никакого отдельного "серверного" URL. Это
  важно не только для простоты, но и потому что имя auth-cookie
  `@supabase/ssr` по умолчанию выводится из хоста этого URL — если
  браузер и сервер резолвят Supabase по-разному, они получат разные имена
  cookie и не увидят сессию друг друга (было и снова не актуально — см.
  `docs/decisions/0009-*.md`).
- Ключи Supabase — **publishable** (`sb_publishable_...`), не легаси
  `anon`. Секретный (`service_role`/`sb_secret_...`) ключ в `web` не
  используется вообще (см. `docs/decisions/0006-*.md`).

## Деплой миграций в облачный Supabase

> ⚠️ **`supabase db reset --linked` (и вообще `db reset` на удалённом
> проекте) УНИЧТОЖАЕТ данные в облачной базе.** Выполнять только на
> локальной БД (без `--linked`). Перед любой операцией, затрагивающей
> `--linked`/prod-проект, убедиться, что это осознанное действие, а не
> копипаста локальной команды.

> ⚠️ Сейчас `db:push`/`functions:deploy` выполняются вручную с машины
> разработчика. Это временное состояние — как только появится CI
> (`.github/workflows/`, сейчас пусто), пуш миграций и деплой функций в
> прод должны переехать туда (например, по образцу
> `supabase/setup-cli` + `supabase db push` на push в `main`), а ручной
> запуск остаться только для экстренных случаев.

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
