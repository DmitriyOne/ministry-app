# Month Screen and Month Closing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/month/<месяц>` показывает сводку и дни месяца, а завершившийся месяц закрывается одной кнопкой, после чего его часы не меняются ни с одного экрана и ни одним запросом.

**Architecture:** Новая таблица `ministry_month_closures` (живая строка = месяц закрыт) и три функции к ней; замок стоит внутри `set_ministry_day_minutes`, то есть в единственном пути записи дня. Экран месяца повторяет устройство экрана дня: месяц в адресе, все чтения одним `Promise.all`, граница загрузки со скелетоном, отказ чтения — `FailureCard` вместо блока.

**Tech Stack:** Supabase/Postgres (plpgsql, pgTAP), Next.js 16 App Router (RSC + Server Actions), TypeScript strict, next-intl, Tailwind + shared/ui, vitest, FSD + steiger.

**Spec:** `docs/superpowers/specs/2026-10-29-month-screen-design.md`

## Global Constraints

- Интерфейс и комментарии в коде — британский английский (`en-GB`); ADR, `CLAUDE.md`, `CHANGELOG.md` — по-русски. Сообщения коммитов — **только по-английски**.
- Ни одной строки текста в разметке: всё через `t("…")`, ключи в `web/src/shared/config/i18n/messages/en-GB.json`.
- Цвета, размеры, радиусы, тени — только токенами; классы — через `@/shared/lib/cn`.
- FSD: импорты только вниз, наружу — через `index.ts`. Правила `steiger` не отключать. **В `shared/lib` ровно 15 модулей — шестнадцатый валит `pnpm lint`**, новые файлы кладутся внутрь существующих.
- Функции и компоненты — стрелочные; пропсы — `type`, не `interface`; без `import * as React`.
- Миграции — только файлами в `backend/supabase/migrations/`; таблица закрывается полностью (RLS, `revoke all`, явная deny-all политика с `comment on policy`), пишется только функцией с `set search_path = ''`.
- Soft-delete везде: `deleted_at`, `on conflict do update ... deleted_at = null`, фильтр `deleted_at is null` в каждой политике и функции.
- `supabase db reset` — только локально, никогда с `--linked`.
- Коммиты делятся по смыслу (миграция / фронт / документация — разными). **Не коммитить и не пушить без слова владельца.**
- Каждый коммит заканчивается:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
  ```

## Review Focus

1. **Мусор в адресе** — `/month/2026-13`, `/month/2026-6`, `/month/июнь`, `/month/2026-06-01` дают 404, а не 500 и не экран за июнь. Тест — задача 3 (разбор слага) и задача 5 (маршрут).
2. **Месяц в будущем** — `/month/2027-01`, открытый сегодня, даёт 404; стрелка «вперёд» выключена на текущем месяце **и** когда пояс не прочитался. Тест — задача 4.
3. **Закрытие из другой вкладки** — страница дня открыта до закрытия, человек жмёт плюс: сервер отвергает, число откатывается, тост говорит про закрытый месяц, а не «проверьте дату». Тест — задача 8.
4. **Переоткрытие месяца, который не закрывали** — не падает, отвечает тем же, что и переоткрытие закрытого. Тест — задача 1.
5. **Месяц без единой записи** — сводка показывает `0:00` (сумма — это факт), таблицы нет, вместо неё одна строка «No days recorded», а не пустая карточка с заголовками колонок. Тест — задача 4 и задача 6.

---

### Task 1: Таблица закрытий и три функции к ней

**Files:**
- Create: `backend/supabase/migrations/20261030120000_ministry_month_closures.sql`
- Modify: `backend/supabase/tests/ministry_status_test.sql` (план и новые утверждения)

**Interfaces:**
- Consumes: `public.set_updated_at()` (триггерная функция из миграции профилей).
- Produces: `public.close_ministry_month(p_month date) returns public.ministry_month_closures`, `public.reopen_ministry_month(p_month date) returns void`, `public.is_ministry_month_closed(p_user uuid, p_month date) returns boolean`.

- [ ] **Step 1: Написать миграцию**

Таблица:

```sql
create table public.ministry_month_closures (
  user_id uuid not null references auth.users on delete cascade,
  month date not null,
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, month),
  constraint ministry_month_closures_month_is_first_day
    check (month = date_trunc('month', month)::date)
);
```

Доступ — как у `ministry_days`: `enable row level security`, `revoke all ... from anon, authenticated`, `grant select on table ... to authenticated`, `grant select, insert, update, delete ... to service_role`, политика `select` на свою живую строку через `(select auth.uid())`, явная deny-all политика с `comment on policy`, триггер `set_updated_at`.

Три функции, все `security definer`, `set search_path = ''`, все работают только со строкой `(select auth.uid())`, `execute` только `authenticated` (у `is_ministry_month_closed` — ни у кого, кроме внутренних вызовов: `revoke all ... from public, anon, authenticated`, как у `ministry_status_shape`):

- `close_ministry_month` — отвергает незавершившийся месяц. Граница: отказ, если `(p_month + interval '1 month')::date > ((now() at time zone 'utc')::date + 1)`; `errcode = 'check_violation'`. Пола нет. Пишет upsert `on conflict (user_id, month) do update set closed_at = now(), deleted_at = null`.
- `reopen_ministry_month` — `update ... set deleted_at = now() where user_id = … and month = p_month and deleted_at is null`; отсутствие строки — не ошибка.
- `is_ministry_month_closed` — `exists` живой строки.

В комментариях файла — чем это не колонка в `ministry_status_months` (месяц без перемены статуса там строки не имеет вовсе) и почему граница меряется с запасом в сутки от UTC (на Земле одновременно живут две даты — тот же приём, что в `set_ministry_day_minutes`).

- [ ] **Step 2: Дописать утверждения в pgTAP**

В `ministry_status_test.sql`, новым пользователем (новый UUID, по образцу соседних блоков):

- `has_function_privilege('authenticated', 'public.close_ministry_month(date)', 'execute')` — true;
- закрытие прошлого месяца возвращает строку, `is_ministry_month_closed` — true;
- повторное закрытие того же месяца не падает и оставляет одну строку;
- `reopen_ministry_month` гасит: `is_ministry_month_closed` — false;
- **переоткрытие месяца, который не закрывали, не падает** (Review Focus 4);
- закрытие месяца, который идёт, падает с `check_violation`;
- чужая строка не видна: `select` под другим пользователем даёт 0 строк.

Поднять число в `plan(...)` ровно на количество добавленных утверждений.

- [ ] **Step 3: Прогнать тесты**

Run: `pnpm db:reset && pnpm db:test`
Expected: PASS, без «Bad plan».

- [ ] **Step 4: Коммит**

```bash
git add backend/supabase/migrations/20261030120000_ministry_month_closures.sql backend/supabase/tests/ministry_status_test.sql
git commit -m "feat(db): let a finished month be closed and opened again"
```

---

### Task 2: Замок в записи дня

**Files:**
- Create: `backend/supabase/migrations/20261030120100_ministry_days_respect_closed_month.sql`
- Modify: `backend/supabase/tests/ministry_days_test.sql`

**Interfaces:**
- Consumes: `is_ministry_month_closed` из задачи 1.
- Produces: `set_ministry_day_minutes` отвергает день закрытого месяца с `errcode = '55006'` и сообщением вида `month is closed: <месяц>`.

- [ ] **Step 1: Написать миграцию**

`create or replace function public.set_ministry_day_minutes(...)` — копия действующей с одной новой проверкой после проверки будущего дня:

```sql
  if public.is_ministry_month_closed(v_user, date_trunc('month', p_day)::date) then
    raise exception 'month is closed: %', date_trunc('month', p_day)::date
      using errcode = '55006';
  end if;
