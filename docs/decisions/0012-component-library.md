# ADR 0012: Библиотека компонентов и витрина `/components`

## Обновление: переход на shadcn-стиль `aria-nova`

После первой версии этого ADR проект перешёл с `@base-ui/react` на
`react-aria-components` — `web/components.json` → `"style": "aria-nova"`.
Причина и последствия — в ADR 0013 (раздел «React Aria»). Здесь —
следствия для инвентаря:

- `Button`, `Input`, `Label`, `Field`/`FieldLabel`/`FieldError`, `Item`,
  `Separator` переустановлены из `aria-nova`-реестра поверх
  `react-aria-components`, не `@base-ui/react`.
- Свой `ErrorList` (`shared/ui/error-list.tsx`) удалён — используется
  штатный `FieldError` из `field.tsx`: он сам сворачивает несколько
  ошибок в `<ul className="list-disc">/<li>` (см. ADR 0013).
- Вендорные файлы (`shadcn add`) в этом проекте — **стрелочные
  функции**, не `function X(...)`, как их отдаёт CLI по умолчанию. Это
  осознанное отступление от «не трогать вендорный код»: при следующем
  `shadcn add --overwrite` эту правку (`function` → `export const X =
  (...) => `) и остальные project-wide правила (именованные `type`,
  без `React.*`/`import * as React`) нужно будет повторить руками —
  расхождение с апстримом ограничено стилем объявления функций, не
  логикой компонентов.
- Инвентарь ниже обновлён под текущее состояние; исходный список под
  `@base-ui/react` и `ErrorList` см. в истории git этого файла.

## Контекст

Заказчик передал каталог компонентов (`components.html`, не в
репозитории — статичный снимок экспорта из инструмента
дизайн-прототипирования, тот же формат, что и источник ADR 0011) и четыре
экрана, на которых эти компоненты видны в деле (`login.html`, `soon.html`,
`404-500.html`, `only-mob.html`, тоже не в репозитории). Каталог описывает
18 повторяющихся частей шести экранов (404, 500, Coming soon, Вход,
Desktop block, О приложении), матрицу их использования по экранам и точные
параметры (размеры, радиусы, отступы, веса, тона).

Объём этого захода: **только компоненты и живая витрина**. Сами экраны
(404/500/Coming soon/Вход/О приложении/Desktop block) не собираются —
следующий этап.

Документ прошёл ревью и был переписан по его итогам: часть решений
(отдельный `Input` не нужен, `Card`/`Separator` не переиспользуются)
оказалась ошибочной и заменена на обратную — см. раздел «shadcn/ui как
основа» ниже. Правила по формам, доступности и границе `shared/ui` —
вынесены в отдельный ADR 0013, чтобы не смешивать инвентарь компонентов с
процессными правилами.

## Инвентарь компонентов

Все — в `web/src/shared/ui/`, каждый в своём файле (без общего барреля —
как уже заведено для `button.tsx`/`card.tsx`, а не как в `shared/ui/icons/`,
у которой есть свой `index.ts`).

