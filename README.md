# ministry-app

A ministry tracking app: an iPhone-first PWA built on Next.js with a
Supabase backend. Monorepo: `web/` (Next.js) and `backend/` (Supabase CLI
project and utility scripts).

## Status

Pre-launch. Two things exist side by side.

**Public, and finished:** Coming soon (`/soon`) with a waitlist form — a
person leaves an email, gets a position in the list and, if they opened
the installed app, can turn on a push notification about the launch.

**Behind a sign-in, and a skeleton:** v2 added email-and-password sign-in,
roles, bottom navigation and the screens behind a session — `/day`,
`/calendar`, `/month`, `/year` are still placeholders carrying a title
each, `/profile` is real (name, role, push toggle, sign-out) and
`/admin/users/new` creates an account. There is no sign-up: the owner
hands out accounts. The real ministry tables are the next piece of work.

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

Deploying to cloud Supabase (`db:login`, `db:link`, `db:push`,
`functions:deploy`) is a separate section in [`CLAUDE.md`](./CLAUDE.md#деплой-миграций-в-облачный-supabase);
**read the warnings there before the first run**. The supported path is
the `supabase-deploy.yml` workflow (manual trigger, confirmation
checkbox, pgTAP before anything is written to production); running the
commands from a machine checks none of that.

## CI

`.github/workflows/` holds three workflows: `ci.yml` (lint, types, unit
tests), `db-test.yml` (pgTAP plus a check that the committed Supabase
types still match the schema) and `supabase-deploy.yml` (manual
deployment).

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