```

**Код ошибки отдельный от `check_violation` намеренно**: действие на фронте уже переводит `23514` в «refused» с фразой про дату дня, и закрытый месяц, пришедший тем же кодом, сказал бы человеку неправду. `55006` (`object_in_use` класса 55 — объект не в том состоянии) выбран как код, которого в проекте ещё нет.

В комментарии файла записать, что это **отмена** записанного решения ADR 0062 («прошлый день пишется свободно, и это цель»), а не добавка, и что ADR 0062 обновляется в задаче 9.

- [ ] **Step 2: Дописать pgTAP**

- запись в день закрытого месяца падает с `55006`;
- часы этого дня после отказа те же, что были (Review Focus: замок не трогает данные);
- после `reopen_ministry_month` та же запись проходит;
- запись в соседний, незакрытый месяц проходит, пока первый закрыт;
- закрытие месяца не изменило ни одной строки `ministry_days` (сравнить сумму до и после).

Поднять `plan(...)`.

- [ ] **Step 3: Прогнать тесты**

Run: `pnpm db:reset && pnpm db:test`
Expected: PASS

- [ ] **Step 4: Коммит**

```bash
git add backend/supabase/migrations/20261030120100_ministry_days_respect_closed_month.sql backend/supabase/tests/ministry_days_test.sql
git commit -m "feat(db): refuse hours written into a closed month"
```

---

### Task 3: Типы базы и календарь месяца

**Files:**
- Modify: `web/src/shared/api/supabase/database.types.ts` (генерируется)
- Create: `web/src/entities/ministry-status/model/month-path.ts`, `web/src/entities/ministry-status/model/month-path.test.ts`
- Modify: `web/src/entities/ministry-status/model/month-label.ts` (+ `month-label.test.ts`), `web/src/entities/ministry-status/index.ts`, `web/src/shared/config/routes.ts`

**Interfaces:**
- Produces:
  - `monthPath(month: MonthKey): string` — `/month/2026-06`;
  - `parseMonthSlug(slug: string): MonthKey | null` — только `YYYY-MM`, месяц 01–12, иначе `null`;
  - `monthHeading(month: MonthKey): string` — «June 2026», форматтер в UTC (ключ напечатался бы предыдущим месяцем западнее сервера).

- [ ] **Step 1: Перегенерировать типы**

Run: `pnpm db:types`
Expected: в `database.types.ts` появились `ministry_month_closures` и три функции.

- [ ] **Step 2: Написать падающие тесты**

`month-path.test.ts`:

```ts
expect(monthPath(toMonthKey(2026, 6))).toBe("/month/2026-06");
expect(parseMonthSlug("2026-06")).toBe("2026-06-01");
expect(parseMonthSlug("2026-13")).toBeNull();
expect(parseMonthSlug("2026-6")).toBeNull();
expect(parseMonthSlug("2026-06-01")).toBeNull();
expect(parseMonthSlug("июнь")).toBeNull();
```

`month-label.test.ts`: `monthHeading(toMonthKey(2026, 6))` — `"June 2026"`.

- [ ] **Step 3: Прогнать — должны падать**

Run: `pnpm test`
Expected: FAIL, «parseMonthSlug is not a function».

- [ ] **Step 4: Реализовать**

`monthPath` строит путь из `routes.month`; `parseMonthSlug` — через существующий `parseMonthKey`, дописав `-01`; `monthHeading` — `Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })`. Экспортировать три имени из `index.ts` сущности.

- [ ] **Step 5: Прогнать — должны проходить**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 6: Коммит**

```bash
git add web/src/entities/ministry-status web/src/shared/api/supabase/database.types.ts
git commit -m "feat(ministry-status): give the month an address and a heading"
```

---

### Task 4: Решения экрана как чистые функции

**Files:**
- Create: `web/src/pages/month/model/month-span.ts`, `month-span.test.ts`, `web/src/pages/month/model/month-days.ts`, `month-days.test.ts`, `web/src/pages/month/model/month-closing.ts`, `month-closing.test.ts`

**Interfaces:**
- Produces:
  - `monthSpan(month: MonthKey): { from: DayKey; to: DayKey }` — первый и последний день месяца;
  - `type MonthDayRow = { day: DayKey; minutes: number; runningMinutes: number }`;
  - `buildMonthDays(rows: { day: string; minutes: number }[]): MonthDayRow[]` — по возрастанию дня, накопительный итог по этот день включительно; строки только для дней с записью, ноль остаётся строкой;
  - `monthClosingState(args: { month: MonthKey; currentMonth: MonthKey | null; isClosed: boolean }): "hidden" | "closable" | "closed"` — `hidden`, пока месяц не завершился или текущий месяц неизвестен.

- [ ] **Step 1: Написать падающие тесты**

```ts
// month-span
expect(monthSpan(toMonthKey(2026, 2))).toEqual({ from: "2026-02-01", to: "2026-02-28" });
expect(monthSpan(toMonthKey(2024, 2)).to).toBe("2024-02-29");