| Компонент | Файл | Параметры | Клиентский? |
|---|---|---|---|
| `CenteredState` | `centered-state.tsx` | `background: warm \| deep`, `glyph`, `children`, `actions`, `footnote` | нет |
| `TopAndBottomState` | `top-and-bottom-state.tsx` | `top`, `bottom` | нет |
| `ScrollState` | `scroll-state.tsx` | `eyebrow`, `onBack?`, `backLabel?`, `children` | нет (хук нажатия — в `Button`) |
| `ScreenHeader` | `screen-header.tsx` | `eyebrow`, `onBack?` \| `backHref?`, `backLabel?`, `tone?` | нет |
| `AppMark` | `app-mark.tsx` | `size: 44\|52\|56\|88`, `tone: solid\|translucent`, `elevated?`, `label?` | нет |
| `StatusGlyph` | `status-glyph.tsx` | `code`, `tone: neutral\|alert` | нет |
| `Eyebrow` | `eyebrow.tsx` | `as?` | нет |
| `Title` | `title.tsx` | `size: default\|compact`, `tone: ink\|hero`, `as?` | нет |
| `BodyText` | `body-text.tsx` | `tone: ink\|hero`, `as?` | нет |
| `Caption` | `caption.tsx` | — | нет |
| `SectionLabel` | `section-label.tsx` | `as?` (по умолчанию `h2` — это заголовок, не абзац) | нет |
| `InlineError` | `inline-error.tsx` | — (`role="alert"`, `aria-live="polite"`) | нет |
| `TextBlock` | `text-block.tsx` | `eyebrow?`, `title`, `text?`, `titleSize?`, `titleAs?`, `tone?`, `align?`, `spacing?` | нет |
| `Button` / `LinkButton` | `button.tsx` (расширен, `react-aria-components`) | `variant: …\|deep\|action\|alert\|plain\|heroGhost`, `size: …\|role\|role-lg` | **да** — нажатие идёт через `onPress` (react-aria), не `onClick` |
| `ActionStack` | `action-stack.tsx` | `maxWidth: 260\|full` | нет |
| `Input` | `input.tsx` (shadcn, `react-aria-components`) | стандартные `<input>`-пропсы | **да** |
| `Label` | `label.tsx` (shadcn, `react-aria-components`) | стандартные `<label>`-пропсы | **да** |
| `Field` / `FieldLabel` / `FieldError` (+ прочее из `field.tsx`) | `field.tsx` (shadcn) | см. shadcn `field`; `FieldError` принимает `errors: {message?}[]`, сам схлопывает несколько ошибок в `<ul className="list-disc">/<li>` | **да** |
| `Alert` / `AlertDescription` | `alert.tsx` (shadcn) | `variant: default\|destructive` | нет |
| `Item` / `ItemMedia` / `ItemContent` / `ItemDescription` (+ прочее) | `item.tsx` (shadcn, `react-aria-components` `Link`) | см. shadcn `item` | **да** |
| `Separator` | `separator.tsx` (shadcn, `react-aria-components`) | `orientation` | **да** |
| `FieldCard` / `FieldRow` | `field-card.tsx` | `rows` как children; `FieldRow`: `label`, `secure?`, `trailing?`, `errors?: FieldErrorItem[]` + стандартные `<input>`-пропсы | `FieldRow` — нет (сам хуков не использует, использует клиентские `Field`/`Input`); секретное поле делегирует состояние `PasswordField` |
| `PasswordField` | `password-field.tsx` | `label`, `visible?`, `onVisibleChange?`, `showLabel?`, `hideLabel?`, `errors?: FieldErrorItem[]` + `<input>`-пропсы | **да** — `useState` показа/скрытия (управляемо снаружи через `visible`/`onVisibleChange`) |
| `PillForm` | `pill-form.tsx` | `placeholder`, `cta`, `label?`, `hint?`, `submitted?`, `successText?`, `value?`, `defaultValue?`, `onValueChange?`, `onSubmit?` | **да** — состояние необязательно, можно передать полностью управляемым (см. ADR 0013) |
| `HeroCard` | `hero-card.tsx` | `title`, `text`, `titleAs?` (по умолчанию `h2`) | нет |
| `ListCard` / `ListRow` | `list-card.tsx` | `rows` как children; `ListRow`: `icon?`, `title`, `text`, `titleAs?` (по умолчанию `h3`) | нет |

## shadcn/ui как основа

Первая версия этого ADR почти везде выбирала свою вёрстку вместо
переиспользования shadcn-реестра — это было пересмотрено по итогам
ревью. Правило теперь: **сначала проверить `pnpm dlx shadcn@latest search
@shadcn` / `view`, взять готовое, наша вёрстка — только когда подходящего
примитива нет.** Пиксель-в-пиксель совпадение с макетом не требуется.

