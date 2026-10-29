-- A one-month status ENDS the assignment behind it (ADR 0061, update
-- 2026-10-29, the owner's rule).
--
-- What was wrong. The read rule carries a running row forward, and a
-- one-month row does not interrupt it: with September set to regular
-- pioneer and October taken as a one-month auxiliary pioneer, November
-- reached back past October and was a regular pioneer again. For a
-- publisher taking a month of auxiliary pioneering that is exactly
-- right — they return to being a publisher. For a regular pioneer it is
-- nonsense: the appointment is not something taken for a month, so
-- choosing the auxiliary row means the appointment is over.
--
-- The owner found it through the year: after switching to the auxiliary
-- pioneer the service-year goal still read 550, because eleven months
-- were still counted as pioneered.
--
-- So a one-month choice now pins the month AFTER it to publisher. Not
-- to "whatever ran before", which is what freeze_ministry_month_after
-- does for a correction — that function answers a different question
-- ("leave the other months showing what they showed") and is left
-- alone.
--
-- A publisher's own goal survives: if the row still running is a
-- publisher's, the pinned month keeps its hours. What is dropped is an
-- appointment — pioneer or regular auxiliary pioneer — which is the
-- whole point.
create or replace function public.close_ministry_assignment_after(
  p_user uuid,
  p_month date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next date := (p_month + interval '1 month')::date;
  v_running public.ministry_status_months;
begin
  -- A row of their own after this month already governs what follows,
  -- so nothing here can reach past it.
  if exists (
    select 1
      from public.ministry_status_months
     where user_id = p_user and deleted_at is null and month > p_month
  ) then
    return;
  end if;

  select *
    into v_running
    from public.ministry_status_months
   where user_id = p_user
     and deleted_at is null
     and month <= p_month
     and duration = 'until_changed'
   order by month desc
   limit 1;

  -- Nothing running behind it: the next month already reads the default
  -- (publisher, no goal), so writing that out would add a row saying
  -- what silence says.
  if v_running.month is null then
    return;
  end if;

  insert into public.ministry_status_months
    (user_id, month, status, duration, monthly_goal_hours)
  values (
    p_user,
    v_next,
    'publisher',
    'until_changed',
    -- Their own number, and only theirs: a pioneer's 50 belongs to the
    -- appointment that has just ended.
    case when v_running.status = 'publisher' then v_running.monthly_goal_hours end
  )
  on conflict (user_id, month) do update
     set status = excluded.status,
         duration = excluded.duration,
         monthly_goal_hours = excluded.monthly_goal_hours,
         deleted_at = null;
end;
$$;

revoke all on function public.close_ministry_assignment_after(uuid, date)
  from public, anon, authenticated;

-- The only change to set_ministry_status: the call below. Everything
-- else is the function as it was written in 20261021120400, repeated
-- here because create or replace takes the whole body.
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
  v_utc_month date := date_trunc('month', now() at time zone 'utc')::date;
  v_duration text;
  v_goal smallint;
  v_row public.ministry_status_months;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  perform public.assert_ministry_month_writable(v_user, p_month);

  if p_month not between (v_utc_month - interval '1 month')::date
                     and (v_utc_month + interval '1 month')::date then
    raise exception
      'only the month under way can be set: % (use amend_ministry_status_month)',
      p_month using errcode = 'check_violation';
  end if;

  select duration, monthly_goal_hours
    into v_duration, v_goal
    from public.ministry_status_shape(p_status, p_monthly_goal);

  update public.ministry_status_months
     set deleted_at = now()
   where user_id = v_user
     and deleted_at is null
     and month > p_month
     and month > v_utc_month;

  insert into public.ministry_status_months
    (user_id, month, status, duration, monthly_goal_hours)
  values (v_user, p_month, p_status, v_duration, v_goal)
  on conflict (user_id, month) do update
     set status = excluded.status,
         duration = excluded.duration,
         monthly_goal_hours = excluded.monthly_goal_hours,
         deleted_at = null
  returning * into v_row;

  -- The new line. A one-month status ends what ran behind it, so the
  -- month after this one is written out as a publisher rather than
  -- being left to reach back past it. Called after the insert, so the
  -- row above is in place when the next month is resolved.
  if v_duration = 'single_month' then
    perform public.close_ministry_assignment_after(v_user, p_month);
  end if;

  return v_row;
end;
$$;

comment on function public.set_ministry_status(date, text, smallint) is
  'Sets the status for the month under way and every month after it, dropping anything that sat ahead. A one-month status also ends the assignment behind it: the next month is written out as a publisher. Accepts only a month within one of UTC''s. See ADR 0061.';
