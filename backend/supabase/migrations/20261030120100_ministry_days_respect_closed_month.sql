-- The lock itself (ADR 0066): a day inside a closed month cannot be
-- written any more.
--
-- This is an AMENDMENT of a decision, not an addition to one. ADR 0062
-- says in as many words that a day already lived is freely writable and
-- that this is the point rather than an oversight — the day screen pages
-- backwards precisely so that Tuesday can be filled in on Thursday.
-- That freedom now has an end: the month the person has reported. The
-- ADR is updated to say so, so that the next reader does not take this
-- for a regression and remove it.
--
-- The refusal carries its OWN sqlstate, 55000 (object_not_in_
-- prerequisite_state), and not check_violation like the two fences
-- around it. The reason is a sentence on a phone: the Server Action
-- already turns 23514 into "that day has not happened", and a closed
-- month arriving under the same code would tell the person to check the
-- date — which is not what went wrong. One code, one sentence.
--
-- Everything else in the function is unchanged; it is restated whole
-- because create or replace takes the whole body.
create or replace function public.set_ministry_day_minutes(
  p_day date,
  p_minutes smallint
)
returns public.ministry_days
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  -- UTC named outright rather than left to the session: the fence below
  -- is measured from this value, and a role with another TimeZone
  -- setting would quietly move it.
  v_utc_day date := (now() at time zone 'utc')::date;
  v_row public.ministry_days;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Said here as well as in the constraint so that the answer to a
  -- malformed call names the value; the constraint is what guarantees it.
  if p_minutes is null or p_minutes < 0 or p_minutes > 1440 then
    raise exception 'minutes must be between 0 and 1440: %', p_minutes
      using errcode = 'check_violation';
  end if;

  if p_day > (v_utc_day + 1) then
    raise exception 'that day has not happened yet: %', p_day
      using errcode = 'check_violation';
  end if;

  -- The month, not the day: closing is a statement about the whole
  -- month, and any day inside it is covered by it.
  if public.is_ministry_month_closed(v_user, p_day) then
    raise exception 'month is closed: %',
      date_trunc('month', p_day::timestamp)::date
      using errcode = '55000';
  end if;

  -- do update, not do nothing: the resurrection of deleted_at is what
  -- makes a day usable again after a sweep. The primary key has no
  -- predicate, so a row marked deleted holds its day for good otherwise
  -- — the trap underneath the soft-delete rule (ADR 0047).
  insert into public.ministry_days (user_id, day, minutes)
  values (v_user, p_day, p_minutes)
  on conflict (user_id, day) do update
     set minutes = excluded.minutes,
         deleted_at = null
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.set_ministry_day_minutes(date, smallint) is
  'Records the minutes served on one day for the caller, replacing whatever that day held. Accepts any day up to one past UTC''s, so a day that has not happened is refused while every time zone can write its own today; refuses a day inside a month the caller has closed, with sqlstate 55000. See ADR 0062 and ADR 0066.';