Установлено из реестра (`pnpm dlx shadcn@latest add …`, стиль
`aria-nova`, на `react-aria-components`): `input`, `label`, `field`,
`item`, `alert`, `separator`, `button`, `card`. Разметка и логика этих
файлов — как сгенерировал CLI (вендорный код, не наш), не переписаны;
единственное намеренное отступление от апстрима — стиль объявления
функций (стрелочные, не `function X(...)`) и project-wide правила по
типам, см. «Обновление» в начале документа и ADR 0013.

Как использованы:
- **`Button` расширен, не продублирован.** Новые роли (`deep`/`action`/
  `alert`/`plain`/`heroGhost`) и размеры (`role`/`role-lg`) — ещё одна ось
  `cva` в существующем `button.tsx`. Роль каталога `ghost` названа
  `heroGhost`, чтобы не конфликтовать с уже используемым на `/styleguide`
  generic-вариантом shadcn `ghost`.
- **`FieldCard`** — тонкая обёртка над `Card` (свои `rounded-field-card`/
  `shadow-card`/`ring-0` через `className`) с построчным `Separator`
  между `FieldRow`.
- **`FieldRow`** (несекретная строка) — `Field` + `FieldLabel` + `Input`,
  оформление — токенами через `className` (shadcn даёт `role="group"`,
  связь `label`/`input`, фокус-стили — мы их не переопределяем, только
  красим).
- **`PasswordField`** — тот же `Input`, `Label`, плюс свой toggle-`button`
  (глаз/перечёркнутый глаз) — под это в реестре нет примитива.
- **`ListCard`** — `Card` (бокс) + настоящий `<ul>`/`<li>` (список должен
  быть списком — `ItemGroup` даёт `role="list"` на `<div>`, а не
  реальный список, поэтому не подошёл) + `Item`/`ItemMedia`/`ItemContent`/
  `ItemDescription` на каждую строку (`ListRow`).
- **Ошибки формы** — штатный shadcn `FieldError` из `field.tsx` (роль
  `role="alert"`, деструктивная окраска — уже равна `--negative`, см.
  ADR 0011); своего `ErrorList` больше нет, см. «Обновление» выше и
  ADR 0013.
- **`PillForm`** — `Input` (капсула через `className`, см. ниже) + наш
  `Button` (`variant="deep" size="role"`, радиус и высота переопределены
  через `className` на `rounded-full`/`h-auto`).
- **`HeroCard`** — `Card` (бокс) со своей заливкой `--hero` через
  `className`.

Оставлено своим — подходящего shadcn-примитива нет:
- **Каркасы экранов** (`CenteredState`, `TopAndBottomState`, `ScrollState`)
  — это структура целого экрана (лендмарки `<main>`/`<header>`, отступы
  под большой палец), не UI-примитив.
- **`AppMark`, `StatusGlyph`** — фирменные знаки продукта (плашка со своей
  геометрией/радиусами, круг с кодом состояния), не generic-компоненты.
- **`Eyebrow`, `Title`, `BodyText`, `Caption`, `SectionLabel`, `TextBlock`**
  — типографические роли поверх токен-шкалы ADR 0011; ближайший
  shadcn-аналог (`FieldTitle`/`FieldDescription`) жёстко привязан к
  `Field` и не подходит как самостоятельная текстовая роль на экране.
- **`ActionStack`** — раскладка (колонка с `gap`/`max-width`), не
  компонент.
- **`ScreenHeader`** — своя композиция (`Button` + `Eyebrow` +
  `ChevronLeftIcon`), под неё в реестре нет отдельного примитива
  (`breadcrumb`/`navigation-menu` — для другого сценария).

## Новые токены (`web/src/app/styles/globals.css`)

Правило ADR 0011 «только токены» распространено на каталог компонентов.

