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
