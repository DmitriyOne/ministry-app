-- How many minutes a span of days holds (ADR 0062, обновление). The one
-- question the day screen and the year screen both ask, of a month and
-- of a service year: the sum of what is recorded between two days.
--
-- In SQL rather than in TypeScript, for the reason the year's goal is
-- (ADR 0061, обновление 2026-10-23): a total computed on the client is a
-- second authority on the same number, and the one in the browser is the
-- one that can be wrong. The screen asks and renders.
--
-- One function with a range rather than one per period. "The month" and
-- "the service year" are the same question with different boundaries,
-- and the boundaries belong to the caller: September is the app's rule
-- (SERVICE_YEAR_FIRST_MONTH), and this function knows nothing about it,
-- exactly as ministry_status_year_goal knows nothing about it.
--
-- security invoker, so the row level security policy on the table does
-- the scoping: the caller sees their own living rows and this sums what
-- they see. The two conditions in the body are therefore belt and
-- braces — they cost nothing (both are index conditions) and they keep
-- the function correct on its own terms rather than on the policy's.
--
-- stable, not volatile: within one statement the same range gives the
-- same answer, which lets the planner call it once.
create or replace function public.ministry_days_total_minutes(
  p_from date,
  p_to date
)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  -- coalesce, because sum() over no rows is null and "nothing recorded"
  -- is zero minutes. A null here would reach a screen as a blank where a
  -- 0:00 belongs, and the app cannot tell the two apart later.
  select coalesce(sum(m.minutes), 0)::integer
    from public.ministry_days as m
   where m.user_id = (select auth.uid())
     and m.deleted_at is null
     and m.day between p_from and p_to;
$$;

comment on function public.ministry_days_total_minutes(date, date) is
  'Minutes the caller recorded between two days, both ends included; zero when nothing is recorded. The caller chooses the span — a month, a service year — because this function knows nothing about either. See ADR 0062.';

revoke all on function public.ministry_days_total_minutes(date, date)
  from public, anon;
grant execute on function public.ministry_days_total_minutes(date, date)
  to authenticated;