| Токен | Значение | Откуда | Замечание |
|---|---|---|---|
| `--radius-mark-sm` | 14px | `AppMark` 44 | |
| `--radius-mark-md` | 16px | `AppMark` 52, плашка знака в `HeroCard`, trailing-кнопка `PasswordField` | |
| `--radius-mark-lg` | 24px | `AppMark` 88 | то же число, что и ниже, но другая роль — два токена, не один переиспользуемый |
| `--radius-field-card` | 24px | `FieldCard` | |
| `--radius-button` | 17px | `Button` (`size="role"`/`"role-lg"`) | `AppMark` 56 попал в уже существующий `--radius-md` (18) — новый токен не понадобился |
| `--font-weight-500` | 500 | везде вместо Tailwind `font-medium` | по решению ревью: в `shared/ui` все веса идут через один и тот же механизм (`font-500…font-640`), не смешиваются с именованными утилитами Tailwind, даже когда число совпадает со стандартным |
| `--font-weight-520` | 520 | `Caption` | |
| `--text-title` | 32px / 1.1 | `Title` (default) | трекинг переиспользует `--tracking-screen-title` (-0.03em — то же число) |
| `--text-body` | 15px / 1.45 | `BodyText` | |
| `--text-status` | 34px / 1 | `StatusGlyph` | трекинг — `--tracking-screen-title` |
| `--text-hero-title` | 24px | `HeroCard` | трекинг — `--tracking-day-title` (-0.025em) |
| `--text-list-title` | 16px | `ListRow` | трекинг — `--tracking-list-row` (-0.015em) |
| `--text-field-label` | 10px / 1.4 | `FieldRow`/`PasswordField` label | трекинг — `--tracking-eyebrow` (0.12em — то же число в макете) |
| `--negative-hero` / `--color-negative-hero` | `#E9B49C` | `InlineError` на `--hero` | самостоятельный тон, не производная прозрачность `--negative` |
| `--shadow-mark-elevated` | `0 12px 24px rgba(30,74,64,.18)` | `AppMark elevated` (88px) | |

**Title M (30/620, Desktop block) не получил отдельного токена** — он
численно совпадает с уже существующим `--text-day-title`
(30px/1.2, `--tracking-day-title` -0.025em), так что `Title size="compact"`
просто переиспользует его.

**Осознанно не заведено:**
- Вес 700 — стандартный `font-bold` Tailwind (только 500 переведён на
  свой токен по решению ревью выше, остальные совпадения с Tailwind не
  трогали).
- Прозрачности `.38` (Caption), `.15` (обводка `PillForm`), `.10`/`.12`
  (белый на `--hero`) — Tailwind v4 умеет `color-mix` по имени токена
  через модификатор `/NN` (`text-ink/38`, `border-hero/15`, `bg-white/10`)
  без отдельного CSS-токена на каждое сочетание цвет+прозрачность.
- Радиус `10px` (чип `InlineError` в каталоге) — округлён до уже
  существующего `--radius-xs` (12px), разница в 2px визуально незначима.
- Разделитель `FieldCard`/`ListCard` (`rgba(34,48,44,.08)` в макете) —
  использует уже существующий `--ink-a07` (.07), а с переходом на shadcn
  `Separator` в `FieldCard` — токен `--border` (см. `field.tsx`); разница
  не видна и не стоит ещё одного alpha-токена.

## Унификация (решения пользователя, применены как есть)

1. **Заголовки: 4 → 2.** Было 26 (404/500) / 30 (Desktop block) / 32
   (Вход) / 36 (Coming soon). Стало: `Title` default = 32 (мобильные
   состояния — 404, 500, Coming soon, Вход), `Title size="compact"` = 30
   (только Desktop block, следующий этап).
2. **Coming soon сведён к общей системе.** Радиусы капсул/карточек Coming
   soon в макете доходили до 100px, использовали `SF Pro Display` и
   собственный серый `#8B958F`. В компонентах — только `--font-sans`
   (уже системный стек, см. ADR 0011) и общий `text-ink-muted` вместо
   отдельного серого; радиусы 17–26 везде, **кроме `PillForm`** (см. ниже).
3. **Знак приложения — один.** `AppMark` использует уже существующую
   `AppMarkIcon` (группа людей, `web/src/shared/ui/icons/app-mark-icon.tsx`)
   во всех четырёх размерах. Щит, который в макете Coming soon шёл отдельным
   знаком, не перенесён — вне единой системы знаков продукта.

