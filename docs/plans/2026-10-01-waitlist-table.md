# Waitlist table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store waitlist email addresses in Supabase instead of the server log, return the signup's place in the list to the screen, and lock the form's inputs while the submission is in flight.

**Architecture:** The table is sealed off outright — RLS on, no policies, grants revoked from `anon`/`authenticated` — and the only way in is `public.join_waitlist(text)`, a `security definer` function that normalises the address, inserts or recognises it, and returns `(already_joined, list_position)`. The server action calls that function through the existing publishable-key client; a pure mapper turns its row into the action's state so the mapping is testable without a database, and pgTAP tests assert the access model itself against the local database.

**Tech Stack:** Supabase CLI 2.117.0 (Postgres 17, pgTAP), `@supabase/ssr`, Next.js 16 Server Actions, zod 4, react-hook-form, next-intl, Vitest, Tailwind CSS 4, react-aria-components.

**Spec:** `docs/decisions/0033-waitlist-signups-table.md` (with `docs/decisions/0022-waitlist-server-action.md`, `0026-waitlist-spam-protection.md`, `0027-waitlist-email-plaintext-log.md` and `0031-privacy-and-cookies-screen.md` as the decisions it supersedes or extends)

## Global Constraints

- Branch `feat/waitlist-table`, already created off `develop`. **Never merge into `develop`** — report and wait for the user's explicit consent.
- Interface copy and all code comments: **British English (`en-GB`)** — `organise`, `behaviour`, `colour`. ADRs and plan documents: Russian. `grep -rn '[А-Яа-яЁё]' web/src web/app` must stay empty.
- **No string literals in JSX or in `aria-label`/`title`/`alt`/`placeholder`** — every visible string comes from `web/src/shared/config/i18n/messages/en-GB.json` through `t()`. Enforced by `eslint-plugin-i18next`.
- **Arrow functions only** (`export const X = () => …`); props as a named `type XProps` next to the component, never `interface`; no `import * as React`, no `React.*` member access.
- **react-aria event API** inside `shared/ui`: `onPress`, `isDisabled` — never `onClick`/`disabled` on a react-aria primitive. Native elements inside `shared/ui` keep native handlers.
- Colours, font sizes, radii and shadows **only through design tokens** (`bg-hero`, `text-caption`, `font-600`, `rounded-button`, `shadow-card`); no hex, rgba or magic pixels in markup. Class merging only via `@/shared/lib/cn`.
- FSD import direction is downward only (`app → pages → widgets → features → entities → shared`); cross-slice imports go through each slice's `index.ts`. Checked by `steiger` inside `pnpm lint`.
- Environment access only through `@/shared/config` (`env`, `getSiteUrl`), never `process.env` directly. Supabase keys are **publishable** (`sb_publishable_…`); the secret/`service_role` key is not used in `web` at all.
- Schema changes only as files in `backend/supabase/migrations/`. **Never run `supabase db reset --linked` or any `db reset` against the remote project** — it destroys cloud data. Local only, without `--linked`.
- Vitest only collects `src/**/*.test.ts` (no `.tsx`, no DOM, no React) — pure functions only. SQL behaviour is tested with pgTAP through `supabase test db`.
- Tests live next to the code they test (ADR 0021), not in a mirrored `tests/` tree.
- Every commit message ends with:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
  ```
- **Always pass explicit paths to `git commit`.** `git commit` without paths commits the whole index, including files you did not stage in this task.

## Review Focus

1. **The honeypot path returns success with no position** (`join-waitlist-action.ts` returns `{ status: "success" }` for a filled decoy, deliberately indistinguishable from a real signup — ADR 0026). A bot must get a normal success card, not `#undefined`: the widget needs a number-free wording for `position === undefined`. Pinned in Task 5.
2. **A valid-looking address longer than 254 characters** passes `z.email()` (zod sets no length limit) and then violates the table's `check`, so the person gets a generic "try again" instead of a field error. Pinned in Task 3 by adding `.max(254)` to the shared schema.
3. **The same address in different case, or with surrounding spaces**, must be recognised as already on the list, not stored a second time. Pinned in Task 1 (pgTAP).
4. **A database error must not put the address into the log** — the whole point of retiring ADR 0027. `PostgrestError.details` quotes offending values; `code` and `message` do not. Pinned in Task 4.
5. **A malformed or absent row from the function** (nothing came back, or `list_position` is 0, negative, or not an integer) must become a plain "try again", never a rendered number — a wrong place in the list is worse than a retry prompt. Pinned in Task 3.

---

### Task 1: Migration and pgTAP tests for the access model

**Files:**
- Create: `backend/supabase/migrations/20261001120000_waitlist_signups.sql`
- Create: `backend/supabase/tests/waitlist_signups_test.sql`
- Modify: `backend/package.json` (add the `db:test` script)
- Modify: `package.json` (add the `db:test` passthrough)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `public.join_waitlist(p_email text) returns table (already_joined boolean, list_position bigint)`, callable by role `anon`. Table `public.waitlist_signups (id bigint, email text, created_at timestamptz)`, unreachable directly by any PostgREST role.

- [ ] **Step 1: Write the pgTAP test file**

Create `backend/supabase/tests/waitlist_signups_test.sql`:

