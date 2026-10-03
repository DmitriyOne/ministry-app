-- The two waitlist RPC functions are callable by the trusted server only
-- (ADR 0037).
--
-- Earlier migrations created them as `security definer` with `execute`
-- granted to `anon`, which made them reachable by anyone holding the
-- publishable key — that key ships in the browser bundle, so the rate
-- limiter in the Next.js Server Action could simply be stepped around.
-- Demonstrated, not theorised: five direct POSTs inserted five rows.
--
-- Now `execute` belongs to `service_role` alone, and the Server Action —
-- a trusted server, not a public client — calls them with the secret key.
-- They stay in schema `public` because PostgREST exposes only `public`,
-- so a function in a hidden schema would be unreachable by everyone,
-- including that server. And they become `security invoker`:
-- `service_role` already bypasses RLS and holds the table grants, so it
-- needs none of the definer's privileges, and adding them back would only
-- widen what a mistake could do.

drop function if exists public.join_waitlist(text);
drop function if exists public.register_waitlist_push_subscription(uuid, text, text, text);

create function public.join_waitlist(p_email text)
returns table (
  already_joined boolean,
  list_position bigint,
  push_enrollment_token uuid
)
language plpgsql
security invoker
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
  'Adds an email to the waitlist and returns its position plus a short-lived push-enrollment token only for a fresh signup. Executable by service_role only (ADR 0037).';

revoke all on function public.join_waitlist(text) from public, anon, authenticated;
grant execute on function public.join_waitlist(text) to service_role;

create function public.register_waitlist_push_subscription(
  p_token uuid,
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
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
  'Consumes a fresh-signup capability token and stores that browser PushSubscription. An expired token is consumed on sight. Executable by service_role only (ADR 0037).';

revoke all on function public.register_waitlist_push_subscription(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_waitlist_push_subscription(uuid, text, text, text)
  to service_role;
