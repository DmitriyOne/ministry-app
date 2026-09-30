# ministry-app

Monorepo: Next.js frontend (`web/`) + Supabase backend (`backend/`).
Frontend architecture — Feature-Sliced Design (details and conventions
in [`CLAUDE.md`](./CLAUDE.md)).

## Requirements

- Node.js ≥ 24 (LTS — see `docs/decisions/0010-*.md`)
- [pnpm](https://pnpm.io/) 12.x (`corepack enable` picks up the exact
  version from `package.json#packageManager` — see `docs/decisions/0008-*.md`)
- Docker Desktop (or a compatible Docker engine) — needed for the Supabase
  CLI's local stack (Postgres, Auth, Storage, Edge Functions, Studio);
  there's no longer a containerised run of `web` itself — just `pnpm dev`
  (see `docs/decisions/0009-*.md`)

## First run

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment variable templates and fill in real values:

   ```bash
   cp envs/web.local.env.example envs/web.local.env
   cp envs/backend.local.env.example envs/backend.local.env
   ```

   After the first `pnpm db:start`, run `pnpm --filter backend exec supabase status`
   (or check the output of `db:start` itself) and fill in
   `envs/web.local.env` with the current `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   (the `PUBLISHABLE_KEY` field in the output, **not** `ANON_KEY`) — on a
   fresh `supabase init`/`start` it's deterministic (demo project), but it
   changes when the JWT secret is regenerated in `backend/supabase/config.toml`.

3. Bring everything up and open Next.js:

   ```bash
   pnpm dev
   ```

   The script starts Supabase, waits for it to be ready, then runs
   `next dev` (Turbopack). By default: `http://localhost:3000`
   (redirects to `/day`) — the `/day` screen shows a simple Supabase
   connection status.

   Supabase Studio: `http://127.0.0.1:54323`.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Supabase → wait-on → `next dev` (Turbopack) |
| `pnpm db:start` | Start the local Supabase stack |
| `pnpm db:stop` | Stop the local Supabase stack |
| `pnpm db:reset` | Recreate the local database (migrations + `seed.sql`) |
| `pnpm db:types` | Generate DB TS types into `web/src/shared/api/supabase/database.types.ts` |
| `pnpm lint` | ESLint + `steiger` (FSD boundaries) for `web/` |
| `pnpm typecheck` | `tsc --noEmit` for `web/` |
| `pnpm build` | Production build of `web/` (Turbopack) |

Deploying to cloud Supabase (`db:login`/`db:link`/`db:push`/`functions:deploy`)
— a separate section in [`CLAUDE.md`](./CLAUDE.md#деплой-миграций-в-облачный-supabase),
**make sure to read the warnings there before using it**.

## Structure

Detailed directory layout and FSD rules — in [`CLAUDE.md`](./CLAUDE.md).
Architecture decisions and their rationale — in [`docs/decisions/`](./docs/decisions).

## Known limitations at this stage

- Screens (`web/src/pages/*`) — minimal placeholders with no business logic.
- The database has no tables/migrations yet, and so no RLS policies —
  that's the next step.
- CI (`.github/workflows/`) — not set up yet (just a `.gitkeep`); deploying
  migrations/functions to the cloud is still done manually (see the
  warning in `CLAUDE.md`).
