-- The third way a status is written (ADR 0061, update 2026-10-29): "I
-- have been on this status SINCE a given month".
--
-- Why a third function rather than a flag on an existing one: the two
-- that exist are two intentions, and that is what keeps the owner's rule
-- — changing one month must not change the others — true of one of them.
-- This is a third intention, and it contradicts both. set_ministry_status
-- means "this is what I am on now" and refuses any month outside the one
-- under way, so it cannot reach September. amend_ministry_status_month
-- means "that one month was wrong" and PINS the month after it, so a
-- correction cannot spread — which is the exact opposite of what is
-- wanted here.
--
-- What is wanted here: a regular pioneer who signs up in February says
-- the service year began in September, and every month from September
-- on has to carry the pioneer's goal so that the year adds up to its
-- 600 hours. The owner's rule for it (2026-10-29): from the chosen month
-- onwards it is this status, full stop — a status marked in between is
-- dropped rather than kept, because the statement being made covers it.
--
-- What is NOT touched, and cannot be: the hours. They live in
-- ministry_days, this function never names that table, and the same is
-- true of every other status function. What a month loses here is the
-- claim "I was a publisher then" — the hours served in it stay exactly
-- as they were entered and are simply counted against another goal.
--
-- Security is the model of the whole table: no insert, update or delete
-- grant for authenticated, every statement scoped by auth.uid(), and the
-- pgTAP file checks that a write lands on the caller's own row.
-- p_pioneering_cleared_from is the other half of the same question, and
-- it is why both answers of the sheet's sub-question come through this
-- function. "Since September" reaches back; "from this month" reaches
-- back too, only in the other direction — it has to UNSAY an earlier
-- "since September", or the year goes on counting twelve pioneered
-- months while the person has just said there were eleven. The owner
-- found exactly that: picked October, and the year still read 600
-- because the September row nobody had retracted was still there.
--
-- Only pioneer rows are swept by it, and only inside the service year
-- the caller names: a month marked auxiliary pioneer or publisher says
-- nothing about an appointment and carries no yearly norm, so it is
-- left exactly as it is, with its own monthly goal.
create or replace function public.set_ministry_status_from(
  p_month date,
  p_status text,
  p_monthly_goal smallint default null,
  p_pioneering_cleared_from date default null
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

  -- The only fence this function needs, and it is the shared one: not
  -- before the account's own service year, not more than two months past
  -- UTC's. The tighter fence of set_ministry_status — one month either
  -- side of UTC's — is precisely what this function exists to step past,
  -- so it is not repeated here.
  perform public.assert_ministry_month_writable(v_user, p_month);

  select duration, monthly_goal_hours
    into v_duration, v_goal
    from public.ministry_status_shape(p_status, p_monthly_goal);

  if v_duration <> 'until_changed' then
    raise exception
      'a status that lasts one month cannot be backdated: %', p_status
      using errcode = 'check_violation';
  end if;

  -- Everything later is swept, and that IS the statement: "from
  -- September I am a regular pioneer" covers October and November as
  -- much as it covers February. Without the sweep a single row in
  -- between — one month marked publisher — would shadow the new one for
  -- every month after it, and the year would come out at a fraction of
  -- its goal while the screen said nothing about why.
  --
  -- The alternative was weighed and rejected by the owner (2026-10-29):
  -- keeping months that were marked explicitly makes the result depend
  -- on history nobody can see from the sheet.
  update public.ministry_status_months
     set deleted_at = now()
   where user_id = v_user
     and deleted_at is null
     and month > p_month;

  -- "I became a pioneer in October" also means "I was not one in
  -- September". Nothing else is touched — see the note on the argument.
  if p_pioneering_cleared_from is not null then
    update public.ministry_status_months
       set deleted_at = now()
     where user_id = v_user
       and deleted_at is null
       and status = 'regular_pioneer'
       and month >= p_pioneering_cleared_from
       and month < p_month;
  end if;

  -- One row, not twelve: a month without a row of its own reads from the
  -- last running row behind it, so this single row governs every month
  -- from here to the next change.
  --
  -- do update, not do nothing: the primary key has no predicate, so a
  -- row marked deleted would hold this month for good (the trap under
  -- the soft-delete rule, ADR 0047).
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

comment on function public.set_ministry_status_from(date, text, smallint, date) is
  'Sets the status from a given month onwards, dropping any status marked after it; with the fourth argument it also retracts pioneer months before it, inside the service year named. For both answers to "since when have you been a regular pioneer". Hours are untouched — they live in ministry_days. See ADR 0061, update 2026-10-29.';

revoke all on function public.set_ministry_status_from(date, text, smallint, date)
  from public, anon;
grant execute on function public.set_ministry_status_from(date, text, smallint, date)
  to authenticated;