```sql
-- pgTAP tests for the waitlist table's access model (ADR 0033). Run with
-- `pnpm db:test` against the LOCAL database only.
--
-- The whole file runs inside one transaction that is rolled back at the
-- end, so `create extension pgtap` and every row these tests insert
-- disappear afterwards — nothing here reaches a migration or the cloud
-- project.
begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- The grants. A new table in `public` is granted select/insert/update/
-- delete to anon and authenticated automatically (config.toml leaves
-- `auto_expose_new_tables` at its default), and adding policies does not
-- take those grants back — so the migration has to revoke them, and
-- these four tests are what proves it did.
select ok(
  not has_table_privilege('anon', 'public.waitlist_signups', 'select'),
  'anon cannot select from waitlist_signups'
);
select ok(
  not has_table_privilege('anon', 'public.waitlist_signups', 'insert'),
  'anon cannot insert into waitlist_signups directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.waitlist_signups', 'select'),
  'authenticated cannot select from waitlist_signups'
);
select ok(
  not has_table_privilege('authenticated', 'public.waitlist_signups', 'insert'),
  'authenticated cannot insert into waitlist_signups directly'
);

-- Row level security, and the deliberate absence of policies: with RLS
-- on and no policy at all, nothing but the table's owner can reach a
-- row. A policy appearing here later must be a decision, not a slip.
select ok(
  (select relrowsecurity from pg_class where oid = 'public.waitlist_signups'::regclass),
  'row level security is enabled on waitlist_signups'
);
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'waitlist_signups'),
  0,
  'waitlist_signups has no policies: the function is the only door'
);

-- The function is the door, and only anon needs the key. Postgres grants
-- execute to role `public` by default, so the migration has to revoke
-- that first — this pair is what proves it did.
select ok(
  has_function_privilege('anon', 'public.join_waitlist(text)', 'execute'),
  'anon can execute join_waitlist'
);
select ok(
  not has_function_privilege('authenticated', 'public.join_waitlist(text)', 'execute'),
  'authenticated was not granted join_waitlist it does not need'
);

-- Joining, normalisation and the counter.
select results_eq(
  $$ select already_joined, list_position from public.join_waitlist('  First@Example.COM ') $$,
  $$ values (false, 1::bigint) $$,
  'a first signup is new and lands at position 1'
);
select results_eq(
  $$ select already_joined, list_position from public.join_waitlist('first@example.com') $$,
  $$ values (true, 1::bigint) $$,
  'the same address, normalised, is recognised at the same position'
);
select results_eq(
  $$ select email from public.waitlist_signups order by id $$,
  $$ values ('first@example.com'::text) $$,
  'the padded, upper-cased address was stored once, lower-cased and trimmed'
);

-- The end-to-end claim of the whole design: a signed-out visitor can
-- join through the function, and cannot read the table that holds the
-- addresses. 42501 is insufficient_privilege.
set local role anon;
select throws_ok(
  $$ select count(*) from public.waitlist_signups $$,
  '42501',
  null,
  'anon reading the table directly is refused'
);
reset role;

select * from finish();

rollback;
```

- [ ] **Step 2: Add the `db:test` scripts**

In `backend/package.json`, add to `scripts`, after `"db:reset"`:

```json
    "db:test": "supabase test db",
```

In the root `package.json`, add to `scripts`, after `"db:reset"`:

```json
    "db:test": "pnpm --filter backend run db:test",
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
pnpm db:start && pnpm db:test
```

Expected: FAIL — `relation "public.waitlist_signups" does not exist`. The table has not been created yet. If `pnpm db:start` reports Docker is not running, start Docker Desktop first.

- [ ] **Step 4: Write the migration**

Create `backend/supabase/migrations/20261001120000_waitlist_signups.sql`:

```sql
-- The waitlist signups table and the one function allowed to touch it.
-- Full reasoning, including the options that were rejected: ADR 0033
-- (docs/decisions/0033-waitlist-signups-table.md).

create table public.waitlist_signups (
  id         bigint generated always as identity primary key,
  email      text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_signups_email_key unique (email),
  -- Last line of defence, not a substitute for validation: the address is
  -- already checked by the zod schema on both the client and the server
  -- (web/src/features/join-waitlist/model/schema.ts, one schema for
  -- both), and normalised by join_waitlist below. These two constraints
  -- are what stops a malformed or un-normalised address landing in the
  -- table even if something ever bypasses that function. 254 is the
  -- address length limit from RFC 5321.
  constraint waitlist_signups_email_normalised check (email = lower(btrim(email))),
  constraint waitlist_signups_email_shape check (email like '%_@_%.__%' and length(email) <= 254)
);

comment on table public.waitlist_signups is
  'Pre-launch waitlist email addresses. Reachable only through public.join_waitlist (ADR 0033).';

-- Row level security with no policies at all is the protection here, not
-- an oversight: nothing but the table owner can reach a row. A policy on
-- this table later must be a deliberate decision with its own record.
alter table public.waitlist_signups enable row level security;

-- Revoking is separate from, and not implied by, the lack of policies:
-- grants and policies are two independent barriers, and a new table in
-- `public` hands anon and authenticated select/insert/update/delete
-- automatically (config.toml leaves `auto_expose_new_tables` at its
-- default of true). Policies never take those grants back.
revoke all on table public.waitlist_signups from anon, authenticated;

-- The only door. `security definer` so it runs with the owner's rights
-- over a table nobody else can reach; `set search_path = ''` so a caller
-- cannot point the unqualified names inside at objects of their own and
-- have them executed with those rights — which is why every reference
-- below is schema-qualified.
--
-- The outcome comes back as a field, not as a raised exception: a custom
-- errcode in an RPC easily lands on 40001 (serialization_failure),
-- which PostgREST reads as transient and retries forever — one HTTP
-- request becomes a storm of transactions. `already_joined` sidesteps
-- that entirely, and spares the caller any parsing of SQL error codes.
--
-- `list_position`, not `position`: `position` is a built-in function
-- name in Postgres and would need quoting at every mention.
create or replace function public.join_waitlist(p_email text)
returns table (already_joined boolean, list_position bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email   text := lower(btrim(p_email));
  v_id      bigint;
  v_already boolean := false;
begin
  select s.id into v_id from public.waitlist_signups s where s.email = v_email;

  if v_id is not null then
    v_already := true;
  else
    -- `do update`, not `do nothing`: when two identical addresses race,
    -- `do nothing` returns no row, and if the winning transaction then
    -- rolls back there is nothing left to look up either — the position
    -- would come back null. `do update` always returns a row, so that
    -- path does not exist. The cost is a no-op rewrite of the same value
    -- in the rare racing case.
    insert into public.waitlist_signups (email) values (v_email)
    on conflict (email) do update set email = excluded.email
    returning id into v_id;
  end if;

  -- Counted, not the id itself: an identity sequence spends values on
  -- failed inserts and rollbacks, so the id drifts ahead of how many
  -- people are actually on the list. Counting is free at this size and
  -- the number does not lie. It does shift down for later signups when a
  -- row is erased on request — the accepted cost, see ADR 0033.
  return query
    select v_already,
           (select count(*) from public.waitlist_signups s where s.id <= v_id);
end;
$$;

comment on function public.join_waitlist(text) is
  'Adds an email to the waitlist (or recognises it) and returns its place in the list. The only access path to waitlist_signups (ADR 0033).';

-- Revoking by role name, not just from `public`. Two separate things
-- hand out execute on a new function here, and only one of them is the
-- familiar implicit PUBLIC grant. Supabase also sets default privileges
-- on schema `public` for functions (`pg_default_acl`, objtype `f`, from
-- both the `postgres` and `supabase_admin` roles), so the function is
-- created with EXPLICIT execute grants for anon, authenticated and
-- service_role — and an explicit grant is not removed by revoking from
-- PUBLIC. Exactly the same trap as the table grants above, and it has to
-- be answered the same way: name the roles.
--
-- `authenticated` is deliberately left without it: nothing signed in has
-- any reason to join a pre-launch waitlist. `service_role` keeps it, and
-- revoking there would be theatre — that key bypasses RLS entirely and
-- is not used in `web` at all (ADR 0006).
revoke all on function public.join_waitlist(text) from public, anon, authenticated;
grant execute on function public.join_waitlist(text) to anon;
```

- [ ] **Step 5: Apply the migration and run the tests to verify they pass**

```bash
pnpm db:reset && pnpm db:test
```

(`db:reset` without `--linked` — the local database only. Never against the remote project.)

Expected: PASS, 12 of 12. If `results_eq` complains the first signup is at a position other than 1, the local database was not reset and already holds rows — re-run `pnpm db:reset`. If test 8 fails (`authenticated` still has execute), the revoke above was written as `from public` alone — see the comment in it for why that is not enough on Supabase.

- [ ] **Step 6: Commit**

```bash
git add backend/supabase/migrations/20261001120000_waitlist_signups.sql \
        backend/supabase/tests/waitlist_signups_test.sql \
        backend/package.json package.json
git commit -m "$(cat <<'EOF'
feat(db): seal the waitlist table behind a single function

The project's first table. RLS is on with no policies and the automatic
anon/authenticated grants are revoked, so nothing reaches a row directly;
join_waitlist() is the only door, normalising the address, recognising one
that is already there and returning its place in the list. pgTAP tests
assert the access model itself, including that anon can join and cannot
read. ADR 0033.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
EOF
)"
```

---

### Task 2: Typed Supabase clients and regenerated database types

**Files:**
- Modify: `web/src/shared/api/supabase/client.ts`
- Modify: `web/src/shared/api/supabase/server.ts`
- Modify: `web/src/shared/api/supabase/database.types.ts` (regenerated, not hand-edited)

**Interfaces:**
- Consumes: `public.join_waitlist(text)` from Task 1.
- Produces: `createServerSupabaseClient()` typed as `SupabaseClient<Database>`, so `.rpc("join_waitlist", { p_email })` is checked against the generated types rather than typed as `any`.

- [ ] **Step 1: Regenerate the database types**

```bash
pnpm db:types
```

Expected: `web/src/shared/api/supabase/database.types.ts` now has `waitlist_signups` under `public.Tables` and `join_waitlist` under `public.Functions`. Confirm:

```bash
grep -n 'waitlist_signups\|join_waitlist' web/src/shared/api/supabase/database.types.ts | head -20
```

Do not hand-edit this file — it is generated output. If it is empty, the migration was not applied; re-run `pnpm db:reset`.

- [ ] **Step 2: Pass the Database generic to both clients**

In `web/src/shared/api/supabase/client.ts`, change the import block and the call:

```ts
import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/shared/config";

import type { Database } from "./database.types";

// Public URL + publishable key only — never pass a secret/service role key here.
// The Database generic is what makes .from()/.rpc() checked against the
// generated types (database.types.ts) instead of falling back to `any`.
export const createClient = () => {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
};
```

In `web/src/shared/api/supabase/server.ts`, add the same import and generic:

```ts
import type { Database } from "./database.types";
```

and change `createServerClient(` to `createServerClient<Database>(`. Leave the cookie handling untouched.

- [ ] **Step 3: Verify the types compile**

```bash
pnpm typecheck
```

Expected: clean. A failure here means the generated types and the clients disagree — re-read the generated `Functions` block before changing anything by hand.

- [ ] **Step 4: Commit**

```bash
git add web/src/shared/api/supabase/
git commit -m "$(cat <<'EOF'
feat(db): type the Supabase clients against the generated schema

database.types.ts stops being an empty shell now that there is a table to
describe, and both clients take the Database generic so .rpc() is checked
rather than typed as any.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
EOF
)"
```

---

### Task 3: Action state, the address length limit, and the pure result mapper

**Files:**
- Modify: `web/src/features/join-waitlist/model/schema.ts`
- Create: `web/src/features/join-waitlist/model/map-join-waitlist-row.ts`
- Create: `web/src/features/join-waitlist/model/map-join-waitlist-row.test.ts`
- Modify: `web/src/shared/config/i18n/messages/en-GB.json` (one key: `screens.comingSoon.emailTooLong`)

**Interfaces:**
- Consumes: `JoinWaitlistActionState` from `./schema`.
- Produces:
  - `type JoinWaitlistRow = { already_joined: boolean; list_position: number }`
  - `mapJoinWaitlistRow(row: JoinWaitlistRow | null | undefined, submitErrorText: string): JoinWaitlistActionState`
  - `JoinWaitlistActionState` gains `position?: number` and `alreadyJoined?: boolean`
  - `JoinWaitlistTranslator` gains the `"emailTooLong"` key

- [ ] **Step 1: Write the failing tests**

Create `web/src/features/join-waitlist/model/map-join-waitlist-row.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { mapJoinWaitlistRow } from "./map-join-waitlist-row";

const SUBMIT_ERROR = "Couldn't join the waitlist. Please try again.";

describe("mapJoinWaitlistRow", () => {
  it("reports a fresh signup with its place in the list", () => {
    expect(mapJoinWaitlistRow({ already_joined: false, list_position: 12 }, SUBMIT_ERROR)).toEqual({
      status: "success",
      position: 12,
      alreadyJoined: false,
    });
  });

  it("reports an address that was already there, at the position it already has", () => {
    expect(mapJoinWaitlistRow({ already_joined: true, list_position: 12 }, SUBMIT_ERROR)).toEqual({
      status: "success",
      position: 12,
      alreadyJoined: true,
    });
  });

  it("falls back to the submit error when nothing came back", () => {
    expect(mapJoinWaitlistRow(null, SUBMIT_ERROR)).toEqual({
      status: "error",
      formError: SUBMIT_ERROR,
    });

    expect(mapJoinWaitlistRow(undefined, SUBMIT_ERROR)).toEqual({
      status: "error",
      formError: SUBMIT_ERROR,
    });
  });

  // A counted position always includes the row the function just found or
  // inserted, so the smallest honest value is 1. Anything else means the
  // contract broke, and showing a wrong number is worse than asking the
  // person to try again.
  it.each([0, -1, 1.5, Number.NaN])("falls back to the submit error for position %s", (position) => {
    expect(mapJoinWaitlistRow({ already_joined: false, list_position: position }, SUBMIT_ERROR)).toEqual(
      {
        status: "error",
        formError: SUBMIT_ERROR,
      },
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm test
```

Expected: FAIL — `Failed to resolve import "./map-join-waitlist-row"`.

- [ ] **Step 3: Add `position`/`alreadyJoined` to the action state and a length limit to the schema**

In `web/src/features/join-waitlist/model/schema.ts`, replace the `JoinWaitlistActionState` type with:

```ts
export type JoinWaitlistActionState = {
  status: "idle" | "success" | "error";
  fieldErrors?: Partial<Record<keyof JoinWaitlistFormValues, string>>;
  formError?: string;
  // Place in the waitlist as join_waitlist counted it, 1-based. Absent
  // on the honeypot path (api/join-waitlist-action.ts returns a bare
  // success for a filled decoy — ADR 0026), which is why every reader
  // has to cope with it being undefined.
  position?: number;
  // True when the address was already on the list, so the screen can say
  // so instead of implying a second signup was made.
  alreadyJoined?: boolean;
};
```

In the same file, extend the translator type and the schema:

```ts
type JoinWaitlistTranslator = (
  key: "emailRequired" | "emailInvalid" | "emailTooLong",
) => string;

export const createJoinWaitlistSchema = (t: JoinWaitlistTranslator) =>
  z.object({
    // .max(254) before .pipe(): z.email() puts no limit on length, but the
    // table does (RFC 5321's address limit, as a check constraint — see
    // the migration), so without this a 300-character address passes
    // validation and then fails in the database, turning a fixable field
    // error into a generic "try again".
    email: z
      .string()
      .min(1, t("emailRequired"))
      .max(254, t("emailTooLong"))
      .pipe(z.email(t("emailInvalid"))),
  });
```

