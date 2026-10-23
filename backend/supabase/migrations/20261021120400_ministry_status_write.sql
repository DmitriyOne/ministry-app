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
-- "This month, and from here on" — what the sheet in the profile does
-- ---------------------------------------------------------------------
-- A choice applies to the month the person is in, and to every month
-- after it until they choose again. Nothing is ever set ahead: the
-- owner's rule (2026-10-23) is that the status you pick is the status
-- you are on now, changed again as often as you need, so there is no
-- planned month to arrive later and no second state to explain.
--
-- Which month counts as "now" is the phone's answer (ADR 0061), and at
-- the turn of a month the Earth holds two months at once — Kiritimati
-- has entered the next one some fourteen hours before Midway leaves the
-- last. Both are somebody's present, so the fence below is one month
-- either side of UTC's; two months out is nobody's now.
--
-- A caller behind UTC's month is the one the earlier version of this
-- function refused outright, and that refusal was wrong: west of
-- Greenwich the month under way IS the one UTC has just left, so a save
-- came back as "not accepted" for a whole hemisphere once a month. It is
-- accepted now, with one limit kept — it may not reach past the month
-- UTC has already entered.
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
  -- UTC named outright rather than left to the session: the fence below
  -- is measured from this value, and a role with another TimeZone
  -- setting would quietly move it.
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

  -- Nothing may sit ahead of the month under way. Normally there is
  -- nothing to sweep — no caller can write a later month any more — and
  -- it stays as the one thing that makes that true of a row left by a
  -- build that could, or by this person's other phone an hour either
  -- side of a month boundary.
  --
  -- There is no pinning here, and that is the difference between the two
  -- functions rather than an omission: "this is what I am on now" is
  -- meant to carry forward, while amend_ministry_status_month means "that
  -- one month was wrong" and pins what follows so it cannot spread. The
  -- second condition below is the one guard that survives into this
  -- function: a caller behind UTC's month — legitimate west of Greenwich
  -- in the first hours of a month, and the shape a stale clock also
  -- takes — may write their own month, but not reach past the month UTC
  -- has already entered.
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

  return v_row;
end;
$$;

comment on function public.set_ministry_status(date, text, smallint) is
  'Sets the status for the month under way and every month after it, dropping anything that sat ahead. Accepts only a month within one of UTC''s, so nothing can be planned ahead; older months go through amend_ministry_status_month. See ADR 0061.';

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
-- validated path when a screen appears. This is also the only way to
-- reach a month older than the one under way: set_ministry_status now
-- fences itself to the present.
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
