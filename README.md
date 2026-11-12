# ministry-app

A ministry tracking app: an iPhone-first PWA built on Next.js with a
Supabase backend. Monorepo: `web/` (Next.js) and `backend/` (Supabase CLI
project and utility scripts). The product's version lives in the root
`package.json`; the workspace packages carry their own numbers, which
mean nothing.

## For reviewers

Where to look first:

- [`docs/decisions`](./docs/decisions): more than 70 ADRs, one for each decision that was not obvious.
- [`backend/supabase/tests`](./backend/supabase/tests): database tests for the schema, roles and row-level security.
- [`.github/workflows`](./.github/workflows): CI with a version check on release PRs, database tests, a manual deploy with a confirmation step, and Dependabot.

## Status

Pre-launch. Two things exist side by side.

**Public, and finished:** Coming soon (`/soon`) with a waitlist form — a
person leaves an email, gets a position in the list and, if they opened
the installed app, can turn on a push notification about the launch.

**Behind a sign-in, and now doing real work:** v2 added
email-and-password sign-in, roles, bottom navigation and the screens
behind a session.

`/day` is the screen the app is built around, and since 2.3 it **keeps
what it is given**. Every day has its own address — `/day/2026-06-02` —
with arrows stepping back as far as needed, so a Tuesday that was missed
can be filled in on Thursday; the bare `/day` redirects to today's, which
only the database can work out, since it depends on the person's own time
zone. The menu and the sign-in skip that hop and link to the date itself,
because by then the zone is known and going through a redirect would draw
the loading skeleton twice. On it: the hours card (minus and plus by five minutes, quick-adds of
15/30/45, capped at a day, a system haptic tick under the finger) which
**saves itself, with no button** — a tap moves the number at once and one
write goes out for the whole burst; a progress block with a bar each for
the month and the service year and how much of the goal is still to go;
and a strip of days that pulls sideways — two months back, and forward
to the end of the month, where the days nobody has lived yet are drawn
but cannot be opened. A day with no record shows a dash rather than a
zero, because a zero would claim somebody had looked.

`/profile` carries the name, role, ministry status (publisher through
regular pioneer), the monthly and service-year goals, the push toggle,
the time zone every day and month is counted in — read-only, with a
padlock saying so, because nothing can change it yet — the way to take
every recorded day out as a file (CSV, or an Excel book with the month
totals on their own sheet), and sign-out. Choosing "regular pioneer" asks
one more thing — since when, the start of the service year or this month
— because the year's goal is the months actually served
added up, not a fixed 600; and that goal is shown to a regular pioneer
only, for as long as they are one.
`/admin/users/new` creates an account.
`/whats-new` tells a person what each version added, with a dot on the
profile row while they have not read the current one. There is no
sign-up: the owner hands out accounts.

`/month/2026-06` is the month: the hours, the goal and the service year
at the top, then — on the month being lived — whether it is keeping up
with its own calendar, which is what the goal asks for by today and how
far ahead or behind that leaves you, down to the minute, with how much a
day it takes from here. Below that, every day that was recorded, each
with the month's running total beside it and each a tap away from the day
itself. A month that is over can be **closed** — after which its hours
stop changing, refused by the database rather than merely hidden by the
screen — and opened again whenever the person wants, because closing is
there to stop a stray tap, not to lock anybody out of their own figures.
Both answers are asked for first. A day inside a closed month says so and
links back to it.

`/year/2026` is the service year, September through August and named
after the September it starts in. At the top, what the year came to
against its goal — which is the monthly goals added up, not a flat 600,
so somebody appointed in October is measured against 550 and is not in
arrears on their first day. Below it, on the year being lived, how the
year stands against its own calendar: what the goals asked for by today,
how far ahead or behind that leaves you, and how much a month it takes
from here, the month you are in included. Then all twelve months, one
line each, with the year's running total beside every one — all twelve
rather than only the recorded ones, because the question the screen
answers is which months came up short. A month with nothing recorded
shows a dash, a closed one carries a lock, and a month still being lived
is never painted as a miss.

`/calendar/2026-11` is the same month drawn as a calendar, and it
answers the question the month's table cannot: which days. A dot marks a
day something was recorded on — a recorded zero included — and a day
without one has simply not been filled in. Today carries a ring. Picking
a date fills it in and the card below says what was in it: the hours of
that day, what the month came to by the end of it, and the way into the
day itself. A date with nothing says so in words rather than showing a
zero, and still opens.

Every block of figures carries a small "i". Pressing it opens a short
note beside the sign explaining how that block is worked out — that the
goal is for the whole month, that the bracket is what is left rather
than what today added, that the pace measures the goal as it stands
today, and that the year's goal is the monthly ones added together.

`LAUNCH_MODE` is gone — `/soon` is simply a public landing page now, and
what `/day` shows is decided by whether there is a session.

Access is iPhone in Safari only (and the app installed from the home
screen); the server redirects other devices to the `/access/*` placeholder
screens, and then a second shield decides what the session allows. Details
are in [`CLAUDE.md`](./CLAUDE.md), the "Доступ v2" section — what every
address requires is one typed map, not a list per shield.

Known defect before launch: the `pnpm push:launch` mailing script does not
page past 1000 subscribers and is not idempotent. Do not run it against a
real audience until the conditions in
[ADR 0038](./docs/decisions/0038-launch-push-delivery-limits.md) are met.

## Requirements