- [ ] **Step 4: Add the dictionary key**

In `web/src/shared/config/i18n/messages/en-GB.json`, inside `screens.comingSoon`, add after `"emailInvalid"`:

```json
      "emailTooLong": "That email address is too long",
```

- [ ] **Step 5: Write the mapper**

Create `web/src/features/join-waitlist/model/map-join-waitlist-row.ts`:

```ts
import type { JoinWaitlistActionState } from "./schema";

// The row public.join_waitlist returns, in the database's own snake_case
// (see backend/supabase/migrations/20261001120000_waitlist_signups.sql).
// Declared here rather than taken from the generated Supabase types so
// the mapping below stays a pure function the tests can reach without a
// client, a key or a running database.
export type JoinWaitlistRow = {
  already_joined: boolean;
  list_position: number;
};

export const mapJoinWaitlistRow = (
  row: JoinWaitlistRow | null | undefined,
  submitErrorText: string,
): JoinWaitlistActionState => {
  // A counted position always includes the row the function just found or
  // inserted, so the smallest honest value is 1. Nothing came back, or a
  // value outside that — the contract broke, and asking the person to try
  // again beats showing them a place in the list that isn't theirs.
  if (!row || !Number.isInteger(row.list_position) || row.list_position < 1) {
    return { status: "error", formError: submitErrorText };
  }

  return {
    status: "success",
    position: row.list_position,
    alreadyJoined: row.already_joined,
  };
};
```

- [ ] **Step 6: Run the tests and the type check to verify they pass**

```bash
pnpm test && pnpm typecheck
```

Expected: PASS — 7 new assertions in `map-join-waitlist-row.test.ts` on top of the existing suites, and a clean type check (the new `emailTooLong` key is what makes `t("emailTooLong")` type-check against the dictionary).

- [ ] **Step 7: Commit**

```bash
git add web/src/features/join-waitlist/model/ web/src/shared/config/i18n/messages/en-GB.json
git commit -m "$(cat <<'EOF'
feat(waitlist): map the join result into form state

A pure mapper turns the row join_waitlist returns into the action's state,
so the decisions in it — a missing row or a nonsensical position becomes a
plain retry, never a rendered number — are tested without a database. The
shared schema also gains the 254-character limit the table enforces, so an
over-long address fails as a field error rather than a generic one.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
EOF
)"
```

---

### Task 4: Write to the database instead of the log

**Files:**
- Create: `web/src/features/join-waitlist/api/persist-waitlist-signup.ts`
- Modify: `web/src/features/join-waitlist/api/join-waitlist-action.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient` from `@/shared/api/supabase`; `mapJoinWaitlistRow`, `JoinWaitlistRow` from Task 3.
- Produces: `persistWaitlistSignup(email: string): Promise<JoinWaitlistRow | null>`; `joinWaitlist` keeps its existing `(previousState, values)` server-action signature and now returns `position`/`alreadyJoined` on success.

- [ ] **Step 1: Write the persistence module**

Create `web/src/features/join-waitlist/api/persist-waitlist-signup.ts`:

```ts
import "server-only";

import { createServerSupabaseClient } from "@/shared/api/supabase";

import type { JoinWaitlistRow } from "../model/map-join-waitlist-row";

// The single point where a waitlist address is stored. Until ADR 0033 this
// was a console.info with the address in it (ADR 0027); it is now one call
// to public.join_waitlist, the only path into a table no PostgREST role
// can reach directly. The signature is deliberately the same shape ADR
// 0022 anticipated: the caller hands over an address and gets back a
// result, and knows nothing about Supabase.
export const persistWaitlistSignup = async (email: string): Promise<JoinWaitlistRow | null> => {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("join_waitlist", { p_email: email }).single();

  if (error) {
    // `code` and `message` only — deliberately not `details` or `hint`.
    // Postgres quotes the offending value in the detail line of a
    // constraint violation ("Key (email)=(someone@example.com) already
    // exists"), which would put the address straight back into the logs
    // this change exists to get it out of (ADR 0027), while `message`
    // names the constraint without the value. Same rule as the visitor's
    // IP in ADR 0026: the fact, never the value.
    console.error("[join-waitlist] could not record the signup", {
      code: error.code,
      message: error.message,
    });

    return null;
  }

  return data;
};
```

- [ ] **Step 2: Rewrite the action to use it**

In `web/src/features/join-waitlist/api/join-waitlist-action.ts`:

Delete the whole `persistWaitlistSignup` block — its comment and the `console.info` with the address — and replace the import block's tail so the file starts:

```ts
"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { getClientIp } from "@/shared/lib/rate-limit";

import { persistWaitlistSignup } from "./persist-waitlist-signup";
import { checkJoinWaitlistRateLimit } from "./rate-limit";
import { mapJoinWaitlistRow } from "../model/map-join-waitlist-row";
import {
  createJoinWaitlistSchema,
  type JoinWaitlistActionState,
  type JoinWaitlistSubmission,
} from "../model/schema";
```

Replace the final `try` block with:

```ts
  try {
    const row = await persistWaitlistSignup(result.data.email);

    // The fact, never the address — the condition ADR 0027 set for
    // retiring the plaintext log, and the same rule ADR 0026 already
    // applies to the visitor's IP.
    if (row) {
      console.info("[join-waitlist] signup recorded", { alreadyJoined: row.already_joined });
    }

    return mapJoinWaitlistRow(row, t("submitError"));
  } catch {
    return { status: "error", formError: t("submitError") };
  }
```