### Капсульный радиус `PillForm`

Поле и кнопка `PillForm` оставлены на `rounded-full` (эквивалент 100px)
несмотря на общее правило «радиусы 17–26». Обоснование: `PillForm` — это
не карточка и не кнопка-состояние, а самостоятельная форма-«таблетка» на
Coming soon; капсульная форма — часть её роли, а не забытое старое
значение радиуса из макета. Токена под неё не заводилось (`rounded-full` —
стандартная утилита Tailwind, не число вне шкалы).

## DRY

- **Нажатие.** Единый механизм — CSS-класс `.pressable` в
  `globals.css` (`@layer components`), величина задаётся переменной
  `--press-scale` у элемента. Используется в `Button` (0.98),
  `ScreenHeader`/`Button variant="plain"`-кнопке назад (0.94),
  `PasswordField`-переключателе (0.9), `PillForm` (0.98) — вместо
  копирования `transition`/`active:scale` в каждом месте. Уважает
  `prefers-reduced-motion: reduce`.
- **Заголовок + абзац.** `TextBlock` — единая пара `Title`+`BodyText`
  (+опциональный `Eyebrow`) вместо копирования одной и той же колонки с
  `gap` на каждом экране; уровень заголовка настраивается через `titleAs`
  (см. ADR 0013).
- **Карточка-контейнер.** Все карточки (`HeroCard`/`ListCard`/`FieldCard`)
  переиспользуют один и тот же shadcn `Card` — см. раздел «shadcn/ui как
  основа» выше (в первой версии этого ADR было решено иначе, пересмотрено).

## Витрина `/components`

`web/app/components/page.tsx` → `web/src/pages/components` (FSD-слайс).
Повторяет структуру каталога (6 разделов, матрица использования, живой
пример + параметры на каждый компонент) — но собрана **из настоящих
компонентов `shared/ui`**, не копирует разметку макета. Матрица
использования (`usage-matrix-data.ts`) — данные из каталога, перенесённые
как таблица, не переоткрыты заново. Заголовки живых примеров на витрине
опущены на нужный уровень через `titleAs`, чтобы не плодить второй `h1` и
не пропускать уровни в общем аутлайне страницы — правило и проверка
(`document.querySelectorAll('h1..h6')`) описаны в ADR 0013.

**Страница внутренняя** — не часть UX приложения, аналогично
`/styleguide` (ADR 0011): не в навигации, не индексируется, существует
только для сверки дизайн-системы с макетом и как справочник для
разработки экранов на следующем этапе. `/styleguide` не тронут — он
остаётся про сырые токены (палитра/шкала/радиусы/иконки), `/components` —
про собранные из них UI-блоки.

## Следующий этап

Сами экраны (404, 500, Coming soon, Вход, О приложении, Desktop block) —
следующая задача. Они должны собираться из компонентов этого ADR, не
дублировать их разметку. Форма вайтлиста (`PillForm`) и форма входа
(`FieldCard`) на реальных экранах получат сценарий (запрос к Supabase,
`useForm`+`zod`) в соответствующем слайсе `features` — не в `shared/ui`,
см. правило в ADR 0013.

## Обновление 2026-09-25: витрина `/components` удалена

Служебная витрина `/components` (`web/app/components/`,
`web/src/pages/components/`, ключи словаря `showcase.components.*`)
удалена из репозитория вместе с `/styleguide` (см. ADR 0011) — обе были
инструментом сверки на этапе построения библиотеки компонентов, экраны
приложения уже используют `shared/ui` напрямую. Инвентарь компонентов
из этого ADR остаётся актуальным описанием `shared/ui`, только без живой
демонстрации по адресу.

Компоненты, у которых после удаления витрины не осталось ни одного
использования в `web/src/pages`/`widgets`/`features` (кроме as-is: сама
`shared/ui`) — `alert.tsx`, `field-card.tsx`, `hero-card.tsx`,
`list-card.tsx`, `scroll-state.tsx`, `section-label.tsx`,
`top-and-bottom-state.tsx`. Они не удалены этим изменением (это `shared/ui`
инвентарь, а не код самой витрины) — решение об их судьбе оставлено на
отдельный разговор.

