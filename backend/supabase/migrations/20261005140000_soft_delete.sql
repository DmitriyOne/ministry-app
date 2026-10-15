-- Soft delete across every table (ADR 0047). Nothing in this project
-- deletes rows from the application — profiles has no delete policy and
-- the closed tables have none at all — so this is about what the owner
-- does in Studio and about every table added from here on.
--
-- "Deleting a person" means banning them in Auth and stamping
-- profiles.deleted_at. The row in auth.users is never removed, which is
-- what makes soft delete possible at all: the foreign keys below cascade,
-- and a real delete there would take the profile and the role with it.
-- The cascade is deliberately left in place as a safety net for a manual
-- delete, not as a workflow.

alter table public.profiles           add column deleted_at timestamptz;
alter table public.user_roles         add column deleted_at timestamptz;
alter table public.waitlist_signups   add column deleted_at timestamptz;
alter table public.push_subscriptions add column deleted_at timestamptz;

-- profiles is the only table here with policies, so this is the only
-- place where "invisible once deleted" can be enforced by the database.
drop policy "read own profile" on public.profiles;
drop policy "update own profile" on public.profiles;

create policy "read own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id and deleted_at is null);

create policy "update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id and deleted_at is null)
  with check ((select auth.uid()) = id and deleted_at is null);

-- A plain UNIQUE would keep a freed address or endpoint reserved forever.
-- The index name says "live" so a reader is not left guessing why the
-- constraint disappeared.
alter table public.waitlist_signups drop constraint waitlist_signups_email_key;
create unique index waitlist_signups_email_live_key
  on public.waitlist_signups (email) where deleted_at is null;

alter table public.push_subscriptions drop constraint push_subscriptions_endpoint_key;
create unique index push_subscriptions_endpoint_live_key
  on public.push_subscriptions (endpoint) where deleted_at is null;

-- The three functions below are the current definitions with the minimum
-- change each: a soft-deleted row must not be found. Language, search_path,
-- volatility and security mode are restated verbatim; privileges survive
-- create or replace.

create or replace function public.join_waitlist(p_email text)
  returns table(already_joined boolean, list_position bigint, push_enrollment_token uuid)
  language plpgsql
  set search_path to ''
as $function$
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
   where s.email = v_email
     and s.deleted_at is null;

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
           and s.deleted_at is null
      ),
      case when v_already then null else v_push_token end;
end;
$function$;

create or replace function public.register_waitlist_push_subscription(p_token uuid, p_endpoint text, p_p256dh text, p_auth text)
  returns boolean
  language plpgsql
  set search_path to ''
as $function$
declare
  v_token_ttl  constant interval := interval '30 minutes';
  v_signup_id  bigint;
  v_created_at timestamptz;
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

  select s.id, s.push_enrollment_token_created_at
    into v_signup_id, v_created_at
    from public.waitlist_signups s
   where s.push_enrollment_token = p_token
     and s.deleted_at is null
   for update;

  -- Unknown token: nothing to clear.
  if v_signup_id is null then
    return false;
  end if;

  -- Expired token: consume it on sight so it does not linger on the row.
  if v_created_at is null or v_created_at < now() - v_token_ttl then
    update public.waitlist_signups
       set push_enrollment_token = null,
           push_enrollment_token_created_at = null
     where id = v_signup_id;

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
  -- The unique index is partial now, so the conflict target must repeat
  -- its predicate or Postgres cannot infer the index.
  on conflict (endpoint) where deleted_at is null
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
$function$;

create or replace function public.custom_access_token_hook(event jsonb)
  returns jsonb
  language plpgsql
  stable security definer
  set search_path to ''
as $function$
declare
  claims jsonb;
  found_role public.app_role;
begin
  claims := event -> 'claims';

  select role into found_role
    from public.user_roles
    where user_id = (event ->> 'user_id')::uuid
      and deleted_at is null;

  -- No row means the role was removed by hand. Signing in must still
  -- work, so the claims go back untouched and the front end applies its
  -- own default (shared/lib/auth).
  if found_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(found_role::text));
  end if;

  return jsonb_build_object('claims', claims);
end;
$function$;

-- Postgres grants execute to PUBLIC on every new function, so the two
-- trigger functions added for v2 were callable by anon and authenticated.
-- Not exploitable — a direct call fails with "trigger functions can only
-- be called as triggers", verified — but the project's rule is that the
-- only execute handed out is the one a caller actually needs (ADR
-- 0033/0037), and an advisor flagging a security definer function in
-- public should not need a case-by-case explanation.
--
-- Verified that revoking does NOT break the triggers: with these grants
-- gone, creating a person through the Auth Admin API still produced both
-- the profile and the role row. Postgres checks execute on a trigger
-- function when the trigger is created, not on every firing.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