Leave the honeypot branch, the rate limiting and the zod validation above it exactly as they are — including the bare `return { status: "success" };` for a filled decoy, which is what makes a bot's response indistinguishable from a real one (ADR 0026) and why `position` is optional.

- [ ] **Step 3: Verify the address no longer reaches any log**

```bash
grep -rn 'email' web/src/features/join-waitlist/api/
```

Expected: `email` appears only as the parameter and the `p_email` argument in `persist-waitlist-signup.ts`, and as `result.data.email` / `fieldErrors.email` in the action. **No `console.*` call anywhere in that directory may take an email, an address, or `error.details`.** If one does, the change has not met ADR 0027's condition.

- [ ] **Step 4: Verify it compiles and lints**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean. `steiger` must stay quiet — `features/join-waitlist` importing from `shared/api` is downward, which is allowed.

- [ ] **Step 5: Commit**

```bash
git add web/src/features/join-waitlist/api/
git commit -m "$(cat <<'EOF'
feat(waitlist): store the address in the database, not the log

persistWaitlistSignup now calls join_waitlist through the server client and
returns the signup's place in the list; the console.info that held the
address in plain text is gone, which was the condition ADR 0027 set for
itself. A database error logs the error code and message only — never
`details`, which quotes the offending value.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
EOF
)"
```

---

### Task 5: Show the place in the list

**Files:**
- Modify: `web/src/shared/config/i18n/messages/en-GB.json` (`screens.comingSoon`)
- Modify: `web/src/features/join-waitlist/model/use-join-waitlist.ts`
- Modify: `web/src/widgets/waitlist-form/ui/WaitlistForm.tsx`
- Modify: `docs/decisions/0033-waitlist-signups-table.md` (correct the dictionary-key count)

**Interfaces:**
- Consumes: `JoinWaitlistActionState.position`, `.alreadyJoined` from Task 3.
- Produces: `useJoinWaitlist()` additionally returns `position: number | undefined` and `alreadyJoined: boolean`.

- [ ] **Step 1: Add the two numbered success strings**

In `web/src/shared/config/i18n/messages/en-GB.json`, inside `screens.comingSoon`, keep `successText` as it is and add after it:

```json
      "successTextNumbered": "You're #{position} on the list. We'll email you as soon as it's ready.",
      "alreadyJoinedText": "You're already #{position} on the list. We'll email you as soon as it's ready.",
```

Three keys, not two: `successText` stays as the wording used when there is no number to show. That is not a leftover — the honeypot branch returns a success with no `position` on purpose (ADR 0026), and a bot has to see an ordinary success card, not a broken one.

- [ ] **Step 2: Correct ADR 0033 to match**

In `docs/decisions/0033-waitlist-signups-table.md`, in the «Серверное действие и форма» section, replace the dictionary bullet with:

```markdown
- Словарь: три ключа вместо одного `successText` — `successTextNumbered` и
  `alreadyJoinedText` с параметром `{position}`, и прежний `successText`
  без номера. Третий ключ не рудимент: ветка honeypot намеренно
  возвращает успех без номера (ADR 0026), и бот должен увидеть обычную
  карточку успеха, а не сломанную.
```

- [ ] **Step 3: Expose the number from the hook**

In `web/src/features/join-waitlist/model/use-join-waitlist.ts`, extend the returned object — add these two entries next to `submitted`:

```ts
    submitted: state.status === "success",
    // Undefined when the server returned a success with no number — the
    // honeypot branch does exactly that on purpose (ADR 0026), so the
    // widget needs a wording that works without one.
    position: state.status === "success" ? state.position : undefined,
    alreadyJoined: state.status === "success" && state.alreadyJoined === true,
```

- [ ] **Step 4: Pick the wording in the widget**

In `web/src/widgets/waitlist-form/ui/WaitlistForm.tsx`, take the two new values off the hook:

```ts
  const { control, onSubmit, hasErrors, isPending, submitted, formError, position, alreadyJoined } =
    useJoinWaitlist();
```

and, inside the `render` callback above the `return`, choose the text:

```tsx
        // Three cases, in the order they are decided: a number and the
        // address was already there, a number and it is new, or no number
        // at all (the honeypot branch returns a success without one —
        // ADR 0026 — and a bot must see an ordinary success card).
        const successText =
          position === undefined
            ? t("successText")
            : alreadyJoined
              ? t("alreadyJoinedText", { position })
              : t("successTextNumbered", { position });
```

then pass `successText={successText}` to `<PillForm>` in place of `successText={t("successText")}`.

- [ ] **Step 5: Verify it compiles and lints**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean. The type check is what proves the three dictionary keys exist and that `{position}` is supplied where the message needs it.

- [ ] **Step 6: Verify all three cases in the browser**

```bash
pnpm dev
```

Open `http://localhost:3000/soon` (`DEV_MODE=true` in `envs/web.local.env` means no device shield) and check, in order:

1. A fresh address → "You're #1 on the list. We'll email you as soon as it's ready."
2. **The same address again** → "You're already #1 on the list. …" — and `select count(*) from waitlist_signups;` still returns 1.
3. A second, different address → "You're #2 on the list. …"
4. **The honeypot path**, which is the case no automated test here can reach. In DevTools, make the decoy field visible and type into it, then submit:
   ```js
   document.querySelector('input[name="company"]').value = "bot";
   ```
   Expected: the plain "Thanks! We'll email you as soon as it's ready." card — **no `#undefined` anywhere** — and no new row in the table.

Check the rows with:

```bash
docker exec -i supabase_db_ministry-app psql -U postgres -d postgres \
  -c 'select id, email, created_at from public.waitlist_signups order by id;'
```

- [ ] **Step 7: Commit**

```bash
git add web/src/shared/config/i18n/messages/en-GB.json \
        web/src/features/join-waitlist/model/use-join-waitlist.ts \
        web/src/widgets/waitlist-form/ui/WaitlistForm.tsx \
        docs/decisions/0033-waitlist-signups-table.md
git commit -m "$(cat <<'EOF'
feat(waitlist): tell people where they are in the list

The success card now names the place join_waitlist counted, and says
"already" for an address that was on the list rather than implying a
second signup. A third, number-free wording stays for the honeypot
branch, which returns a success without a position on purpose.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
EOF
)"
```

---

### Task 6: Lock the form while the submission is in flight

**Files:**
- Modify: `web/src/shared/ui/pill-form.tsx`
- Modify: `web/src/widgets/waitlist-form/ui/WaitlistForm.tsx`

**Interfaces:**
- Consumes: `isPending` from `useJoinWaitlist()` (already returned today).
- Produces: `PillFormProps` gains `isPending?: boolean` (default `false`).

- [ ] **Step 1: Add the prop to PillForm**

In `web/src/shared/ui/pill-form.tsx`, add the `Spinner` import next to the others:

```ts
import { Spinner } from "@/shared/ui/spinner";
```

Add to `PillFormProps`, after `isSubmitDisabled`:

```ts
  // Submission in flight: the field stops accepting input and the button
  // shows a spinner. `readOnly` rather than `disabled` on the input — a
  // disabled input leaves the tab order and stops having its value read
  // out, so someone using a screen reader loses what they just typed at
  // the exact moment they are waiting to hear what happened. `readOnly`
  // blocks typing and keeps both.
  isPending?: boolean;
```

Add it to the destructured parameters with its default:

```ts
  isPending = false,
```

- [ ] **Step 2: Apply it to the form, the field and the button**

Still in `pill-form.tsx`, guard the submit handler:

```ts
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A second submit while the first is still running would start a
    // duplicate request — the button is disabled, but Enter in the field
    // still fires the form.
    if (isPending) return;
    const honeypotValue = honeypot
      ? (new FormData(event.currentTarget).get(honeypot.name)?.toString() ?? "")
      : undefined;
    onSubmit?.(value, honeypotValue);
  };
```

Add `aria-busy` to the `<form>`:

```tsx
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isPending || undefined}
        className="flex w-full flex-col gap-2.5"
      >
```

Add `readOnly` to the `<Input>`, after `onBlur`:

```tsx
          readOnly={isPending}
```

And put the spinner in the button:

```tsx
        <Button
          type="submit"
          variant="deep"
          size="role"
          isDisabled={isSubmitDisabled}
          className="h-auto w-full rounded-full py-3.5"
        >
          {isPending ? <Spinner className="size-5" /> : null}
          {cta}
        </Button>
```

`size="role"` already supplies `gap-2`, and the button's base classes already size and pin any `svg` child, so no extra layout classes are needed.

- [ ] **Step 3: Pass it from the widget**

In `web/src/widgets/waitlist-form/ui/WaitlistForm.tsx`, add to the `<PillForm>` props, next to `isSubmitDisabled`:

```tsx
            isPending={isPending}
```

Leave `isSubmitDisabled={hasErrors || isPending}` and `cta={isPending ? t("submitButtonPending") : t("submitButton")}` as they are — both already react to the same flag.

- [ ] **Step 4: Verify it compiles and lints**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean.

- [ ] **Step 5: Verify the locked state in the browser**

With `pnpm dev` running, open `http://localhost:3000/soon`, throttle the network in DevTools (Network → Slow 4G, or add a breakpoint) so the pending state lasts long enough to see, then submit and confirm while it is in flight:

- the button shows a spinner next to "Joining…" and does not respond to clicks;
- typing in the field changes nothing;
- pressing Enter in the field does **not** fire a second request (check the Network panel: one request, not two);
- the field is still focusable and its value still readable — not greyed out and skipped.

- [ ] **Step 6: Commit**

```bash
git add web/src/shared/ui/pill-form.tsx web/src/widgets/waitlist-form/ui/WaitlistForm.tsx
git commit -m "$(cat <<'EOF'
feat(ui): lock PillForm while a submission is in flight

The field goes read-only, the form is marked aria-busy and the button
carries a spinner. readOnly rather than disabled, so the field keeps its
place in the tab order and its value stays readable to a screen reader at
the moment someone is waiting to hear the outcome. Enter in the field no
longer starts a second request.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
EOF
)"
```

---

### Task 7: Name the waitlist address in the privacy notice

