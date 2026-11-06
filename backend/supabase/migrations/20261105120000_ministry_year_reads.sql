-- The two reads the service year screen needs that no existing function
-- answers (ADR 0067, decisions 9 and 5).
--
-- Both are shaped the way ministry_days_total_minutes and
-- ministry_status_year_goal already are: security invoker, so the row
-- level security policy does the scoping; stable, so one statement calls
-- them once; `set search_path = ''`, so every name is schema-qualified.
-- And neither knows that a service year starts in September — the caller
-- passes the boundaries, exactly as it does today (ADR 0061).

-- Minutes per month across a span, one row per month that HAS something
-- recorded.
--
-- The year screen wants twelve figures. The alternative was selecting
-- every day of the year and adding them up in the browser — three
-- hundred rows to produce twelve numbers, against the rule that the
-- database computes the sums (ADR 0062) and wasteful on the wire.
--
-- A month with no rows is ABSENT from the result rather than present as
-- zero, and that is the point: a zero would say somebody looked at that
-- month and recorded nothing, and the screen draws a dash for "not
-- opened" (ADR 0067, decision 8). Turning absence into zero here would
-- destroy the very distinction the screen is built on. Which months the
-- span covers is the caller's business, and it already knows.
--
-- Returns the month as the FIRST DAY of that month (`date_trunc`), which
-- is what every other month-shaped value in this schema is — the
-- primary key of ministry_status_months included — so the client joins
-- them without converting anything.
create or replace function public.ministry_days_monthly_minutes(
  p_from date,
  p_to date
)
returns table (month date, minutes integer)
language sql
stable
security invoker
set search_path = ''
as $$
  -- No coalesce here, unlike the total: group by only produces a group
  -- where a row exists, so sum() is never over nothing.
  select date_trunc('month', m.day)::date as month,
         sum(m.minutes)::integer as minutes
    from public.ministry_days as m
   where m.user_id = (select auth.uid())
     and m.deleted_at is null
     and m.day between p_from and p_to
   group by date_trunc('month', m.day)
   order by month;
$$;

comment on function public.ministry_days_monthly_minutes(date, date) is
  'Minutes the caller recorded in each month of the given span, one row per month that has anything recorded; a month with nothing recorded is absent rather than zero, because the screen tells "nothing recorded" from "zero recorded". The month comes back as its first day. See ADR 0067.';

revoke all on function public.ministry_days_monthly_minutes(date, date)
  from public, anon;
grant execute on function public.ministry_days_monthly_minutes(date, date)
  to authenticated;

-- The status in force for each of the twelve months from a given one,
-- with the monthly goal that status carries.
--
-- The year screen prints each month's own goal beside its hours, and it
-- needs the goal of EVERY month, not just the sum — which is what
-- ministry_status_year_goal gives and keeps giving. The two are kept
-- apart deliberately: the rule "only a regular pioneer's months count
-- towards the year" lives in that function and nowhere else, so this one
-- does not sum anything (ADR 0067, decision 9). A client that added
-- these rows up would be a second authority on the year's goal, and the
-- one in the browser is the one that can be wrong.
--
-- The carry-forward rule is not repeated either: each month is resolved
-- by the one function that owns it, exactly as ministry_status_year_goal
-- does it. A month with no status at all returns no row from that
-- function, and `left join lateral` keeps the month with nulls — unlike
-- the goal's `cross join lateral`, which drops it. The difference is
-- intended: a sum has nothing to add for such a month, while a table has
-- a line to draw for it.
create or replace function public.ministry_status_year_months(
  p_year_start date
)
returns table (month date, status text, monthly_goal_hours smallint)
language sql
stable
security invoker
set search_path = ''
rows 12
as $$
  select months.month::date,
         effective.status,
         effective.monthly_goal_hours
    from generate_series(
           date_trunc('month', p_year_start),
           date_trunc('month', p_year_start) + interval '11 months',
           interval '1 month'
         ) as months(month)
    left join lateral public.ministry_status_for_month(months.month::date)
      as effective on true
   order by months.month;
$$;

comment on function public.ministry_status_year_months(date) is
  'The ministry status in force for each of the twelve months from the given one, with that status'' monthly goal; a month with no status at all comes back with nulls rather than being dropped. Deliberately does not sum: the year''s goal stays with ministry_status_year_goal, which owns the rule that only a regular pioneer''s months count. See ADR 0067.';

revoke all on function public.ministry_status_year_months(date) from public, anon;
grant execute on function public.ministry_status_year_months(date) to authenticated;
