-- Push subscriptions for waitlist launch notifications.
--
-- Security model:
-- - public.push_subscriptions is not directly reachable by anon/authenticated;
-- - a fresh waitlist signup receives a short-lived capability token;
-- - only that token can register a browser PushSubscription;
-- - existing waitlist addresses never receive a token;
-- - the elevated Supabase secret key is reserved for backend/admin delivery.

alter table public.waitlist_signups
  add column push_enrollment_token uuid,
  add column push_enrollment_token_created_at timestamptz;

create unique index waitlist_signups_push_enrollment_token_key
  on public.waitlist_signups (push_enrollment_token)
  where push_enrollment_token is not null;

create table public.push_subscriptions (
  id                 bigint generated always as identity primary key,
  waitlist_signup_id bigint not null
    references public.waitlist_signups(id)
    on delete cascade,
  endpoint           text not null,
  p256dh             text not null,
  auth               text not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint push_subscriptions_endpoint_key unique (endpoint),
  constraint push_subscriptions_endpoint_shape
    check (endpoint like 'https://%' and length(endpoint) <= 4096),
  constraint push_subscriptions_p256dh_length
    check (length(p256dh) between 1 and 512),
  constraint push_subscriptions_auth_length
    check (length(auth) between 1 and 512)
);

comment on table public.push_subscriptions is
  'Browser Web Push subscriptions registered by fresh waitlist signups.';

alter table public.push_subscriptions enable row level security;

revoke all on table public.push_subscriptions from anon, authenticated;
revoke all on sequence public.push_subscriptions_id_seq from anon, authenticated;

-- Rebuild join_waitlist because its return shape changes:
-- the previous version returned two fields, while this version also
-- returns a short-lived push enrollment token for fresh signups.
drop function if exists public.join_waitlist(text);

-- Rebuild join_waitlist so a capability token is returned only for a
-- genuinely new address. The per-email advisory lock closes the race where
-- two identical signups arrive together: the second transaction waits, then
-- sees the row created by the first and is therefore correctly "already".
create function public.join_waitlist(p_email text)
returns table (
  already_joined boolean,
  list_position bigint,
  push_enrollment_token uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email      text := lower(btrim(p_email));
  v_id         bigint;
  v_already    boolean := false;
  v_push_token uuid;
begin
  -- Validate the public input before doing any database work.
  if
      v_email is null
      or length(v_email) > 254
      or v_email not like '%_@_%.__%'
    then
      raise exception 'invalid email'
        using errcode = '22023';
    end if;

  -- Serialize only identical email addresses, not the whole waitlist.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_email, 0)
  );

  select s.id
    into v_id
    from public.waitlist_signups s
   where s.email = v_email;

  if v_id is not null then
    v_already := true;
  else
    v_push_token := gen_random_uuid();

    insert into public.waitlist_signups (
      email,
      push_enrollment_token,
      push_enrollment_token_created_at
    )
    values (
      v_email,
      v_push_token,
      now()
    )
    returning id into v_id;
  end if;

  return query
    select
      v_already,
      (
        select count(*)
          from public.waitlist_signups s
         where s.id <= v_id
      ),
      case when v_already then null else v_push_token end;
end;
$$;

comment on function public.join_waitlist(text) is
  'Adds an email to the waitlist and returns its position plus a short-lived push-enrollment token only for a fresh signup.';

revoke all on function public.join_waitlist(text) from public, anon, authenticated;
grant execute on function public.join_waitlist(text) to anon;

-- Registers one browser PushSubscription against a fresh-signup capability.
-- Tokens expire after 30 minutes and are consumed after successful use.
create or replace function public.register_waitlist_push_subscription(
  p_token uuid,
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signup_id bigint;
begin
  if
      p_endpoint is null
      or p_endpoint not like 'https://%'
      or length(p_endpoint) > 4096
      or p_p256dh is null
      or length(p_p256dh) not between 1 and 512
      or p_auth is null
      or length(p_auth) not between 1 and 512
    then
      return false;
    end if;

  select s.id
    into v_signup_id
    from public.waitlist_signups s
   where s.push_enrollment_token = p_token
     and s.push_enrollment_token_created_at >= now() - interval '30 minutes'
   for update;

  if v_signup_id is null then
    return false;
  end if;

  insert into public.push_subscriptions (
    waitlist_signup_id,
    endpoint,
    p256dh,
    auth
  )
  values (
    v_signup_id,
    p_endpoint,
    p_p256dh,
    p_auth
  )
  on conflict (endpoint)
  do update set
    waitlist_signup_id = excluded.waitlist_signup_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    updated_at = now();

  update public.waitlist_signups
     set push_enrollment_token = null,
         push_enrollment_token_created_at = null
   where id = v_signup_id;

  return true;
end;
$$;

comment on function public.register_waitlist_push_subscription(uuid, text, text, text) is
  'Consumes a fresh-signup capability token and stores that browser PushSubscription.';

revoke all on function public.register_waitlist_push_subscription(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_waitlist_push_subscription(uuid, text, text, text)
  to anon;