**Files:**
- Modify: `web/src/shared/config/i18n/messages/en-GB.json` (`screens.privacy.sections.whatWeStore`, `…why`)
- Modify: `web/src/pages/privacy/ui/PrivacyScreen.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `screens.privacy.sections.whatWeStore.items.item4` and `screens.privacy.sections.why.waitlist`.

- [ ] **Step 1: Add the copy**

In `web/src/shared/config/i18n/messages/en-GB.json`, inside `screens.privacy.sections.whatWeStore.items`, add after `"item3"`:

```json
          "item4": "Your email address, if you joined the waitlist before the app launched"
```

And inside `screens.privacy.sections.why`, add after `"intro"`:

```json
      "waitlist": "If you joined the waitlist before launch, we store that email address for one reason only: to tell you when the app is ready. We do not use it for anything else, and we delete it once the app has launched and everyone on the list has been told.",
```

The legal basis needs no new wording — it is the same consent under Article 6(1)(a) the section already states.

- [ ] **Step 2: Render both**

In `web/src/pages/privacy/ui/PrivacyScreen.tsx`, in the section 1 list, add a fourth item after `item3`:

```tsx
            <li className={listItemClassName}>{t("sections.whatWeStore.items.item4")}</li>
```

In section 2, add the paragraph directly after the `intro` one:

```tsx
          <p className={paragraphClassName}>{t("sections.why.waitlist")}</p>
```

- [ ] **Step 3: Verify it compiles and lints**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean — the type check is what proves both new keys exist in the dictionary.

- [ ] **Step 4: Read the rendered page**

With `pnpm dev` running, open `http://localhost:3000/privacy` and read sections 1 and 2 end to end. The waitlist line must sit in the bullet list of what is stored, and the purpose-and-retention paragraph must read as part of section 2's argument rather than as an afterthought bolted to the end.

- [ ] **Step 5: Commit**

```bash
git add web/src/shared/config/i18n/messages/en-GB.json web/src/pages/privacy/ui/PrivacyScreen.tsx
git commit -m "$(cat <<'EOF'
docs(privacy): name the waitlist address in the notice

The notice listed the account email and the ministry entries but said
nothing about the address people leave before launch — which the app now
actually stores. Section 1 gains the address, section 2 its single purpose
and the point at which it is deleted. Shipped with the table on purpose: a
database collecting addresses and a notice silent about them should not
both exist, even briefly.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
EOF
)"
```

---

### Task 8: Update the repository's own documentation and verify the whole branch

**Files:**
- Modify: `CLAUDE.md` (repository structure, commands table, agreements)

**Interfaces:**
- Consumes: everything above.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Describe the migration and the test in the structure section**

In `CLAUDE.md`, in the repository tree, replace the `backend/` block's `supabase/` line with:

```
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
```

- [ ] **Step 2: Add `db:test` to the commands table**

In the same file, in the «Команды» table, add a row after `pnpm db:start / db:stop / db:reset`:

```
| `pnpm db:test` | pgTAP-тесты схемы (`supabase test db`) — модель доступа к `waitlist_signups` (ADR 0033). Только локальная БД |
```

And extend the `pnpm test` row so it names the new suite:

```
| `pnpm test` | `vitest run` в `web/` — `classifyAccess` (ADR 0016), `buildRobots`/`buildSitemap` (ADR 0032), `mapJoinWaitlistRow` (ADR 0033) |
```

- [ ] **Step 3: Record the access rule as an agreement**

In the «Договорённости» section, add after the migrations bullet:

```markdown
- **Таблица в схеме `public` закрывается полностью, доступ выдаётся
  функцией.** RLS включён, политик нет, `revoke all ... from anon,
  authenticated` выполнен в той же миграции (grants выдаются новой
  таблице автоматически и политиками не отбираются), а наружу выдаётся
  `execute` на `security definer`-функцию с `set search_path = ''` —
  образец задан ADR 0033 на `waitlist_signups`/`join_waitlist`. Отступление
  от него — отдельное решение с отдельным ADR, не правка миграции
  «заодно». Модель доступа проверяется pgTAP-тестами
  (`backend/supabase/tests/`, `pnpm db:test`), а не на глаз.
```

- [ ] **Step 4: Check the whole branch**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm db:test
```

Expected: `steiger` reports no problems, the type check is clean, Vitest passes every suite, pgTAP passes 12 of 12.

Then the production build, which has to run with `DEV_MODE=false` because `env.ts` refuses to start a production build with the shield off:

```bash
T=$(mktemp -d) && sed 's/^DEV_MODE=true/DEV_MODE=false/' envs/web.local.env > "$T/build.env" \
  && (cd web && pnpm exec dotenv -e "$T/build.env" -- pnpm run build)
```

Expected: a successful build. Also confirm no Russian has crept into the code or the dictionary:

```bash
grep -rn '[А-Яа-яЁё]' web/src web/app || echo "clean"
```

Expected: `clean`.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: record the table access model as a project agreement

The repository tree now names the first migration and the pgTAP suite, the
commands table gains `pnpm db:test`, and the agreements section states the
rule ADR 0033 set: a table in `public` is closed outright and access is
handed out by a function, with the model asserted by tests rather than
eyeballed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RAW2Z3TEyorwyYawmu9BQT
EOF
)"
```

- [ ] **Step 6: Report and stop**

Report to the user: what was built, the pgTAP and Vitest counts, the result of the four checks and the build, and the branch name. **Do not merge into `develop`** — ask, and wait for an explicit yes.
