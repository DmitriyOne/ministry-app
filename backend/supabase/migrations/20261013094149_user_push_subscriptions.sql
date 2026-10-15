-- A signed-in person can turn notifications on for their device.
--
-- WHY A COLUMN AND NOT A SECOND TABLE. A browser has one push
-- subscription per service-worker registration — one `endpoint` per
-- device, full stop. Someone who joined the waitlist and later got an
-- account is the SAME device with the SAME endpoint. A separate
-- user_push_subscriptions table would hold a second row for it, the
-- endpoint would stop being unique across the system, and a send would
-- reach that phone twice — with no constraint able to notice, because
-- each table's unique index only sees its own rows. With the owner as a
-- column, the partial unique index on `endpoint` keeps doing its job:
-- one row per device, carrying a waitlist signup, an account, or both.
--
-- (The first answer sketched for this was the separate table, on the
-- grounds that ADR 0043 made `profiles` an exception because its rows
-- have an owner. That reasoning does not reach here: this table is
-- closed completely — RLS with a deny-all policy, no grants, reachable
-- only through these functions under service_role — so nothing ever
-- reads it as the person. The deciding fact is the endpoint, not RLS.)

alter table public.push_subscriptions
  add column user_id uuid references auth.users(id) on delete cascade;

-- Was `not null`: a subscription made from the profile screen has no
-- waitlist signup behind it.
alter table public.push_subscriptions
  alter column waitlist_signup_id drop not null;

-- A row has to belong to someone, or nothing could ever address it.
alter table public.push_subscriptions
  add constraint push_subscriptions_owner_present
  check (waitlist_signup_id is not null or user_id is not null);

-- The sender reads by owner; the index matches the queries that will
-- exist, and carries the same `deleted_at is null` predicate as every
-- other live-row index here (ADR 0047).
create index push_subscriptions_user_live_idx
  on public.push_subscriptions (user_id) where deleted_at is null;

comment on column public.push_subscriptions.user_id is
  'The account this device''s subscription belongs to, when the person turned notifications on while signed in. Null for a subscription made from the waitlist. One row per endpoint either way — see the note at the top of migration 20261013094149.';

-- Turning notifications ON. security invoker with execute for
-- service_role only, like every other write path here (ADR 0037): the
-- Server Action verifies the session and passes the id it verified.
create or replace function public.register_user_push_subscription(
  p_user_id uuid,
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  -- The same shape checks the waitlist function makes. Validating public
  -- input before touching the table is the rule, even when the caller is
  -- our own server.
  if
      p_user_id is null
      or p_endpoint is null
      or p_endpoint not like 'https://%'
      or length(p_endpoint) > 4096
      or p_p256dh is null
      or length(p_p256dh) not between 1 and 512
      or p_auth is null
      or length(p_auth) not between 1 and 512
    then
      return false;
    end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (p_user_id, p_endpoint, p_p256dh, p_auth)
  -- The unique index is partial, so the conflict target repeats its
  -- predicate or Postgres cannot infer the index (ADR 0047).
  on conflict (endpoint) where deleted_at is null
  do update set
    -- waitlist_signup_id is deliberately left alone: if this device
    -- subscribed from the waitlist first, that row keeps its link and
    -- gains an account. One device, one row, two reasons to write to it.
    user_id = excluded.user_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    updated_at = now();

  return true;
end;
$$;

comment on function public.register_user_push_subscription(uuid, text, text, text) is
  'Stores a signed-in person''s PushSubscription for their device, keeping one row per endpoint. Executable by service_role only (ADR 0037).';

revoke all on function public.register_user_push_subscription(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_user_push_subscription(uuid, text, text, text)
  to service_role;

-- Turning notifications OFF.
--
-- `deleted_at`, not a separate "disabled" column, because off means the
-- subscription is GONE: the browser unsubscribes, and the push service
-- stops honouring that endpoint the moment it does. A row flagged
-- "disabled" while the endpoint no longer exists would be a record of
-- something that is not there, and a switch that left a live
-- subscription in place would be a promise the client cannot keep —
-- "off" would mean "we intend not to send", not "this device cannot
-- receive". Re-enabling costs nothing: the OS permission stays granted,
-- so subscribing again is silent and simply produces a new endpoint and
-- a new row.
--
-- If "pause for a while, keep the endpoint" is ever wanted, that is a
-- different state and gets its own column (`muted_at`) — it is not this
-- one wearing another name.
create or replace function public.forget_user_push_subscription(
  p_user_id uuid,
  p_endpoint text
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_updated bigint;
begin
  if p_user_id is null or p_endpoint is null then
    return false;
  end if;

  -- Scoped to the caller's own row: an endpoint is a bearer token for a
  -- device, and knowing one must not be enough to switch off someone
  -- else's notifications.
  update public.push_subscriptions
     set deleted_at = now(),
         updated_at = now()
   where endpoint = p_endpoint
     and user_id = p_user_id
     and deleted_at is null;

  get diagnostics v_updated = row_count;

  return v_updated > 0;
end;
$$;

comment on function public.forget_user_push_subscription(uuid, text) is
  'Marks a signed-in person''s own subscription deleted after the browser has unsubscribed. Executable by service_role only (ADR 0037).';

revoke all on function public.forget_user_push_subscription(uuid, text)
  from public, anon, authenticated;
grant execute on function public.forget_user_push_subscription(uuid, text)
  to service_role;