## Обновление 2026-09-25: неиспользуемые компоненты удалены

Разговор состоялся — пользователь попросил вычистить всё, у чего ноль
использований. Проверено по всему `web/` (`grep` по имени файла как
импорту и по имени экспортируемого символа — реэкспортов, динамических
импортов и упоминаний в конфигах не нашлось), не только по списку из
раздела выше.

**Удалены (ноль использований в `web/src/{pages,widgets,features,entities}`,
кроме друг друга):**

| Файл | Доказательство |
|---|---|
| `alert.tsx` | `grep` по `Alert`/`AlertDescription` — совпадений вне `shared/ui/alert.tsx` нет |
| `field-card.tsx` | `grep` по `FieldCard`/`FieldRow` — нет (одно упоминание `FieldRow` было в комментарии `pill-form.tsx`, не импорт) |
| `hero-card.tsx` | `grep` по `HeroCard` — нет |
| `list-card.tsx` | `grep` по `ListCard`/`ListRow` — нет |
| `scroll-state.tsx` | `grep` по `ScrollState` — нет |
| `section-label.tsx` | `grep` по `SectionLabel` — нет |
| `top-and-bottom-state.tsx` | `grep` по `TopAndBottomState` — нет |

**Каскадные сироты** — после удаления списка выше эти компоненты
потеряли последнего потребителя (тоже проверено `grep` после каждого
шага):
- `card.tsx` (shadcn `Card`) — потребители были только `list-card.tsx`,
  `field-card.tsx`, `hero-card.tsx`, все удалены.
- `item.tsx` (shadcn `Item`/`ItemMedia`/`ItemContent`/`ItemDescription`)
  — единственный потребитель был `list-card.tsx`.
- `password-field.tsx` — единственный потребитель был `field-card.tsx`
  (форма входа, для которой он собирался, ещё не построена; `/login`
  удалён раньше, см. таблицу маршрутов в корневом `CLAUDE.md`).

Дальше — сироты второго порядка от `password-field.tsx`:
- `icons/eye-icon.tsx`, `icons/eye-off-icon.tsx` — использовались только
  в `password-field.tsx`.

**Отдельно найдены и удалены** (не из исходного списка, уже были без
потребителей до этой правки — вероятно, остались от более ранних витрин/
`BottomNav`, удалённых до этой задачи): `icons/calendar-icon.tsx`,
`icons/month-icon.tsx`, `icons/year-icon.tsx`, `icons/profile-icon.tsx`,
`icons/check-icon.tsx`, `icons/rabbit-icon.tsx`, `icons/turtle-icon.tsx`,
`icons/lock-closed-icon.tsx`, `icons/lock-open-icon.tsx` — `grep` по
каждому имени экспорта (`CalendarIcon`, `MonthIcon` и т.д.) не находил
ни одного импорта, кроме `icons/index.ts` и самого файла иконки.
`icons/index.ts` обновлён — экспортирует только пять оставшихся иконок
(`AppMarkIcon`, `ChevronLeftIcon`, `ChevronRightIcon`, `CloseIcon`,
`IconProps`).

**Токены `globals.css`, ставшие без потребителя, удалены**: `--text-hero-title`
(только `hero-card.tsx`), `--text-list-title` (только `list-card.tsx`),
`--text-field-label`/`--text-field-label--line-height` (только
`password-field.tsx` и `field-card.tsx`), `--radius-field-card` (только
`field-card.tsx`). `--radius-mark-md` **оставлен** — кроме удалённого
`password-field.tsx` его использует живой `app-mark.tsx`. `--shadow-card`
**оставлен** — кроме удалённых `list-card.tsx`/`field-card.tsx` его
использует живой `button.tsx`/`pill-form.tsx`. `--negative-hero` **оставлен**
— используется живым `inline-error.tsx`. Соответствующие имена убраны и
из списков `shared/lib/cn.ts` (`FONT_SIZE_NAMES`: `hero-title`,
`list-title`, `field-label`; `RADIUS_NAMES`: `field-card`).

