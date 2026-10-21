-- The two ways a status is written (ADR 0061). Two functions rather than
-- one with a flag, because they are two different intentions and the
-- difference is exactly what keeps the owner's rule — "changing one
-- month must not change the others" — true.
--
-- Both are security definer and both scope every statement by
-- auth.uid(). That is the whole security model of this table: there is
-- no insert, update or delete grant for authenticated, so these two
-- functions are the only way in, and the pgTAP file checks that a write
-- lands on the caller's own row rather than on the first row it finds.
--
-- Both upserts resurrect a row that was marked deleted
-- (deleted_at = null). They have to: the primary key has no predicate,
-- so a row marked deleted holds that month for good otherwise. This is
-- the trap underneath the soft-delete rule (ADR 0047) and the reason the
-- tests plan a month, sweep it away and then choose it again.

-- ---------------------------------------------------------------------
-- "From this month on" — what the sheet in the profile does
-- ---------------------------------------------------------------------
-- The choice is meant to reach forward, so a month planned LATER is
-- dropped: otherwise the new choice would stop dead at a row pinned
-- earlier.
--
-- Which is why this function refuses a month that has already been
-- lived. Found on review, and it was a real defect: the bounds alone
-- allow a past month, and "from March on" would then have swept away
-- every record after March — exactly the cascade the owner forbade.
-- Correcting a month that has already started is a different intention
-- and goes through amend_ministry_status_month below, which pins the
-- following month instead of sweeping it.
--
-- The floor is UTC's current month, and no legitimate call is lost to
-- it: a person always chooses THIS month or a later one, and the
-- furthest any time zone can run behind UTC's month boundary is a few
-- hours of the first day.
create or replace function public.set_ministry_status(
  p_month date,
  p_status text,
  p_monthly_goal smallint default null
)
returns public.ministry_status_months
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_this_month date := date_trunc('month', now())::date;
  v_duration text;
  v_goal smallint;
  v_row public.ministry_status_months;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  perform public.assert_ministry_month_writable(v_user, p_month);

  if p_month < v_this_month then
    raise exception
      'a status cannot start in a month already lived: % (use amend_ministry_status_month)',
      p_month using errcode = 'check_violation';
  end if;

  select duration, monthly_goal_hours
    into v_duration, v_goal
    from public.ministry_status_shape(p_status, p_monthly_goal);

  -- The second condition is redundant while the check above holds, and
  -- it stays anyway: it is the difference between one barrier and none
  -- between a future-looking choice and a month somebody has lived.
  update public.ministry_status_months
     set deleted_at = now()
   where user_id = v_user
     and deleted_at is null
     and month > p_month
     and month > v_this_month;

  insert into public.ministry_status_months
    (user_id, month, status, duration, monthly_goal_hours)
  values (v_user, p_month, p_status, v_duration, v_goal)
  on conflict (user_id, month) do update
     set status = excluded.status,
         duration = excluded.duration,
         monthly_goal_hours = excluded.monthly_goal_hours,
         deleted_at = null
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.set_ministry_status(date, text, smallint) is
  'Sets the status from the given month onwards, dropping any month planned later. Refuses a month already lived. See ADR 0061.';

revoke all on function public.set_ministry_status(date, text, smallint)
  from public, anon;
grant execute on function public.set_ministry_status(date, text, smallint)
  to authenticated;

-- ---------------------------------------------------------------------
-- "That month was wrong" — a correction to a single month
-- ---------------------------------------------------------------------
-- Including a month already lived, which is the point of it. It pins the
-- next month first (freeze_ministry_month_after), so the correction
-- changes exactly one month and nothing that follows.
--
-- No screen offers this in 2.2 — the owner asked for the rule on the
-- server and no UI yet — so it exists to give the correction one
-- validated path when a screen appears. It accepts a future month as
-- well: "just this month, leave the rest" is a coherent thing to want
-- about next month too.
create or replace function public.amend_ministry_status_month(
  p_month date,
  p_status text,
  p_monthly_goal smallint default null
)
returns public.ministry_status_months
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_duration text;
  v_goal smallint;
  v_row public.ministry_status_months;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  perform public.assert_ministry_month_writable(v_user, p_month);

  select duration, monthly_goal_hours
    into v_duration, v_goal
    from public.ministry_status_shape(p_status, p_monthly_goal);

  perform public.freeze_ministry_month_after(v_user, p_month);

  insert into public.ministry_status_months
    (user_id, month, status, duration, monthly_goal_hours)
  values (v_user, p_month, p_status, v_duration, v_goal)
  on conflict (user_id, month) do update
     set status = excluded.status,
         duration = excluded.duration,
         monthly_goal_hours = excluded.monthly_goal_hours,
         deleted_at = null
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.amend_ministry_status_month(date, text, smallint) is
  'Corrects one month, including one already lived, leaving every other month showing exactly what it showed. See ADR 0061.';

revoke all on function public.amend_ministry_status_month(date, text, smallint)
  from public, anon;
grant execute on function public.amend_ministry_status_month(date, text, smallint)
  to authenticated;
