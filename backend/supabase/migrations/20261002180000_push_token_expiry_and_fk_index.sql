-- Two follow-ups to 20261002150000_waitlist_push_notifications.sql.
--
-- (a) An expired push-enrollment token used to stay on the row for ever:
--     the lookup filtered on its age, so an expired token was simply "not
--     found" and never cleared. A stale identifier kept with no expiry
--     contradicts the retention promise on /privacy. The token is now
--     looked up without the age filter and, if it has expired, cleared on
--     first use.
--
-- (b) push_subscriptions.waitlist_signup_id has on delete cascade but no
--     index, so deleting a waitlist row sequentially scanned the child table.

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
  'Consumes a fresh-signup capability token and stores that browser PushSubscription. An expired token is consumed on sight (cleared, nothing stored).';

revoke all on function public.register_waitlist_push_subscription(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_waitlist_push_subscription(uuid, text, text, text)
  to anon;

-- Index the foreign key: without it, the on delete cascade from
-- waitlist_signups scans push_subscriptions sequentially.
create index push_subscriptions_waitlist_signup_id_idx
  on public.push_subscriptions (waitlist_signup_id);