**Словарь**: ключ `a11y.passwordField` (`show`/`hide`) убран из
`ru.json` — был нужен только `password-field.tsx`.

**Зависимости `package.json` не тронуты** — ни один из удалённых файлов
не тянул пакет, заведённый исключительно ради него (`class-variance-
authority`, `react-aria-components`, `next-intl` — всё используется
и живыми компонентами).

**Оставлено намеренно, хотя формально не используется само по себе**:
`field.tsx` (`FieldSet`/`FieldLegend`/`FieldGroup`/`Field`/`FieldContent`/
`FieldLabel`/`FieldTitle`/`FieldDescription`/`FieldSeparator`/`FieldError`)
— это один вендорный файл `shadcn add field` (см. раздел «Обновление» в
начале документа: вендорные файлы не переписываются, кроме
project-wide стиля объявлений), из него реально используется только
`FieldError` (через `pill-form.tsx`). Выборочно удалять экспорты внутри
одного shadcn-примитива — не практика этого проекта (тот же принцип, что
у `button.tsx`, где не все варианты `cva` обязательно задействованы на
каждом экране); `separator.tsx` из-за этого тоже остаётся живым
(`FieldSeparator` внутри `field.tsx` его импортирует, хотя сам
`FieldSeparator` нигде не вызывается).

**Что почти наверняка понадобится позже, но всё равно удалено**:
`card.tsx`, `item.tsx` — как только появится реальный список записей
учёта (`ListCard`/`ListRow`) или карточка на главном экране (`HeroCard`),
эти shadcn-примитивы возвращаются одним `pnpm dlx shadcn@latest add
card` / чтением из истории git этого коммита — восстановление дешевле,
чем держать неиспользуемый код в дереве. `password-field.tsx` и
`field-card.tsx`/`FieldRow` тоже вернутся, когда появится реальный экран
входа (`/login` был удалён ещё до этой задачи, см. корневой `CLAUDE.md`).

**Проверка**: `pnpm typecheck` и `pnpm lint` (`eslint` + `steiger`) —
чисто после удаления.


## Обновление (2026-10-07): `Alert` и ссылка-назад в `ScreenHeader`

**`Alert` (`alert.tsx`)** — взят из реестра (`@shadcn/alert`, вариант
`aria-nova`), новых npm-зависимостей не тянет (только `cn`). Светлая
подложка с иконкой слева: иконка лежит в собственной колонке grid, то
есть раскладку писать не нужно, и `role="alert"` приходит вместе с
компонентом — сообщение зачитывается, когда заменяет собой форму.
Используется на `/forgot-password` для нейтрального ответа об отправке.
Код приведён к стилю проекта (стрелочные функции, без `import * as
React`, `cn` из `@/shared/lib/cn`), CSS реестра не тронут.

Одна ловушка, стоившая проверки по собранному CSS: правило реестра
`*:[svg]:text-current` компилируется в `:is(.…>*):is(svg)` со
специфичностью (0,1,1) и перебивает класс цвета на самой иконке (0,1,0).
Поэтому цвет знака задаётся на подложке (`text-primary` на `Alert`), а
не на `<svg>`; текст описания объявляет свой цвет сам и не страдает.

**`ScreenHeader`** получил два свойства. `backHref` рендерит
`LinkButton` вместо `Button` — и это не альтернатива по вкусу: `onBack`
— функция, её нельзя передать из серверного компонента (React не
сериализует функции через границу RSC), а `backHref` — строка, и это
честный выбор для экрана, который открывают напрямую, где возвращаться
по истории некуда. Передать оба сразу — ошибка типов, а не молчаливый
приоритет. `tone="hero"` переключает кнопку на `heroGhost` и приглушает
eyebrow до `text-hero-foreground/70`: на тёмно-зелёном белая кнопка
`plain` и чернильный eyebrow одинаково неуместны.