// month-days
expect(buildMonthDays([])).toEqual([]);
// 1 июня 75 мин, 4 июня 0 мин, 2 июня 60 мин, пришедшие вразнобой
expect(buildMonthDays(rows).map((r) => r.runningMinutes)).toEqual([75, 135, 135]);
expect(buildMonthDays(rows)[2]).toMatchObject({ day: "2026-06-04", minutes: 0 });

// month-closing
expect(monthClosingState({ month: june, currentMonth: june, isClosed: false })).toBe("hidden");
expect(monthClosingState({ month: may, currentMonth: june, isClosed: false })).toBe("closable");
expect(monthClosingState({ month: may, currentMonth: june, isClosed: true })).toBe("closed");
expect(monthClosingState({ month: may, currentMonth: null, isClosed: false })).toBe("hidden");
expect(monthClosingState({ month: may, currentMonth: null, isClosed: true })).toBe("closed");
```

Плюс тест стрелки «вперёд» (Review Focus 2): `canStepForward(month, currentMonth)` — `false` на текущем месяце и `false` при `currentMonth === null`; положить рядом в `month-span.ts`.

- [ ] **Step 2: Прогнать — должны падать**

Run: `pnpm test`
Expected: FAIL

- [ ] **Step 3: Реализовать**

Границы — через `toDayKey`/`addMonths`/`addDays` из сущностей, без `new Date()` в локальном времени. Накопительный итог — одним проходом по отсортированным строкам.

- [ ] **Step 4: Прогнать — должны проходить**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Коммит**

```bash
git add web/src/pages/month/model
git commit -m "feat(month): decide the month's span, rows and closing state in pure functions"
```

---

### Task 5: Чтение экрана и маршруты

**Files:**
- Create: `web/src/pages/month/api/read-month-page.ts`, `web/src/pages/month/ui/MonthTodayRedirect.tsx`, `web/src/pages/month/ui/generate-metadata.ts`
- Create: `web/app/(with-bottom-nav)/month/[month]/page.tsx`, `web/app/(with-bottom-nav)/month/[month]/loading.tsx`, `web/app/(with-bottom-nav)/month/loading.tsx`
- Modify: `web/app/(with-bottom-nav)/month/page.tsx`, `web/src/shared/config/route-policy.ts` (+ `route-policy.test.ts`), `web/src/pages/month/index.ts`

**Interfaces:**
- Consumes: задачи 3 и 4; `queryDeadline`, `SCREEN_UNAVAILABLE`, `ScreenRead` (`@/shared/api`), `reportReadFailure`, `readTimeZone` (образец — `pages/day/api/read-time-zone.ts`, но свой, в `pages/month/api`).
- Produces: `readMonthPage(month: MonthKey): Promise<MonthPageData>`, где

```ts
export type MonthPageData = ScreenRead<{
  timeZone: string | null;
  currentMonth: MonthKey | null;
  totalMinutes: number | null;      // null = чтение сорвалось
  monthGoalHours: number | null;
  yearGoalHours: number | null;
  yearTotalMinutes: number | null;
  days: MonthDayRow[] | null;       // null = чтение сорвалось
  isClosed: boolean;
}>;
```

- [ ] **Step 1: Написать тест политики маршрута**

В `route-policy.test.ts`: `/month/2026-06` даёт ту же политику, что `/month` (`APP_SCREEN`); `/months` и `/month-end` политики не получают.

- [ ] **Step 2: Прогнать — должен падать**

Run: `pnpm test -- route-policy`
Expected: FAIL

- [ ] **Step 3: Добавить префикс в `route-policy.ts`**

Рядом со строкой для `/day/` (сейчас `web/src/shared/config/route-policy.ts:122`), тем же приёмом и с тем же комментарием про обязательный разделитель.

- [ ] **Step 4: Написать чтение экрана**

Все запросы — **одним `Promise.all`** с общим `started` и `queryDeadline(started)`, по образцу `pages/day/api/read-day-page.ts`: пояс, сумма месяца, сумма служебного года, `ministry_status_for_month` за **этот** месяц, `ministry_status_year_goal` за год, которому он принадлежит, строки `ministry_days` в границах месяца (`select day, minutes`, `is("deleted_at", null)`), и строка `ministry_month_closures` за этот месяц. Годовая цифра — через `visibleYearGoalHours`. Отказ каждого чтения — `reportReadFailure` со своим `step` и `null` в своём поле; отказ пояса — `currentMonth: null`.

- [ ] **Step 5: Написать маршруты**

`month/[month]/page.tsx` — реэкспорт `MonthPage` и `generateMetadata` из `@/pages/month`, по образцу `day/[day]/page.tsx`. Внутри экрана: `const { month } = await params`, `parseMonthSlug`, `notFound()` на `null`, `notFound()` на месяц позже текущего. `month/page.tsx` — реэкспорт `MonthTodayRedirect` (читает пояс, `redirect(monthPath(currentMonthKey(zone)))`). Обе `loading.tsx` рисуют `MonthScreenSkeleton` (задача 6).

- [ ] **Step 6: Прогнать проверки**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 7: Коммит**

```bash
git add web/app/\(with-bottom-nav\)/month web/src/pages/month web/src/shared/config/route-policy.ts web/src/shared/config/route-policy.test.ts
git commit -m "feat(month): put the month in the address and read it in one round trip"
```

---

### Task 6: Экран месяца

**Files:**
- Create: `web/src/pages/month/ui/MonthScreen.tsx`, `MonthHeader.tsx`, `MonthSummary.tsx`, `MonthDaysTable.tsx`, `MonthScreenSkeleton.tsx`, `MonthDaysShell.tsx`
- Modify: `web/src/pages/month/ui/MonthScreen.tsx` заменяет нынешнюю заглушку; `web/src/shared/config/i18n/messages/en-GB.json`

**Interfaces:**
- Consumes: `MonthPageData` (задача 5), `formatHours`, `splitDuration`, `shortDayLabel`, `dayPath` (`entities/ministry-day`), `FailureCard` + `ScreenLoadFailure` (`features/screen-retry`), `Progress` (`shared/ui`).

- [ ] **Step 1: Дописать словарь**

`screens.month.*`: заголовок месяца берётся из `monthHeading` (данные, не текст интерфейса), а в словарь идут `eyebrow`, `summary.hoursThisMonth`, `summary.ofGoal`, `summary.toGo`, `summary.serviceYear`, `days.title`, `days.columns.day|hours|total`, `days.empty`, `closed.notice`, `failure.summary`, `failure.days`, `metadata.*`.

- [ ] **Step 2: Собрать экран**

Карточка — **вариант B** с канваса: заливка `bg-hero`, крупное число наслуженного, полоса, строка остатка, под карточкой белая строка служебного года. Нет цели месяца — нет полосы и остатка; нет цели года — нет строки года; любое чтение сводки `null` — `FailureCard` с «Try again» вместо всей сводки. Таблица — белая карточка, три колонки, строка-ссылка на `dayPath(day)`; **месяц без записей — одна строка `days.empty`, а не пустая карточка с заголовками** (Review Focus 5); чтение дней `null` — `FailureCard` вместо таблицы. Шапка со стрелками по месяцам; «вперёд» выключена по `canStepForward` (задача 4) и приглушена, как на дне. Контур карточки и таблицы — общий с их скелетонами (`MonthDaysShell`, по образцу `LastDaysShell`). Экран внутри группы `min-h-dvh` **не ставит**.

- [ ] **Step 3: Проверить вживую**

Run: `pnpm dev`, открыть `/month/2026-06` и `/month` при `DEV_MODE=true`.
Expected: редирект работает, мусорный слаг даёт 404, месяц без записей показывает `0:00` и строку «нет дней».

- [ ] **Step 4: Прогнать проверки**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 5: Коммит**

```bash
git add web/src/pages/month web/src/shared/config/i18n/messages/en-GB.json
git commit -m "feat(month): show the month's summary and its days"
```

---

### Task 7: Закрытие и переоткрытие с экрана

**Files:**
- Create: `web/src/features/close-month/api/close-month-action.ts`, `model/use-close-month.ts`, `ui/CloseMonthButton.tsx`, `index.ts`
- Modify: `web/src/pages/month/ui/MonthScreen.tsx`, `en-GB.json`

**Interfaces:**
- Produces: `closeMonth({ month: string }): Promise<{ status: "success" | "refused" | "signedOut" | "unavailable" }>`, `reopenMonth({ month: string })` того же вида; `<CloseMonthButton month={MonthKey} state={"closable" | "closed"} />`.

- [ ] **Step 1: Написать Server Action**

Образец — `features/sign-out` (действие + клиентская кнопка с диалогом) и `features/hours-entry/api/set-day-hours-action.ts` (классификация ошибок). Действие само проверяет сессию (`getSessionClaims`), само разбирает слаг месяца, зовёт `close_ministry_month` / `reopen_ministry_month` с `abortSignal(AbortSignal.timeout(SUPABASE_QUERY_TIMEOUT_MS))`, переводит `check_violation` в `refused`, `28000`/`PGRST301` — в `signedOut`, остальное — в `unavailable` через `reportActionFailure`. После успеха — `revalidatePath(monthPath(month))` и **только его**: дни закрытого месяца намеренно не ревалидируются (иначе выселяется клиентский кэш всего семейства `/day/[day]` — то самое мерцание, за которое проект уже платил на `/whats-new`, ADR 0057).

- [ ] **Step 2: Собрать кнопку**

`closable` — заполненная кнопка «Close month», открывающая диалог подтверждения: заголовок «Close June 2026?», строка «Hours 28:30», тихая «Cancel» и подтверждающая «Close month» (обычный `Button` со спиннером, не `SubmitButton`; Enter диалог не подтверждает — ADR 0013). `closed` — тихая кнопка «Reopen the month», **без** диалога. Успех и отказ — тостами (`showToast`), по правилу «в форме только то, с чем человеку надо что-то сделать» (ADR 0046).

- [ ] **Step 3: Подключить на экране**

`monthClosingState` (задача 4) решает, что рисовать: ничего, кнопку закрытия или плашку «Closed on …» плюс кнопку переоткрытия.

- [ ] **Step 4: Проверить вживую**

Закрыть прошлый месяц, перезагрузить — плашка на месте; открыть обратно — кнопка вернулась.

- [ ] **Step 5: Прогнать проверки**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 6: Коммит**

```bash
git add web/src/features/close-month web/src/pages/month web/src/shared/config/i18n/messages/en-GB.json
git commit -m "feat(close-month): close a finished month and open it again"
```

---

### Task 8: День внутри закрытого месяца

**Files:**
- Modify: `web/src/pages/day/api/read-day-page.ts`, `web/src/pages/day/ui/DayPage.tsx`, `web/src/features/hours-entry/model/day-hours-context.tsx`, `model/use-day-hours.ts`, `model/hours-save.ts` (+ `hours-save.test.ts`), `api/set-day-hours-action.ts`, `ui/HoursCard.tsx`, `en-GB.json`

**Interfaces:**
- Consumes: `is_ministry_month_closed` через чтение строки `ministry_month_closures` (восьмым запросом **в том же `Promise.all`**).
- Produces: `SetDayHoursStatus` получает член `"monthClosed"`; `RollbackReason` — член `"monthClosed"`; `DayHoursProvider` — проп `isLocked: boolean`.

- [ ] **Step 1: Написать падающий тест классификации**

В `hours-save.test.ts`: `reactionTo("monthClosed")` — откат с причиной `"monthClosed"` и **без повторных попыток** (сервер ответил, посылать заново нечего).

- [ ] **Step 2: Прогнать — должен падать**

Run: `pnpm test -- hours-save`
Expected: FAIL

- [ ] **Step 3: Провести новый случай по пути**

`set-day-hours-action.ts`: код `55006` → `{ status: "monthClosed" }` с `reportActionFailure({ outcome: "rejected" })`, отдельной веткой **перед** `CHECK_VIOLATION`. `hours-save.ts`: новый член обоих союзов и ветка в `reactionTo`. `use-day-hours.ts`: `ROLLBACK_MESSAGE.monthClosed = "saveMonthClosed"`, строка в словаре — про закрытый месяц, не про дату.

- [ ] **Step 4: Прочитать флаг и показать его**

`read-day-page.ts` — восьмой запрос в том же `Promise.all`, поле `isMonthClosed: boolean`; **чтение сорвалось — `false`** (рисовать замок по догадке хуже, чем не нарисовать; запрет в базе никуда не делся). `DayPage` — плашка над карточкой со ссылкой на `monthPath` месяца этого дня и проп `isLocked` в `DayHoursProvider`; `HoursCard` при `isLocked` выключает все пять кнопок (`isDisabled`, то есть `data-disabled`) и снимает оверлей вибрации.

- [ ] **Step 5: Прогнать — должны проходить**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 6: Проверить вживую (Review Focus 3)**

Открыть `/day/<день закрытого месяца>` в одной вкладке, закрыть месяц в другой, вернуться и нажать плюс **до** перезагрузки: число должно вернуться на место, тост — сказать про закрытый месяц.

- [ ] **Step 7: Коммит**

```bash
git add web/src/pages/day web/src/features/hours-entry web/src/shared/config/i18n/messages/en-GB.json
git commit -m "feat(day): lock the hours card inside a closed month"
```

---

### Task 9: Документы и выпуск

**Files:**
- Create: `docs/decisions/0066-month-screen-and-closing.md`
- Modify: `docs/decisions/0062-ministry-days-hours.md`, `0063-day-in-the-address.md`, `0050-route-policy-one-map.md`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`, корневой `package.json`, `en-GB.json`, `web/src/pages/whats-new/ui/WhatsNewScreen.tsx`