- Node.js ≥ 24 (see `docs/decisions/0010-*.md`)
- [pnpm](https://pnpm.io/) 12.x — `corepack enable` picks up the exact
  version from `package.json#packageManager` (`docs/decisions/0008-*.md`)
- Docker Desktop or a compatible engine — for the local Supabase stack
  (Postgres, Auth, Storage, Edge Functions, Studio); there is no
  containerised run of `web` itself, only `pnpm dev`
  (`docs/decisions/0009-*.md`)

## First run

1. Dependencies:

   ```bash
   pnpm install
   ```

2. Environment variable templates (the real `*.local.env` files never reach
   git):

   ```bash
   cp envs/web.local.env.example envs/web.local.env
   cp envs/backend.local.env.example envs/backend.local.env
   ```

   After the first `pnpm db:start`, take the key values from
   `pnpm --filter backend exec supabase status`: in `envs/web.local.env` —
   `PUBLISHABLE_KEY` (not `ANON_KEY`) and `SECRET_KEY` for
   `SUPABASE_SECRET_KEY` (server-only, bypasses RLS, never
   `NEXT_PUBLIC_*` — ADR 0037). The VAPID key pair for push is generated
   once per environment (the command is in a comment in
   `envs/web.local.env.example`) and put identically into both files.

3. Everything at once:

   ```bash
   pnpm dev
   ```

   Starts Supabase, waits for it to be ready and launches `next dev`
   (Turbopack) at `http://localhost:3000`. Supabase Studio is at
   `http://127.0.0.1:54323`.

To open any screen from a computer, without spoofing the User-Agent and
without launching from the home screen icon, set `DEV_MODE=true` in
`envs/web.local.env` (local only — it is forbidden in Production on
Vercel). The table of addresses and what is visible at each is in
[`CLAUDE.md`](./CLAUDE.md#как-посмотреть-каждый-экран-локально).
To open the dev server from a phone over Wi-Fi, you need
`DEV_ALLOWED_ORIGIN` (same place).

## Commands

All from the root.

| Command | What it does |
|---|---|
| `pnpm dev` | Supabase → wait → `next dev` |
| `pnpm db:start` / `db:stop` / `db:reset` | Local Supabase stack; `db:reset` recreates the database from migrations and `seed.sql` |
| `pnpm db:test` | pgTAP tests of the table access model (local database only) |
| `pnpm db:types` | TS types from the local database into `web/src/shared/api/supabase/database.types.ts` |
| `pnpm lint` | ESLint and `steiger` (FSD boundaries) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | `vitest run` |
| `pnpm build` / `pnpm start` | Production build and running it (with env from `envs/web.local.env`) |
| `pnpm push:launch` | Launch mailing to waitlist subscribers. **Defective, see ADR 0038** |
| `pnpm push:version` | Announces the current version to account holders. Sends nothing without `--send`; see ADR 0058 |

Deploying to cloud Supabase (`db:login`, `db:link`, `db:push`,
`functions:deploy`) is a separate section in [`CLAUDE.md`](./CLAUDE.md#деплой-миграций-в-облачный-supabase);
**read the warnings there before the first run**. The supported path is
the `supabase-deploy.yml` workflow (manual trigger, confirmation
checkbox, pgTAP before anything is written to production); running the
commands from a machine checks none of that.

## CI

`.github/workflows/` holds six workflows. Three are about the code:
`ci.yml` (lint, types, unit tests, plus a check that a release raises the
version), `db-test.yml` (pgTAP plus a check that the committed Supabase
types still match the schema) and `supabase-deploy.yml` (manual
deployment). One announces a release to the people using the app: `version-push.yml`
(manual, dry run by default, see
[ADR 0058](./docs/decisions/0058-version-announcement-push.md)). One keeps
the free tier alive: `health-ping.yml` queries the database every three
days, because a free Supabase project is paused after seven days of
inactivity. It runs on a schedule, and GitHub disables scheduled
workflows after sixty days without repository activity. There is no
automatic database backup: the free tier has none, and a dump uploaded as
a workflow artifact would be public in a public repository.

The first two deliberately do **not** run on every commit — only on the
merges the owner named: into a release branch when the pull request is
opened, into `develop` from a release branch and into `master` from
`develop` or `hotfix/*` on every commit, plus a push to `master`. The
table and the reasoning are in
[ADR 0052](./docs/decisions/0052-ci-only-on-named-merges.md); the branch
protection it asks for has to be switched on by hand in GitHub Settings.

A pull request into a release branch is therefore checked once, when it
is opened. After pushing more commits to one, re-run the checks with the
"Run workflow" button.

## Where things live

- [`CLAUDE.md`](./CLAUDE.md) — repository structure, Feature-Sliced Design
  rules, the design system, the access scheme, conventions. Start there.
- [`DESIGN.md`](./DESIGN.md) — the visual language: tokens, the type
  scale, spacing, the inventory of ready components. Read it before
  writing any markup; the project has twice paid for a component written
  from scratch next to a ready one.
- [`docs/decisions/`](./docs/decisions) — ADRs, one per architectural
  decision, with the options and the reasons for the choice. Decisions are
  recorded there, not in conversations.
- `docs/superpowers/plans/` — working plans and review plans.

- [`CHANGELOG.md`](./CHANGELOG.md) — what each version added, in Russian,
  in Keep a Changelog format.
- [`AGENTS.md`](./AGENTS.md) — the entry point for AI coding agents; it
  points at `CLAUDE.md` rather than repeating it.

Language: the interface and code comments are in British English, as is
this file; ADRs, `CLAUDE.md` and `CHANGELOG.md` are in Russian — they are
the project owner's own working notes, not part of the product.
