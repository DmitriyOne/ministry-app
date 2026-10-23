-- The goal for a service year, answered by the database (ADR 0061,
-- decision 5, обновление 2026-10-23).
--
-- It used to be summed in TypeScript from the rows of the year, which
-- meant the carry-forward rule had a second implementation in the app
-- and the screen read raw rows to apply it. The owner asked for the
-- shorter way: one more round trip is cheaper than a second copy of a
-- rule, and this function is where the sum lives now.
--
-- WHICH months count is the other half of the owner's rule: a yearly
-- norm belongs to a regular pioneer and to nobody else. A publisher
-- works at their own pace, a one-month auxiliary pioneer commits to one
-- month, and a regular auxiliary pioneer commits to every month
-- separately — none of them is under a figure for the year, so none of
-- their months is added here. A person who has never been a regular
-- pioneer gets 0, which screens show as a dash rather than "0 hours".
--
-- A part-pioneered year gives the truth about that year rather than the
-- number from the leaflet: appointed in November, the sum is 500, and a
-- stored 600 would have shown them behind from the first day to the
-- last.
--
-- September is NOT known here, and that is deliberate (decision 1): the
-- caller passes the month the year starts in, and the function takes the
-- twelve months from it. The boundary stays in one place, in TypeScript,
-- and the range cannot be stretched by a caller because it is not a
-- range — it is a start.
create or replace function public.ministry_status_year_goal(p_year_start date)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  -- The carry-forward rule is not repeated here: each month is resolved
  -- by the one function that owns it. A month with no status at all
  -- returns no row, and `cross join lateral` then drops that month —
  -- which is the right answer, since it has no goal to add.
  select coalesce(sum(effective.monthly_goal_hours), 0)::integer
    from generate_series(
           date_trunc('month', p_year_start),
           date_trunc('month', p_year_start) + interval '11 months',
           interval '1 month'
         ) as month
   cross join lateral public.ministry_status_for_month(month::date) as effective
   where effective.status = 'regular_pioneer';
$$;

comment on function public.ministry_status_year_goal(date) is
  'Hours a person is aiming for across the twelve months from the given one, counting only the months they are a regular pioneer — the one status with a yearly norm. 0 means no yearly goal at all. See ADR 0061.';

revoke all on function public.ministry_status_year_goal(date) from public, anon;
grant execute on function public.ministry_status_year_goal(date) to authenticated;