- [ ] **Step 1: Написать ADR 0066**

По-русски, формат «контекст → варианты → решение → последствия». Обязательно: почему отдельная таблица, а не колонка в `ministry_status_months`; почему закрытие запирает часы, но **не** статус (и названная цена: у закрытого месяца может задним числом измениться цель, наслуженное — никогда); почему переоткрытие без условий — это защита от случайной правки, а не замок; почему отдельный код ошибки `55006`, а не `check_violation`; почему дни не ревалидируются после закрытия.

- [ ] **Step 2: Обновить соседние ADR**

0062 — разделом «Обновление»: у свободной записи прошлого дня появилась граница, и это отмена прежнего решения, а не баг. 0063 — месяц поехал в адрес тем же приёмом, что день. 0050 — в карте появился второй префикс.

- [ ] **Step 3: Обновить `CLAUDE.md`, `README.md`, `CHANGELOG.md`**

`CLAUDE.md`: дерево (`app/(with-bottom-nav)/month`, `pages/month`, `features/close-month`, новые функции сущности), таблица адресов (`/month`, `/month/YYYY-MM`), таблица локальной проверки, раздел про `pnpm db:test` (новые утверждения), раздел про `ministry_month_closures`. `README.md` — абзац статуса: месяц больше не заглушка. `CHANGELOG.md` — блок `## [2.5.0] — <дата>`.

- [ ] **Step 4: Поднять версию и «Что нового»**

Корневой `package.json` → `2.5.0`; `screens.whatsNew.v2_5.*` в словаре; блок 2.5 в `WhatsNewScreen` с `currentPill`, блок 2.4 → `releasedPill`.

- [ ] **Step 5: Сверить документы с кодом**

Run: `grep -rnP '[А-Яа-яЁё]' web/src web/app | wc -l` — число не выросло против восьми строк, перечисленных в `CLAUDE.md`; `pnpm test && pnpm typecheck && pnpm lint && pnpm db:test`.
Expected: PASS

- [ ] **Step 6: Коммит**

```bash
git add docs CLAUDE.md README.md CHANGELOG.md package.json web/src/shared/config/i18n/messages/en-GB.json web/src/pages/whats-new
git commit -m "docs: record the month screen and what closing a month means"
```

---

## После плана, не в нём

Миграции в прод — воркфлоу `supabase-deploy.yml` (ручной запуск, галочка, pgTAP до записи), не `pnpm db:push`. После выката — `version-push.yml`: сначала `dry-run`, потом `send` с версией `2.5.0`. Живьём на iPhone: закрыть месяц, уйти на день внутри него, нажать плюс.
